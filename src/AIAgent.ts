import {
  experimental_createMCPClient as createMCPClient,
  generateObject,
  GenerateObjectResult,
  generateText,
  GenerateTextResult,
  LanguageModel,
  Schema,
  tool,
} from "ai";

import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio";

import {
  MCPConfig,
  TOOLS,
  GenerateTextArgs,
  StdioConfig,
  SSEConfig,
  MCPAutoConfig,
  AgentConfig,
  WorkflowConfig,
  AIAgentInterface,
  GenerateObjectArgs,
} from "./types.js";

import { z, ZodType } from "zod";
import { filterTools } from "./utils.js";
import { DEFAULT_MAX_STEPS, DEFAULT_MODEL } from "./const.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { toSnakeCase } from "./utils/textUtils.js";
import { openai } from "@ai-sdk/openai";

export class AIAgent implements AIAgentInterface {
  private clients: Record<string, any> = {};
  private tools: Record<string, any> = {};
  private config: WorkflowConfig[];
  private agents: Record<
    string,
    { agent: AIAgentInterface; config: AgentConfig }
  > = {};
  private initialized: boolean = false;
  private name: string;
  private description: string;
  private system?: string;
  private model: LanguageModel;
  private verbose: boolean = false;

  constructor({
    name,
    description,
    toolsConfigs,
    systemPrompt,
    model,
    verbose,
  }: {
    name: string;
    description: string;
    systemPrompt?: string;
    model?: LanguageModel;
    verbose?: boolean;
    toolsConfigs?: WorkflowConfig[];
  }) {
    this.config = toolsConfigs || [];
    this.name = name;
    this.description = description;
    this.system = systemPrompt;
    this.model = model || DEFAULT_MODEL;
    this.verbose = !!verbose;
  }

