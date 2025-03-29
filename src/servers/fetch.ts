import { MCPAutoConfig } from "../types.js";

export const fetch: MCPAutoConfig = {
  type: "auto",
  name: "fetch",
  description:
    "A Model Context Protocol server that provides web content fetching capabilities. " +
    "Enables LLMs to retrieve and process content from web pages, converting HTML to markdown for easier consumption. " +
    "Supports content truncation and pagination through start_index parameter.",
  toolsDescription: {
    fetch:
      "Fetches a URL from the internet and extracts its contents as markdown. " +
      "Parameters include url (required), max_length (optional, default: 5000), " +
      "start_index (optional, default: 0), and raw (optional, default: false).",
  },
  gitHubRepo: "https://github.com/modelcontextprotocol/servers",
  license: "MIT",
  parameters: {},
  mcpConfig: {
    command: "uvx",
    args: ["mcp-server-fetch"],
  },
};
