// Types for the MCPAgent library
import {
  GenerateObjectResult,
  GenerateTextOnStepFinishCallback,
  GenerateTextResult,
  LanguageModel,
  ModelMessage,
  ProviderMetadata,
  Schema,
  ToolChoice,
  ToolSet as AiToolSet,
  StopCondition,
  Output,
  TelemetrySettings,
  CallSettings,
  Prompt,
  LanguageModelUsage,
  PrepareStepFunction,
  ToolCallRepairFunction,
} from "ai";
import { ProviderOptions, IdGenerator } from "@ai-sdk/provider-utils";

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
export type TOOLS = AiToolSet;

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

export interface GenerateTextArgsExtra {
  /**
   * Maximum number of steps to take
   */
  maxSteps?: number;

  /**
   * Function to filter which MCP tools should be available
   * @param tool The tool to evaluate
   * @returns Boolean indicating whether to include the tool
   */
  filterMCPTools?: (tool: TOOLS[string]) => boolean;
}
/**
 * Arguments for generating text using an AI model
 */
export interface GenerateTextArgs<
  TOOLS extends ToolSet = any,
  OUTPUT = never,
  OUTPUT_PARTIAL = never
> extends GenerateTextArgsExtra,
    CallSettings,
    Prompt {
  /**
   * The language model to use.
   */
  model?: LanguageModel;

  /**
   * The tools that the model can call. The model needs to support calling tools.
   */
  tools?: TOOLS;

  /**
   * The tool choice strategy. Default: 'auto'.
   */
  toolChoice?: ToolChoice<NoInfer<TOOLS>>;

  /**
   * A system message that will be part of the prompt.
   */
  system?: string;

  /**
   * A simple text prompt. You can either use `prompt` or `messages` but not both.
   */
  prompt?: string;

  /**
   * A list of messages. You can either use `prompt` or `messages` but not both.
   */
  messages?: any[];

  /**
   * Maximum number of tokens to generate.
   */
  maxOutputTokens?: number;

  /**
   * Temperature setting.
   * The value is passed through to the provider. The range depends on the provider and model.
   * It is recommended to set either `temperature` or `topP`, but not both.
   */
  temperature?: number;

  /**
   * Nucleus sampling.
   * The value is passed through to the provider. The range depends on the provider and model.
   * It is recommended to set either `temperature` or `topP`, but not both.
   */
  topP?: number;

  /**
   * Only sample from the top K options for each subsequent token.
   * Used to remove "long tail" low probability responses.
   * Recommended for advanced use cases only. You usually only need to use temperature.
   */
  topK?: number;

  /**
   * Presence penalty setting.
   * It affects the likelihood of the model to repeat information that is already in the prompt.
   * The value is passed through to the provider. The range depends on the provider and model.
   */
  presencePenalty?: number;

  /**
   * Frequency penalty setting.
   * It affects the likelihood of the model to repeatedly use the same words or phrases.
   * The value is passed through to the provider. The range depends on the provider and model.
   */
  frequencyPenalty?: number;

  /**
   * Stop sequences.
   * If set, the model will stop generating text when one of the stop sequences is generated.
   */
  stopSequences?: string[];

  /**
   * The seed (integer) to use for random sampling.
   * If set and supported by the model, calls will generate deterministic results.
   */
  seed?: number;

  /**
   * Maximum number of retries. Set to 0 to disable retries. Default: 2.
   */
  maxRetries?: number;

  /**
   * An optional abort signal that can be used to cancel the call.
   */
  abortSignal?: AbortSignal;

  /**
   * Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.
   */
  headers?: Record<string, string>;

  /**
   * Condition for stopping the generation when there are tool results in the last step.
   * When the condition is an array, any of the conditions can be met to stop the generation.
   *
   * @default stepCountIs(1)
   */
  stopWhen?:
    | StopCondition<NoInfer<TOOLS>>
    | Array<StopCondition<NoInfer<TOOLS>>>;

  /**
   * Optional telemetry configuration (experimental).
   */
  experimental_telemetry?: TelemetrySettings;

  /**
   * Additional provider-specific options. They are passed through
   * to the provider from the AI SDK and enable provider-specific
   * functionality that can be fully encapsulated in the provider.
   */
  providerOptions?: ProviderOptions;

  /**
   * @deprecated Use `activeTools` instead.
   */
  experimental_activeTools?: Array<keyof NoInfer<TOOLS>>;

  /**
   * Limits the tools that are available for the model to call without
   * changing the tool call and result types in the result.
   */
  activeTools?: Array<keyof NoInfer<TOOLS>>;

  /**
   * Optional specification for parsing structured outputs from the LLM response.
   */
  experimental_output?: Output.Output<OUTPUT, OUTPUT_PARTIAL>;

  /**
   * @deprecated Use `prepareStep` instead.
   */
  experimental_prepareStep?: PrepareStepFunction<NoInfer<TOOLS>>;

  /**
   * Optional function that you can use to provide different settings for a step.
   */
  prepareStep?: PrepareStepFunction<NoInfer<TOOLS>>;

  /**
   * A function that attempts to repair a tool call that failed to parse.
   */
  experimental_repairToolCall?: ToolCallRepairFunction<NoInfer<TOOLS>>;

  /**
   * Callback that is called when each step (LLM call) is finished, including intermediate steps.
   */
  onStepFinish?: GenerateTextOnStepFinishCallback<NoInfer<TOOLS>>;

  /**
   * Context that is passed into tool execution.
   *
   * Experimental (can break in patch releases).
   *
   * @default undefined
   */
  experimental_context?: unknown;

  /**
   * Generate a unique ID for each message.
   */
  experimental_generateMessageId?: boolean;

  /**
   * Internal. For test use only. May change without notice.
   */
  _internal?: {
    generateId?: IdGenerator;
    currentDate?: () => Date;
  };
}

export interface GenerateObjectArgs<OBJECT> extends GenerateTextArgs {
  output?: "object" | undefined;

  /**
  The schema of the object that the model should generate.
   */
  schema: z.Schema<OBJECT> | Schema<OBJECT>;
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
    usage: LanguageModelUsage;
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
    model?: LanguageModel;
    system?: string;
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
  messages?: Array<Omit<ModelMessage, "id">>;

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
  filterMCPTools?: (tool: TOOLS[string]) => boolean;
}

type ToolParameters = z.ZodTypeAny | Schema<any>;

export interface ToolConfig {
  type: "tool";
  name: string;
  description: string;
  parameters: ToolParameters;
  execute: (args: any) => Promise<any>;
}

export type WorkflowConfig =
  | MCPConfig
  | MCPAutoConfig
  | AgentConfig
  | ToolConfig;
