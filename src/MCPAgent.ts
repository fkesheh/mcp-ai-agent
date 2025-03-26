import { experimental_createMCPClient, generateText } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { openai } from "@ai-sdk/openai";

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export class MCPAgent {
  private clients: Record<string, any> = {};
  private tools: Record<string, any> = {};

  constructor(private config: MCPConfig) {}

  async initialize(): Promise<void> {
    try {
      await Promise.all(
        Object.entries(this.config.mcpServers).map(
          async ([name, serverConfig]) => {
            const transport = new Experimental_StdioMCPTransport({
              command: serverConfig.command,
              args: serverConfig.args,
              env: serverConfig.env,
            });

            this.clients[name] = await experimental_createMCPClient({
              transport,
            });

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
    userMessage: string,
    model = openai("gpt-4o"),
    maxSteps = 20
  ): Promise<string> {
    try {
      const response = await generateText({
        model,
        tools: this.tools,
        maxSteps,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      // Check if there's actually text in the response
      if (!response.text && response.steps) {
        // If no text but there are steps (tool calls were made)
        const lastStep = response.steps[response.steps.length - 1];
        if (lastStep.finishReason === "tool-calls") {
          return "The AI completed with tool calls, but no final text was generated. Check if the requested resources were found.";
        }
      }

      return response.text || "No response text was generated.";
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
