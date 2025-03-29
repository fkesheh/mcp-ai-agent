# MCP AI Agent

A TypeScript library that enables AI agents to leverage MCP (Model Context Protocol) servers for enhanced capabilities. This library integrates with the AI SDK to provide a seamless way to connect to MCP servers and use their tools in AI-powered applications.

## Features

- Connect to multiple MCP servers using different transport methods (STDIO, SSE)
- Automatically discover and use tools from MCP servers
- Integrate with AI SDK for text generation with tool usage
- Filter and combine MCP tools with custom tools
- Preconfigured servers for easy initialization
- Auto-configuration support for simplified setup

## Roadmap

- [x] Basic agent with MCP tools integration
- [x] Auto handled MCP servers
- [ ] MCP auto discovery (?)
- [ ] Multi-agent workflows
- [ ] Automatic Swagger/OpenAPI to tools conversion (stateless servers simple integration)
- [ ] API Server implementation (call your agent on a server)
- [ ] Observabilty system

## Installation

```bash
npm install mcp-ai-agent
```

For a complete example implementation, check out the [mcp-ai-agent-example](https://github.com/fkesheh/mcp-ai-agent-example) repository.

## Minimal Example

Here's the most basic way to use MCP Agent with preconfigured servers:

```typescript
import { MCPAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

// Use a preconfigured server
const agent = new MCPAgent(Servers.sequentialThinking);

// Initialize and use the agent
await agent.initialize();
const response = await agent.generateResponse({
  prompt: "What is 25 * 25?",
  model: openai("gpt-4o-mini"),
});
console.log(response.text);
await agent.close();
```

## Supported MCP Servers

MCP AI Agent comes with preconfigured support for the following servers:

- **Sequential Thinking**: Use to break down complex problems into steps
- **Memory**: Persistent memory for conversation context
- **AWS KB Retrieval**: Retrieve information from AWS Knowledge Bases
- **Brave Search**: Perform web searches using Brave Search API
- **Everart**: Create and manipulate images using AI
- **Fetch**: Retrieve data from URLs
- **Firecrawl MCP**: Web crawling and retrieval capabilities
- **SQLite**: Query and manipulate SQLite databases

### Using Supported Servers

You can easily use any supported server by importing it from the `Servers` namespace:

```typescript
import { MCPAgent, Servers } from "mcp-ai-agent";

// Use single server
const agent1 = new MCPAgent(Servers.sequentialThinking);

// Combine multiple servers
const agent2 = new MCPAgent(
  Servers.sequentialThinking,
  Servers.memory,
  Servers.braveSearch
);
```

### Contributing New Servers

We welcome contributions to add support for additional MCP servers! To add a new server:

1. Create a new file in the `src/servers` directory following the existing patterns
2. Export your server configuration in the file
3. Add your server to the `src/servers/index.ts` exports
4. Submit a pull request with your changes

Example server configuration format:

```typescript
import { MCPAutoConfig } from "../types.js";

export const yourServerName: MCPAutoConfig = {
  type: "auto",
  name: "your-server-name",
  description: "Description of what your server does",
  toolsDescription: {
    toolName1: "Description of first tool",
    toolName2: "Description of second tool",
  },
  parameters: {
    API_KEY: {
      description: "API key for your service",
      required: true,
    },
  },
  mcpConfig: {
    command: "npx",
    args: ["-y", "@your-org/your-mcp-server-package"],
  },
};
```

### Using Multiple Servers

You can initialize the agent with multiple servers:

```typescript
import { MCPAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

// Combine multiple preconfigured servers
const agent = new MCPAgent(
  Servers.sequentialThinking,
  Servers.memory,
  Servers.fetch
);

await agent.initialize();
// Use the agent as shown in the previous example
```

### Using Stdio Tools Manually

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
// Use the agent as shown in the previous example
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
import { MCPAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import fs from "fs";

const agent = new MCPAgent(Servers.sequentialThinking);

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
import { MCPAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import fs from "fs";

const agent = new MCPAgent(Servers.sequentialThinking);

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

### Mixing Preconfigured and Custom Server Configurations

You can combine preconfigured servers (using MCPAutoConfig) with manually configured servers (using MCPConfig):

```typescript
import { MCPAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

// Create an agent with both preconfigured and custom servers
const agent = new MCPAgent(
  // Use a preconfigured server from the Servers namespace
  Servers.sequentialThinking,

  // Add a manually configured server
  {
    mcpServers: {
      "custom-api-server": {
        type: "sse",
        url: "https://api.example.com/mcp-endpoint",
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    },
  },

  // Add another preconfigured server
  Servers.memory
);

await agent.initialize();

// Now you can use tools from both the preconfigured and custom servers
const response = await agent.generateResponse({
  prompt:
    "Search for information about AI agents and store the results in memory",
  model: openai("gpt-4o"),
  // Optionally filter which tools to use
  filterMCPTools: (tool) => {
    // Only use specific tools from the available servers
    return ["sequentialThinking", "memory", "customApiSearch"].includes(
      tool.name
    );
  },
});

console.log(response.text);
await agent.close();
```

### Creating a Custom Auto-Configured Server

You can also create and use your own auto-configured server library definition:

```typescript
import { MCPAgent, MCPAutoConfig } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

// Define a custom server configuration
const customVectorDB: MCPAutoConfig = {
  type: "auto",
  name: "vector-db",
  description: "Vector database tools for semantic search and retrieval",
  toolsDescription: {
    vectorSearch:
      "Search for semantically similar documents in the vector database",
    vectorStore: "Store documents in the vector database with embeddings",
    vectorDelete: "Delete documents from the vector database",
  },
  parameters: {
    VECTOR_DB_API_KEY: {
      description: "API key for the vector database service",
      required: true,
    },
    VECTOR_DB_URL: {
      description: "URL of the vector database service",
      required: true,
    },
  },
  mcpConfig: {
    command: "npx",
    args: ["-y", "@your-org/vector-db-mcp-server"],
    env: {
      VECTOR_DB_API_KEY: process.env.VECTOR_DB_API_KEY || "",
      VECTOR_DB_URL: process.env.VECTOR_DB_URL || "",
    },
  },
};

// Create an agent with the custom server and a preconfigured server
const agent = new MCPAgent(customVectorDB, Servers.sequentialThinking);

await agent.initialize();

// Use the tools from both servers
const response = await agent.generateResponse({
  prompt:
    "Use sequential thinking to analyze this document and store it in the vector database",
  model: openai("gpt-4o"),
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this document and store the key points in the vector database",
        },
        {
          type: "file",
          data: fs.readFileSync("./path/to/document.pdf"),
          filename: "document.pdf",
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

The `MCPAgent` constructor accepts multiple configuration objects:

```typescript
/**
 * Create a new MCPAgent with one or more configurations
 * @param configs - Configuration objects for various MCP servers
 */
constructor(...configs: (MCPAutoConfig | MCPConfig)[])
```

### Auto Configuration

The `MCPAutoConfig` interface defines auto-configuration for MCP servers:

```typescript
/**
 * Auto configuration for MCP servers
 */
interface MCPAutoConfig {
  /**
   * Type identifier for auto configuration
   */
  type: "auto";

  /**
   * The name of the MCP server
   */
  name: string;

  /**
   * The description of the MCP server
   */
  description: string;

  /**
   * Optional GitHub repository URL for the MCP server
   */
  gitHubRepo?: string;

  /**
   * The license of the MCP server
   */
  license?: string;

  /**
   * Description of tools provided by the server
   */
  toolsDescription: Record<string, string>;

  /**
   * Required parameters for the server
   */
  parameters: Record<string, { description: string; required: boolean }>;

  /**
   * The configuration for the MCP server
   */
  mcpConfig: MCPServerConfig | MCPServerConfig[];
}
```

### Standard Configuration

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
  mcpServers: Record<string, MCPServerConfig | MCPAutoConfig>;
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
```

## API

### `MCPAgent`

The main class that manages connections to MCP servers and generates responses.

#### Constructor

```typescript
constructor(...configs: (MCPAutoConfig | MCPConfig)[])
```

- `configs` - One or more configuration objects for the MCPAgent

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
