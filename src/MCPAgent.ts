import {
  experimental_createMCPClient as createMCPClient,
  generateText,
  GenerateTextResult,
  tool,
} from "ai";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio";
import { openai } from "@ai-sdk/openai";
import {
  MCPConfig,
  TOOLS,
  GenerateTextArgs,
  StdioConfig,
  SSEConfig,
  MCPAutoConfig,
  AgentConfig,
  WorkflowConfig,
  AIAgent,
} from "./types.js";
import { z } from "zod";
import { filterTools } from "./utils.js";
export class MCPAgent implements AIAgent {
  private clients: Record<string, any> = {};
  private tools: Record<string, any> = {};
  private config: WorkflowConfig[];
  private agents: Record<string, { agent: AIAgent; config: AgentConfig }> = {};
  private initialized: boolean = false;
  private name: string;
  private description: string;

  constructor(name: string, description: string, ...configs: WorkflowConfig[]) {
    this.config = configs;
    this.name = name;
    this.description = description;
  }

  private async initializeSdtioServer(name: string, serverConfig: StdioConfig) {
    console.debug("Initializing stdio server", name);

    const transport = new StdioMCPTransport(serverConfig);

    this.clients[name] = await createMCPClient({
      transport,
    });
  }

  private async initializeSSEServer(name: string, serverConfig: SSEConfig) {
    console.debug("Initializing sse server", name);

    this.clients[name] = await createMCPClient({
      transport: serverConfig,
    });
  }

  private async initializeAutoServer(name: string, autoConfig: MCPAutoConfig) {
    console.debug("Initializing auto server", name);

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
    const name =
      config.name ||
      config.agent.getInfo?.()?.name ||
      Math.random().toString(36).substring(2, 15);

    console.debug("Initializing agent config", name);

    this.agents[name] = {
      agent: config.agent,
      config,
    };

    // Also add a tool for this agent
    this.tools[`agent_${name.toLowerCase().replace(" ", "_")}`] = tool({
      description:
        config.description ||
        config.agent.getInfo?.()?.description ||
        `Call the ${config.name} agent for specialized tasks`,
      parameters: z.object({
        prompt: z.string().describe("The prompt to send to the agent"),
        systemMessage: z
          .string()
          .optional()
          .describe("Optional system message to guide the agent's behavior"),
      }),
      execute: async ({
        prompt,
        systemMessage,
      }: {
        prompt: string;
        systemMessage?: string;
      }) => {
        // Implementation will be handled elsewhere
        const response = await config.agent.generateResponse({
          prompt,
          system: systemMessage,
        });

        console.debug("Agent response", response.text);

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
      console.error("Error initializing MCP clients:", error);
      await this.close();
      throw error;
    }
  }

  private async initializeConfigRouter(config: WorkflowConfig) {
    if ("type" in config && config.type === "auto") {
      console.debug("Config Router: Initializing auto server", config.name);
      await this.initializeAutoServer(config.name, config);
    } else if ("type" in config && config.type === "agent") {
      console.debug(
        "Config Router: Initializing agent config",
        config.agent.getInfo?.()?.name
      );
      await this.initializeAgentConfig(config);
    } else {
      console.debug(
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

    console.debug("allTools", Object.keys(allTools));

    try {
      const response = await generateText({
        ...args,
        model: args.model || openai("gpt-4o"),
        tools: allTools,
        maxSteps: args.maxSteps || 20,
      });

      const finalResponse = { ...response };

      if (!response.text && response.finishReason === "tool-calls") {
        finalResponse.text =
          "The AI completed with tool calls, but no final text was generated. Check if the requested resources were found.";
      }

      return finalResponse;
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
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
  } {
    return {
      name: this.name,
      description: this.description,
      tools: Object.keys(this.tools),
      agents: Object.keys(this.agents),
    };
  }
}
