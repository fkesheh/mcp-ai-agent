// Types for the MCPAgent library
import {
  CoreMessage,
  GenerateObjectResult,
  GenerateTextOnStepFinishCallback,
  GenerateTextResult,
  LanguageModel,
  Message,
  ProviderMetadata,
  Schema,
  ToolChoice,
} from "ai";

import Stream from "node:stream";
import { z } from "zod";

/**
 * Full configuration for MCPAgent
 * Contains configuration for all MCP servers
 */
export interface MCPAgentConfig {
  /**
   * Map of server names to their configurations
   */
  mcpServers: Record<string, MCPServerConfig>;
}

/**
 * Tool definition returned by MCP servers
 * Represents a callable function that the agent can use
 */
export interface MCPTool {
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
export type ToolSet = Record<string, MCPTool>;

/**
 * AI response type to handle OpenAI API responses
 */
export type MCPResponse = GenerateTextResult<any, any>;

/**
 * Generic type for tool configurations
 */
export type TOOLS = Record<string, any>;

/**
 * Type for handling I/O redirection
 * - overlapped: Overlapped I/O mode
 * - pipe: Pipe I/O to parent process
 * - ignore: Ignore I/O
 * - inherit: Inherit I/O from parent process
 */
export type IOType = "overlapped" | "pipe" | "ignore" | "inherit";

/**
 * Configuration for running an MCP server via command line
 */
export interface StdioConfig {
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
 * Configuration for connecting to an MCP server via Server-Sent Events
 */
export interface SSEConfig {
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

/**
 * Union type for different MCP server configuration types
 */
export type MCPServerConfig = StdioConfig | SSEConfig;

/**
 * Configuration for MCP functionality
 */
export interface MCPConfig {
  /**
   * Map of server names to their configurations
   */
  mcpServers: Record<string, MCPServerConfig | MCPAutoConfig>;
}

/**
 * Arguments for generating text using an AI model
 */
export interface GenerateTextArgs {
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

export interface GenerateObjectArgs<OBJECT> extends GenerateTextArgs {
  output?: "object" | undefined;

  /**
  The schema of the object that the model should generate.
   */
  schema: z.Schema<OBJECT, z.ZodTypeDef, any> | Schema<OBJECT>;
  /**
  Optional name of the output that should be generated.
  Used by some providers for additional LLM guidance, e.g.
  via tool or schema name.
   */
  schemaName?: string;
  /**
  Optional description of the output that should be generated.
  Used by some providers for additional LLM guidance, e.g.
  via tool or schema description.
   */
  schemaDescription?: string;
  /** 
  The mode to use for object generation.

  The schema is converted into a JSON schema and used in one of the following ways

  - 'auto': The provider will choose the best mode for the model.
  - 'tool': A tool with the JSON schema as parameters is provided and the provider is instructed to use it.
  - 'json': The JSON schema and an instruction are injected into the prompt. If the provider supports JSON mode, it is enabled. If the provider supports JSON grammars, the grammar is used.

  Please note that most providers do not support all modes.

  Default and recommended: 'auto' (best mode for the model).
   */
  mode?: "auto" | "json" | "tool";
}

export interface MCPAutoConfig {
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
   * The description of the MCP server
   */
  toolsDescription: Record<string, string>;

  /**
   * The parameters of the MCP server
   */
  parameters: Record<string, { description: string; required: boolean }>;

  /**
   * The configuration for the MCP server
   */
  mcpConfig: MCPServerConfig | MCPServerConfig[];
}

export interface AIAgentInterface {
  /**
   * Initializes the agent's resources and tools
   */
  initialize(): Promise<void>;

  /**
   * Generates a response using the agent's capabilities
   * @param args Configuration for text generation
   */
  generateResponse(
    args: GenerateTextArgs
  ): Promise<GenerateTextResult<TOOLS, any>>;

  /**
   * Generates an object using the agent's capabilities
   * @param args Configuration for object generation
   */
  generateObject<OBJECT>(args: GenerateObjectArgs<OBJECT>): Promise<{
    object: OBJECT;
    textGenerationResult: GenerateTextResult<TOOLS, any>;
    objectGenerationResult: GenerateObjectResult<OBJECT>;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }>;

  /**
   * Cleans up and closes all resources used by the agent
   */
  close(): Promise<void>;

  /**
   * Returns information about the agent
   */
  getInfo?(): {
    name: string;
    description: string;
    tools: string[];
    agents?: string[];
  };
}

export interface AgentConfig {
  /**
   * Type identifier for agent configuration
   */
  type: "agent";

  /**
   * Optional name of the agent for reference (override the agent name)
   */
  name?: string;

  /**
   * Description of the agent's purpose and capabilities (override the agent description)
   */
  description?: string;

  /**
   * The agent instance to be used
   */
  agent: AIAgentInterface;

  /**
   * Optional model to use for this specific agent
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

export type WorkflowConfig = MCPConfig | MCPAutoConfig | AgentConfig;
