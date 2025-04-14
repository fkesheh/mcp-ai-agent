# MCP AI Agent

A TypeScript library that enables AI agents to leverage MCP (Model Context Protocol) servers for enhanced capabilities. This library integrates with the AI SDK to provide a seamless way to connect to MCP servers and use their tools in AI-powered applications.

## Features

- Connect to multiple MCP servers using different transport methods (STDIO, SSE)
- Automatically discover and use tools from MCP servers
- Integrate with AI SDK for text generation with tool usage
- Filter and combine MCP tools with custom tools
- Preconfigured servers for easy initialization
- Auto-configuration support for simplified setup
- Agents can call other agents for specific tasks
- Agent composition - create specialized agents and combine them
- Named agents with descriptions for improved identification
- Auto-initialization of agents (no need to call initialize explicitly)
- Custom tool definitions directly within agent configuration
- Default model support to simplify multi-agent systems
- System prompt integration for specialized behaviors
- Verbose mode for debugging

## Roadmap

- [x] Basic agent with MCP tools integration
- [x] Auto handled MCP servers
- [x] Multi-agent workflows
- [x] Function based tool handlers
- [ ] Automatic Swagger/OpenAPI to tools conversion (stateless servers simple integration)
- [ ] API Server implementation (call your agent on a server)
- [ ] Observabilty system

## Installation

```bash
npm install mcp-ai-agent
```

