import { MCPAutoConfig } from "../types.js";

export const braveSearch: MCPAutoConfig = {
  type: "auto",
  name: "brave-search",
  description:
    "An MCP server implementation that integrates the Brave Search API, providing both web and local search capabilities. " +
    "Features include web search with pagination and filtering, local search for businesses and services, " +
    "flexible content filtering, and smart fallbacks from local to web search when needed.",
  toolsDescription: {
    brave_web_search:
      "Execute web searches with pagination and filtering. Inputs include query (string), " +
      "count (optional number, max 20), and offset (optional number, max 9).",
    brave_local_search:
      "Search for local businesses and services. Inputs include query (string) and count (optional number, max 20). " +
      "Automatically falls back to web search if no local results found.",
  },
  gitHubRepo: "https://github.com/modelcontextprotocol/servers",
  license: "MIT",
  parameters: {
    BRAVE_API_KEY: {
      description: "API key for Brave Search API",
      required: true,
    },
  },
  mcpConfig: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
  },
};
