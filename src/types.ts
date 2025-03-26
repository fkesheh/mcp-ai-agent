// Types for the MCPAgent library
import { GenerateTextResult } from 'ai';

/**
 * Configuration for an MCP server
 */
export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Full configuration for MCPAgent
 */
export interface MCPAgentConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

/**
 * Tool definition returned by MCP servers
 */
export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
  };
}

/**
 * Type definition for tools collection
 */
export type ToolSet = Record<string, MCPTool>;

/**
 * AI response type to handle OpenAI API responses
 */
export type MCPResponse = GenerateTextResult<any, any>;
