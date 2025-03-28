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

// Using STDIO transport (default)
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
const response = await agent.generateResponse({
  prompt: "What is 25 * 25?",
  model: openai("gpt-4o-mini"),
});
console.log(response.text);
await agent.close();
```

### Using SSE Transport

You can also use Server-Sent Events (SSE) transport for connecting to MCP servers:

```typescript
import { MCPAgent } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

const agent = new MCPAgent({
  mcpServers: {
    "sequential-thinking": {
      type: "sse",
      url: "https://your-mcp-server.com/sequential-thinking",
      headers: {
        "x-api-key": "your-api-key",
      },
    },
  },
});

await agent.initialize();
// Use the agent as shown in the previous example
```

## Advanced Examples

### Working with Images

You can include images in your messages:

```typescript
import { MCPAgent } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import fs from "fs";

const agent = new MCPAgent({
  mcpServers: {
    "sequential-thinking": {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
  },
});

await agent.initialize();
const response = await agent.generateResponse({
  model: openai("gpt-4o-mini"),
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Use sequential thinking to solve the following equation",
        },
        {
          type: "image",
          image: fs.readFileSync("./path/to/equation.png"),
        },
      ],
    },
  ],
});
console.log(response.text);
await agent.close();
```

### Working with PDFs

You can also process PDFs:

```typescript
import { MCPAgent } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import fs from "fs";

const agent = new MCPAgent({
  mcpServers: {
    "sequential-thinking": {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
  },
});

await agent.initialize();
const response = await agent.generateResponse({
  model: openai("gpt-4o-mini"),
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Use sequential thinking to solve the following equation",
        },
        {
          type: "file",
          data: fs.readFileSync("./path/to/equation.pdf"),
          filename: "equation.pdf",
          mimeType: "application/pdf",
        },
      ],
    },
  ],
});
console.log(response.text);
await agent.close();
```

## Configuration

The `MCPAgentConfig` interface defines the configuration for the MCPAgent:

```typescript
/**
 * Full configuration for MCPAgent
 * Contains configuration for all MCP servers
 */
interface MCPAgentConfig {
  /**
   * Map of server names to their configurations
   */
  mcpServers: Record<string, MCPServerConfig>;
}

/**
 * Union type for different MCP server configuration types
 */
type MCPServerConfig = StdioConfig | SSEConfig;

/**
 * Configuration for running an MCP server via command line
 */
interface StdioConfig {
  /**
   * Command to execute
   */
  command: string;

  /**
   * Command line arguments
   */
  args?: string[];

  /**
   * Environment variables to set
   */
  env?: Record<string, string>;

  /**
   * Standard error handling configuration
   */
  stderr?: IOType | Stream | number;

  /**
   * Working directory for the command
   */
  cwd?: string;
}

/**
 * Type for handling I/O redirection
 * - overlapped: Overlapped I/O mode
 * - pipe: Pipe I/O to parent process
 * - ignore: Ignore I/O
 * - inherit: Inherit I/O from parent process
 */
type IOType = "overlapped" | "pipe" | "ignore" | "inherit";

/**
 * Configuration for connecting to an MCP server via Server-Sent Events
 */
interface SSEConfig {
  /**
   * Type identifier for SSE configuration
   */
  type: "sse";

  /**
   * URL to connect to
   */
  url: string;

  /**
   * HTTP headers to include in the request
   */
  headers?: Record<string, string>;
}
```

## API Types

The following types are used throughout the API:

```typescript
/**
 * Arguments for generating text using an AI model
 */
interface GenerateTextArgs {
  /**
   * Language model to use
   */
  model?: LanguageModel;

  /**
   * Tools to make available to the model
   */
  tools?: TOOLS;

  /**
   * Tool selection configuration
   */
  toolChoice?: ToolChoice<TOOLS>;

  /**
   * Maximum number of steps to execute
   */
  maxSteps?: number;

  /**
   * System message to include in the prompt
   * Can be used with `prompt` or `messages`
   */
  system?: string;

  /**
   * A simple text prompt
   * You can either use `prompt` or `messages` but not both
   */
  prompt?: string;

  /**
   * A list of messages
   * You can either use `prompt` or `messages` but not both
   */
  messages?: Array<CoreMessage> | Array<Omit<Message, "id">>;

  /**
   * Provider-specific options
   */
  providerOptions?: ProviderMetadata;

  /**
   * Callback function that is called when a step finishes
   */
  onStepFinish?: GenerateTextOnStepFinishCallback<TOOLS>;

  /**
   * Function to filter which MCP tools should be available
   * @param tool The tool to evaluate
   * @returns Boolean indicating whether to include the tool
   */
  filterMCPTools?: (tool: TOOLS) => boolean;
}

/**
 * Tool definition returned by MCP servers
 * Represents a callable function that the agent can use
 */
interface MCPTool {
  /**
   * Name of the tool
   */
  name: string;

  /**
   * Description of what the tool does
   */
  description: string;

  /**
   * Parameter schema for the tool
   */
  parameters: {
    /**
     * JSON Schema type
     */
    type: string;

    /**
     * Properties of the tool parameters
     */
    properties: Record<string, any>;
  };
}

/**
 * Type definition for a collection of tools
 * Maps tool names to their definitions
 */
type ToolSet = Record<string, MCPTool>;

/**
 * Generic type for tool configurations
 */
type TOOLS = Record<string, any>;

/**
 * AI response type to handle OpenAI API responses
 */
type MCPResponse = GenerateTextResult<any, any>;

/**
 * Configuration for MCP functionality
 */
interface MCPConfig {
  /**
   * Map of server names to their configurations
   */
  mcpServers: Record<string, MCPServerConfig>;
}
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

##### `generateResponse(args: GenerateTextArgs): Promise<GenerateTextResult<TOOLS, any>>`

Generates a response using the AI model and the tools from the MCP servers.

Arguments:

- `prompt` - The user's message to respond to
- `model` - The AI model to use (e.g., `openai("gpt-4o-mini")`)
- `maxSteps` - Maximum number of steps for the AI to take (default: 20)
- `tools` - Additional tools to make available to the model
- `filterMCPTools` - Optional function to filter which MCP tools to use
- `onStepFinish` - Optional callback function that is called after each step
- `toolChoice` - Optional parameter to control tool selection behavior
- `providerOptions` - Optional metadata to pass to the provider

##### `close(): Promise<void>`

Closes all server connections.

## License

MIT
