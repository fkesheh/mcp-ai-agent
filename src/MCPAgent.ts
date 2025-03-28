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
} from "./types.js";
import { filterTools } from "./utils.js";

export class MCPAgent {
  private clients: Record<string, any> = {};
  private tools: Record<string, any> = {};

  constructor(private config: MCPConfig) {}

  async initialize(): Promise<void> {
    try {
      await Promise.all(
        Object.entries(this.config.mcpServers).map(
          async ([name, serverConfig]) => {
            const type = "type" in serverConfig ? serverConfig.type : "stdio";
            switch (type) {
              case "stdio":
                const transport = new StdioMCPTransport(
                  serverConfig as StdioConfig
                );

                this.clients[name] = await createMCPClient({
                  transport,
                });
                break;
              case "sse":
                this.clients[name] = await createMCPClient({
                  transport: serverConfig as SSEConfig,
                });
                break;
              default:
                throw new Error(`Unsupported server type for server ${name}`);
            }
            const serverTools = await this.clients[name].tools();
            this.tools = { ...this.tools, ...serverTools };
          }
        )
      );
    } catch (error) {
      console.error("Error initializing MCP clients:", error);
      await this.close();
      throw error;
    }
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