  private log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    ...args: any[]
  ) {
    if (this.verbose || level === "error") {
      console[level](message, ...args);
    }
  }

  private async initializeSdtioServer(name: string, serverConfig: StdioConfig) {
    this.log("info", "Initializing stdio server", name);

    const transport = new StdioMCPTransport(serverConfig);

    this.clients[name] = await createMCPClient({
      transport,
    });
  }

  private async initializeSSEServer(name: string, serverConfig: SSEConfig) {
    this.log("info", "Initializing sse server", name);

    this.clients[name] = await createMCPClient({
      transport: serverConfig,
    });
  }

  private async initializeAutoServer(name: string, autoConfig: MCPAutoConfig) {
    this.log("info", "Initializing auto server", name);

    // Check if all environment variables are set
    const missingEnvVars = Object.entries(autoConfig.parameters).filter(
      ([key, value]) => value.required && !process.env[key]
    );
    if (missingEnvVars.length > 0) {
      throw new Error(
        `Missing environment variables: ${missingEnvVars
          .map(([key]) => key)
          .join(", ")}`
      );
    }

    const envVars = Object.entries(autoConfig.parameters).reduce(
      (acc: Record<string, string | undefined>, [key, _]) => {
        if (process.env[key]) acc[key] = process.env[key];
        return acc;
      },
      {}
    );

    const serverConfig = Array.isArray(autoConfig.mcpConfig)
      ? autoConfig.mcpConfig[0]
      : autoConfig.mcpConfig;

    const type = "type" in serverConfig ? serverConfig.type : "stdio";
    switch (type) {
      case "stdio":
        await this.initializeSdtioServer(name, {
          ...serverConfig,
          env: envVars,
        } as StdioConfig);
        break;
      case "sse":
        await this.initializeSSEServer(name, serverConfig as SSEConfig);
        break;
    }
  }

  private async initializeAgentConfig(config: AgentConfig) {
    const name = config.name
      ? toSnakeCase(config.name)
      : toSnakeCase(config.agent.getInfo?.()?.name);

    this.log("info", "Initializing agent config", name);

    this.agents[name] = {
      agent: config.agent,
      config,
    };

    // Also add a tool for this agent
    this.tools[`agent_${toSnakeCase(name)}`] = tool({
      description:
        config.description ||
        config.agent.getInfo?.()?.description ||
        `Call the ${config.name} agent for specialized tasks`,
      parameters: z.object({
        context: z
          .string()
          .describe(
            "The context to send to the agent. Add any relevant information the agent needs to know for the task."
          ),
        prompt: z.string().describe("The prompt to send to the agent"),
      }),
      execute: async ({
        context,
        prompt,
      }: {
        context: string;
        prompt: string;
      }) => {
        const response = await config.agent.generateResponse({
          model: config.model || config.agent.getInfo?.()?.model || this.model,
          prompt: `<Context>${context}</Context>\n<Prompt>${prompt}</Prompt>`,
          system: config.system || config.agent.getInfo?.()?.system || "",
          tools: config.tools,
          toolChoice: config.toolChoice,
          maxSteps: config.maxSteps,
          messages: config.messages,
          providerOptions: config.providerOptions,
          onStepFinish: config.onStepFinish,
          filterMCPTools: config.filterMCPTools,
        });

        this.log("info", "Agent response", response.text);

        return response.text;
      },
    });
  }

  private async initializeMcpConfig(config: MCPConfig) {
    try {
      await Promise.all(
        Object.entries(config.mcpServers).map(async ([name, serverConfig]) => {
          const type = "type" in serverConfig ? serverConfig.type : "stdio";
          switch (type) {
            case "stdio":
              await this.initializeSdtioServer(
                name,
                serverConfig as StdioConfig
              );
              break;
            case "sse":
              await this.initializeSSEServer(name, serverConfig as SSEConfig);
              break;
            case "auto":
              await this.initializeAutoServer(
                name,
                serverConfig as MCPAutoConfig
              );
              break;
            default:
              throw new Error(`Unsupported server type for server ${name}`);
          }
        })
      );
    } catch (error) {
      this.log("error", "Error initializing MCP clients:", error);
      await this.close();
      throw error;
    }
  }

  private async initializeConfigRouter(config: WorkflowConfig) {
    if ("type" in config && config.type === "auto") {
      this.log("info", "Config Router: Initializing auto server", config.name);
      await this.initializeAutoServer(config.name, config);
    } else if ("type" in config && config.type === "agent") {
      this.log(
        "info",
        "Config Router: Initializing agent config",
        config.agent.getInfo?.()?.name
      );
      await this.initializeAgentConfig(config);
    } else if ("type" in config && config.type === "tool") {
      this.log("info", "Config Router: Initializing tool", config.name);
      this.tools[toSnakeCase(config.name)] = tool({
        description: config.description,
        parameters: config.parameters,
        execute: config.execute,
      });
    } else {
      this.log(
        "info",
        "Config Router: Initializing MCP config",
        Object.keys(config.mcpServers)
      );
      await this.initializeMcpConfig(config as MCPConfig);
    }
  }

  async initialize(): Promise<void> {
    await Promise.all(
      this.config.map((config) => this.initializeConfigRouter(config))
    );

    await Promise.all(
      Object.entries(this.clients).map(async ([_, client]) => {
        const serverTools = await client.tools();
        this.tools = { ...this.tools, ...serverTools };
      })
    );

    this.initialized = true;
  }

  async generateResponse(
    args: GenerateTextArgs
  ): Promise<GenerateTextResult<TOOLS, any>> {
    if (!this.initialized) {
      await this.initialize();
    }

    const filteredTools = filterTools(this.tools, args.filterMCPTools);
    const allTools = { ...filteredTools, ...args.tools };

    const model = args.model || this.model;

    this.log(
      "info",
      "Generating response with ",
      JSON.stringify(
        {
          name: this.name,
          prompt: args.prompt,
          model: model.modelId,
          allTools: Object.keys(allTools),
          maxSteps: args.maxSteps,
        },
        null,
        2
      )
    );

    try {
      const response = await generateText({
        ...args,
        system: args.system || this.system,
        model,
        tools: allTools,
        maxSteps: args.maxSteps || DEFAULT_MAX_STEPS,
      });

      const finalResponse = { ...response };

      if (!response.text && response.finishReason === "tool-calls") {
        finalResponse.text =
          "The AI completed with tool calls, but no final text was generated. Check if the requested resources were found.";
      }

      return finalResponse;
    } catch (error) {
      this.log(
        "error",
        "Error generating response:",
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }

  async generateObject<OBJECT>(args: GenerateObjectArgs<OBJECT>): Promise<{
    object: OBJECT;
    textGenerationResult: GenerateTextResult<TOOLS, any>;
    objectGenerationResult: GenerateObjectResult<OBJECT>;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    const filteredTools = filterTools(this.tools, args.filterMCPTools);
    const allTools = { ...filteredTools, ...args.tools };

    const model = args.model || this.model;

    let schemaJson;
    if (typeof args.schema === "object" && "jsonSchema" in args.schema) {
      schemaJson = (args.schema as Schema<OBJECT>).jsonSchema;
    } else {
      schemaJson = zodToJsonSchema(args.schema as ZodType<OBJECT>);
    }

    const textResponse = await this.generateResponse({
      ...args,
      system:
        (args.system || this.system) +
        "\n\n<Response Format>\n" +
        `<Schema Name>${args.schemaName}</Schema Name>\n` +
        `<Schema Description>${args.schemaDescription}</Schema Description>\n` +
        `<Schema>${JSON.stringify(schemaJson)}</Schema>\n` +
        "</Response Format>\n\n",
      model,
      tools: allTools,
      maxSteps: args.maxSteps || DEFAULT_MAX_STEPS,
    });

    const response = await generateObject({
      ...args,
      prompt: `Create an object that matches the schema from the response: <Response>${textResponse.text}</Response>`,
      model,
    });

    response.usage.completionTokens += textResponse.usage.completionTokens;
    response.usage.promptTokens += textResponse.usage.promptTokens;
    response.usage.totalTokens += textResponse.usage.totalTokens;

    return {
      object: response.object,
      textGenerationResult: textResponse,
      objectGenerationResult: response,
      usage: {
        promptTokens:
          textResponse.usage.promptTokens + response.usage.promptTokens,
        completionTokens:
          textResponse.usage.completionTokens + response.usage.completionTokens,
        totalTokens:
          textResponse.usage.totalTokens + response.usage.totalTokens,
      },
    };
  }

  async close(): Promise<void> {
    const closePromises = [
      ...Object.values(this.clients).map((client) =>
        client ? client.close() : Promise.resolve()
      ),
      ...Object.values(this.agents).map(({ agent }) =>
        agent ? agent.close() : Promise.resolve()
      ),
    ];

    await Promise.all(closePromises);
    this.clients = {};
    this.agents = {};
  }

  getInfo(): {
    name: string;
    description: string;
    tools: string[];
    agents?: string[];
    model?: LanguageModel;
    system?: string;
  } {
    return {
      name: this.name,
      description: this.description,
      tools: Object.keys(this.tools),
      agents: Object.keys(this.agents),
      model: this.model,
      system: this.system,
    };
  }
}
