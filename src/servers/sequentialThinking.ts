import { MCPAutoConfig } from "../types.js";

export const sequentialThinking: MCPAutoConfig = {
  type: "auto",
  name: "sequential-thinking",
  description:
    "An MCP server implementation that provides a tool for dynamic and reflective problem-solving through a structured thinking process. " +
    "Features include breaking down complex problems into manageable steps, revising thoughts as understanding deepens, " +
    "branching into alternative reasoning paths, and adjusting the total number of thoughts dynamically.",
  toolsDescription: {
    sequential_thinking:
      "Facilitates a detailed, step-by-step thinking process for problem-solving and analysis. " +
      "Inputs include the current thought, thought number, total thoughts needed, and options for revisions and branching. " +
      "Designed for breaking down complex problems, planning with room for revision, and maintaining context over multiple steps.",
  },
  gitHubRepo: "https://github.com/modelcontextprotocol/servers",
  license: "MIT",
  parameters: {},
  mcpConfig: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
  },
};
