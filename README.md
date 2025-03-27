# MCP AI Agent

An AI agentic tool in TypeScript that can use MCP (Modular Context Protocol) servers to provide enhanced functionality.

## Installation

```bash
npm install mcp-ai-agent
```

For a complete example implementation, check out the [mcp-ai-agent-example](https://github.com/fkesheh/mcp-ai-agent-example) repository.

## Minimal Example

Here's the most basic way to use MCP Agent:

```typescript
import { MCPAgent } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

const agent = new MCPAgent({
  mcpServers: {
    "sequential-thinking": {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
  },
});

// Initialize and use the agent
await agent.initialize();
const response = await agent.generateResponse(
  "What is 25 * 25?",
  openai("gpt-4o")
);
console.log(response);
await agent.close();
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

just test