For a comprehensive example implementation, check out the [mcp-ai-agent-example](https://github.com/fkesheh/mcp-ai-agent-example) repository.

## Minimal Example

Here's the most basic way to use AI Agent with preconfigured servers:

```typescript
import { AIAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

// Use a preconfigured server
const agent = new AIAgent({
  name: "Sequential Thinking Agent",
  description: "This agent can be used to solve complex tasks",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [Servers.sequentialThinking],
});

// Use the agent
const response = await agent.generateResponse({
  prompt: "What is 25 * 25?",
});
console.log(response.text);
```

### Multi-Agent Workflows (Agent Composition)

You can create specialized agents and compose them into a master agent that can delegate tasks:

```typescript
import { AIAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

// Create specialized agents for different tasks
const sequentialThinkingAgent = new AIAgent({
  name: "Sequential Thinker",
  description:
    "Use this agent to think sequentially and resolve complex problems",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [Servers.sequentialThinking],
});

const braveSearchAgent = new AIAgent({
  name: "Brave Search",
  description: "Use this agent to search the web for the latest information",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [Servers.braveSearch],
});

const memoryAgent = new AIAgent({
  name: "Memory Agent",
  description: "Use this agent to store and retrieve memories",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [
    {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    },
  ],
});

// Create a master agent that can use all specialized agents
const masterAgent = new AIAgent({
  name: "Master Agent",
  description: "An agent that can manage and delegate to specialized agents",
  model: openai("gpt-4o"),
  toolsConfigs: [
    {
      type: "agent",
      agent: sequentialThinkingAgent,
    },
    {
      type: "agent",
      agent: memoryAgent,
    },
    {
      type: "agent",
      agent: braveSearchAgent,
    },
  ],
});

// Use the master agent
const response = await masterAgent.generateResponse({
  prompt: "What is the latest Bitcoin price? Store the answer in memory.",
});

console.log(response.text);

// You can ask the memory agent about information stored by the master agent
const memoryResponse = await masterAgent.generateResponse({
  prompt: "What information have we stored about Bitcoin price?",
});

console.log(memoryResponse.text);
```

## Crew AI style workflow

The MCP AI Agent can be used to create a crew of specialized agents that work together to accomplish complex tasks, similar to the Crew AI pattern. Here's an example of setting up a project management workflow with multiple specialized agents:

```typescript
import { AIAgent, CrewStyleHelpers, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Project details
const projectDetails = {
  project: "Website",
  industry: "Technology",
  team_members: [
    "John Doe (Project Manager)",
    "Jane Doe (Software Engineer)",
    "Bob Smith (Designer)",
    "Alice Johnson (QA Engineer)",
    "Tom Brown (QA Engineer)",
  ],
  project_requirements: [
    "Responsive design for desktop and mobile",
    "Modern user interface",
    "Intuitive navigation system",
    "About Us page",
    "Services page",
    "Contact page with form",
    "Blog section",
    "SEO optimization",
    "Social media integration",
    "Testimonials section",
  ],
};

// Define tasks
const tasks = {
  task_breakdown: (details) => ({
    description: `Break down the ${details.project} project requirements into individual tasks.`,
    expected_output: `A comprehensive list of tasks with descriptions, timelines, and dependencies.`,
  }),
  time_estimation: (details) => ({
    description: `Estimate time and resources for each task in the ${details.project} project.`,
    expected_output: `A detailed estimation report for each task.`,
  }),
  resource_allocation: (details) => ({
    description: `Allocate tasks to team members based on skills and availability.`,
    expected_output: `A resource allocation chart with assignments and timeline.`,
  }),
};

// Create agent
const agent = new AIAgent({
  name: "Sequential Thinking Agent",
  description: "A sequential thinking agent",
  toolsConfigs: [Servers.sequentialThinking],
});

// Define crew members
const crew = {
  planner: {
    name: "Project Planner",
    goal: "Break down the project into actionable tasks",
    backstory: "Experienced project manager with attention to detail",
    agent: agent,
    model: openai("gpt-4o-mini"),
  },
  estimator: {
    name: "Estimation Analyst",
    goal: "Provide accurate time and resource estimations",
    backstory: "Expert in project estimation with data-driven approach",
    agent: agent,
    model: openai("gpt-4o-mini"),
  },
  allocator: {
    name: "Resource Allocator",
    goal: "Optimize task allocation among team members",
    backstory: "Specialist in team dynamics and resource management",
    agent: agent,
    model: openai("gpt-4o-mini"),
  },
};

// Define schema
const planSchema = z.object({
  rationale: z.string(),
  tasks: z.array(
    z.object({
      task_name: z.string(),
      estimated_time_hours: z.number(),
      required_resources: z.array(z.string()),
      assigned_to: z.string(),
      start_date: z.string(),
      end_date: z.string(),
    })
  ),
  milestones: z.array(
    z.object({
      milestone_name: z.string(),
      tasks: z.array(z.string()),
      deadline: z.string(),
    })
  ),
  workload_distribution: z.record(z.number()),
});

async function runWorkflow() {
  // Execute planning task
  const projectPlan = await CrewStyleHelpers.executeTask({
    agent: crew.planner,
    task: tasks.task_breakdown(projectDetails),
  });
  console.log("Project Plan:", projectPlan.text);

  // Execute estimation task
  const timeEstimation = await CrewStyleHelpers.executeTask({
    agent: crew.estimator,
    task: tasks.time_estimation(projectDetails),
    previousTasks: { projectPlan: projectPlan.text },
  });
  console.log("Time Estimation:", timeEstimation.text);

  // Execute allocation task
  const resourceAllocation = await CrewStyleHelpers.executeTask({
    agent: crew.allocator,
    task: tasks.resource_allocation(projectDetails),
    previousTasks: {
      projectPlan: projectPlan.text,
      timeEstimation: timeEstimation.text,
    },
    schema: planSchema,
  });
  console.log(
    "Resource Allocation:",
    JSON.stringify(resourceAllocation.object, null, 2)
  );

  // Cleanup
  await agent.close();
}

runWorkflow().catch(console.error);
```

### Custom Tools

You can easily add custom tools directly to your agent:

```typescript
import { AIAgent } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Create an agent with custom tools
const calculatorAgent = new AIAgent({
  name: "Calculator Agent",
  description: "An agent that can perform mathematical operations",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [
    {
      type: "tool",
      name: "multiply",
      description: "Multiplies two numbers",
      parameters: z.object({
        number1: z.number(),
        number2: z.number(),
      }),
      execute: async (args) => {
        return args.number1 * args.number2;
      },
    },
    {
      type: "tool",
      name: "add",
      description: "Adds two numbers",
      parameters: z.object({
        number1: z.number(),
        number2: z.number(),
      }),
      execute: async (args) => {
        return args.number1 + args.number2;
      },
    },
  ],
});

// Use the agent with custom tools
const response = await calculatorAgent.generateResponse({
  prompt: "What is 125 * 37?",
});
console.log(response.text);
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
import { AIAgent, Servers } from "mcp-ai-agent";

// Use single server
const agent1 = new AIAgent({
  name: "Sequential Thinking Agent",
  description: "Agent for sequential thinking",
  toolsConfigs: [Servers.sequentialThinking],
});

// Combine multiple servers
const agent2 = new AIAgent({
  name: "Multi-Tool Agent",
  description: "Agent with multiple capabilities",
  toolsConfigs: [
    Servers.sequentialThinking,
    Servers.memory,
    Servers.braveSearch,
  ],
});
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
import { AIAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

// Combine multiple preconfigured servers
const agent = new AIAgent({
  name: "Multi-Capability Agent",
  description: "An agent with multiple specialized capabilities",
  toolsConfigs: [Servers.sequentialThinking, Servers.memory, Servers.fetch],
});

const response = await agent.generateResponse({
  prompt: "What is 25 * 25?",
  model: openai("gpt-4o-mini"),
});
console.log(response.text);
```

### Using Stdio Tools Manually

```typescript
import { AIAgent } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

const agent = new AIAgent({
  name: "Custom Server Agent",
  description: "Agent using a manually configured sequential thinking server",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [
    {
      mcpServers: {
        "sequential-thinking": {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
        },
      },
    },
  ],
});

const response = await agent.generateResponse({
  prompt: "What is 25 * 25?",
});
console.log(response.text);
```

### Using SSE Transport

You can also use Server-Sent Events (SSE) transport for connecting to MCP servers:

```typescript
import { AIAgent } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

const agent = new AIAgent({
  name: "SSE Transport Agent",
  description: "Agent using SSE transport for remote server connection",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [
    {
      mcpServers: {
        "sequential-thinking": {
          type: "sse",
          url: "https://your-mcp-server.com/sequential-thinking",
          headers: {
            "x-api-key": "your-api-key",
          },
        },
      },
    },
  ],
});

const response = await agent.generateResponse({
  prompt: "What is 25 * 25?",
});
console.log(response.text);
```

## Advanced Examples

### Working with Images

You can include images in your messages:

```typescript
import { AIAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import fs from "fs";

const agent = new AIAgent({
  name: "Image Processing Agent",
  description: "Agent capable of processing images",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [Servers.sequentialThinking],
});

const response = await agent.generateResponse({
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
import { AIAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import fs from "fs";

const agent = new AIAgent({
  name: "PDF Processing Agent",
  description: "Agent capable of processing PDF documents",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [Servers.sequentialThinking],
});

const response = await agent.generateResponse({
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

You can combine preconfigured servers with manually configured servers:

```typescript
import { AIAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

// Create an agent with both preconfigured and custom servers
const agent = new AIAgent({
  name: "Hybrid Configuration Agent",
  description:
    "Agent that combines preconfigured and custom server configurations",
  model: openai("gpt-4o"),
  toolsConfigs: [
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
    Servers.memory,
  ],
});

const response = await agent.generateResponse({
  prompt:
    "Search for information about AI agents and store the results in memory",
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
import { AIAgent, MCPAutoConfig } from "mcp-ai-agent";
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
const agent = new AIAgent({
  name: "Vector DB Agent",
  description: "Agent with vector database capabilities",
  model: openai("gpt-4o"),
  toolsConfigs: [customVectorDB, Servers.sequentialThinking],
});

const response = await agent.generateResponse({
  prompt:
    "Use sequential thinking to analyze this document and store it in the vector database",
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

The `AIAgent` constructor accepts a name, description, and multiple configuration objects:

```typescript
/**
 * Create a new AIAgent with a name, description, and one or more configurations
 * @param name - The name of the agent
 * @param description - A description of the agent's capabilities
 * @param configs - Configuration objects for various MCP servers and sub-agents
 */
constructor(name: string, description: string, ...configs: WorkflowConfig[])
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

The `AIAgentConfig` interface defines the configuration for the AIAgent:

```typescript
/**
 * Full configuration for AIAgent
 * Contains configuration for all MCP servers
 */
interface AIAgentConfig {
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

### `AIAgent`

The main class that simplifies agent configuration and offers enhanced features.

#### Constructor

```typescript
constructor({
  name,
  description,
  systemPrompt,
  model,
  verbose,
  toolsConfigs
}: {
  name: string;
  description: string;
  systemPrompt?: string;
  model?: LanguageModel;
  verbose?: boolean;
  toolsConfigs?: WorkflowConfig[];
})
```

#### Methods

##### `generateResponse(args: GenerateTextArgs): Promise<GenerateTextResult<TOOLS, any>>`

Generates a response using the AI model and the tools from the MCP servers and custom tools.

Arguments:

- `prompt` - The user's message to respond to
- `model` - Optional: Override the default model
- `system` - Optional: Override the default system prompt
- `maxSteps` - Maximum number of steps for the AI to take (default: 20)
- `tools` - Additional tools to make available to the model
- `filterMCPTools` - Optional function to filter which MCP tools to use
- `onStepFinish` - Optional callback function that is called after each step
- `messages` - Alternative to prompt, allows for rich content messages

##### `generateObject<T>(args: GenerateObjectArgs): Promise<GenerateObjectResult<TOOLS, T>>`

Generates a structured object response using a schema.

Arguments:

- `prompt` - The user's message
- `model` - Optional: Override the default model
- `schema` - Zod schema or JSON schema for the expected response object
- `schemaName` - Optional name for the schema
- `schemaDescription` - Optional description for the schema

##### `close(): Promise<void>`

Closes all server connections.

##### `getInfo(): { name: string; description: string; tools: string[]; agents?: string[]; model?: LanguageModel; }`

Returns information about the agent, including its name, description, available tools, agents, and default model.

## License

MIT
