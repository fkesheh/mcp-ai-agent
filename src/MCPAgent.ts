import {
  experimental_createMCPClient as createMCPClient,
  generateText,
  GenerateTextResult,
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
} from "./types.js";
import { filterTools } from "./utils.js";

export class MCPAgent {
  private clients: Record<string, any> = {};
  private tools: Record<string, any> = {};
  private config: (MCPAutoConfig | MCPConfig)[];

  constructor(...configs: (MCPAutoConfig | MCPConfig)[]) {
    this.config = configs;
  }

  private async initializeSdtioServer(name: string, serverConfig: StdioConfig) {
    const transport = new StdioMCPTransport(serverConfig);

    this.clients[name] = await createMCPClient({
      transport,
    });
  }

  private async initializeSSEServer(name: string, serverConfig: SSEConfig) {
    this.clients[name] = await createMCPClient({
      transport: serverConfig,
    });
  }

  private async initializeAutoServer(name: string, autoConfig: MCPAutoConfig) {
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

    const serverConfig = Array.isArray(autoConfig.mcpConfig)
      ? autoConfig.mcpConfig[0]
      : autoConfig.mcpConfig;

    const type = "type" in serverConfig ? serverConfig.type : "stdio";
    switch (type) {
      case "stdio":
        await this.initializeSdtioServer(name, serverConfig as StdioConfig);
        break;
      case "sse":
        await this.initializeSSEServer(name, serverConfig as SSEConfig);
        break;
    }
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

  private async initializeConfigRouter(config: MCPAutoConfig | MCPConfig) {
    if ("type" in config && config.type === "auto") {
      await this.initializeAutoServer(config.name, config);
    } else {
      await this.initializeMcpConfig(config as MCPConfig);
    }
  }

  async initialize(): Promise<void> {
    await Promise.all(
      this.config.map((config) => this.initializeConfigRouter(config))
    );

    await Promise.all(
      Object.entries(this.clients).map(async ([name, client]) => {
        const serverTools = await client.tools();
        this.tools = { ...this.tools, ...serverTools };
      })
    );
  }

  async generateResponse(
    args: GenerateTextArgs
  ): Promise<GenerateTextResult<TOOLS, any>> {
    const filteredTools = filterTools(this.tools, args.filterMCPTools);
    const allTools = { ...filteredTools, ...args.tools };

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
    const closePromises = Object.values(this.clients).map((client) =>
      client ? client.close() : Promise.resolve()
    );
    await Promise.all(closePromises);
    this.clients = {};
  }
}
