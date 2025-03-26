# MCP AI Agent

An AI agentic tool in TypeScript that can use MCP (Modular Context Protocol) servers to provide enhanced functionality.

## Installation

```bash
npm install mcp-ai-agent
```

## Usage

```typescript
import { MCPAgent } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

// Create an MCPAgent with MCP server configuration
const agent = new MCPAgent({
  mcpServers: {
    "sequential-thinking": {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
    // Add other MCP servers as needed
  },
});

async function run() {
  try {
    // Initialize the agent (connects to all servers)
    await agent.initialize();

    // Generate a response using sequential thinking
    const response = await agent.generateResponse(
      "Use sequential thinking to solve this math problem: 23 * 17",
      openai("gpt-4o"),
      20 // maxSteps
    );

    console.log("Response:", response);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the agent when done
    await agent.close();
  }
}

run().catch(console.error);
```

## API

### `MCPAgent`

The main class that manages connections to MCP servers and generates responses.

#### Constructor

```typescript
constructor(config: MCPAgentConfig)
```

- `config` - Configuration object for the MCPAgent

#### Methods

##### `initialize(): Promise<void>`

Initializes the MCPAgent by starting all configured MCP servers and collecting their tools.

##### `generateResponse(userMessage: string, model: any, maxSteps?: number): Promise<string>`

Generates a response using the AI model and the tools from the MCP servers.

- `userMessage` - The user's message to respond to
- `model` - The AI model to use (e.g., `openai("gpt-4o")`)
- `maxSteps` - Maximum number of steps for the AI to take (default: 20)

##### `close(): Promise<void>`

Closes all server connections.

## Configuration

The `MCPAgentConfig` interface defines the configuration for the MCPAgent:

```typescript
interface MCPAgentConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}
```

## License

MIT
