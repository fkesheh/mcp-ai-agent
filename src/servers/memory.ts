import { MCPAutoConfig } from "../types.js";

export const memory: MCPAutoConfig = {
  type: "auto",
  name: "memory",
  description:
    "A basic implementation of persistent memory using a local knowledge graph",
  toolsDescription: {
    create_entities:
      "Create multiple new entities in the knowledge graph with names, types, and observations. Ignores entities with existing names.",
    create_relations:
      "Create multiple new relations between entities with source, target, and relationship type. Skips duplicate relations.",
    add_observations:
      "Add new observations to existing entities. Returns added observations per entity. Fails if entity doesn't exist.",
    delete_entities:
      "Remove entities and their relations with cascading deletion. Silent operation if entity doesn't exist.",
    delete_observations:
      "Remove specific observations from entities. Silent operation if observation doesn't exist.",
    delete_relations:
      "Remove specific relations from the graph. Silent operation if relation doesn't exist.",
    read_graph:
      "Read the entire knowledge graph structure with all entities and relations.",
    search_nodes:
      "Search for nodes based on query across entity names, types, and observation content. Returns matching entities and their relations.",
    open_nodes:
      "Retrieve specific nodes by name, returning requested entities and relations between them. Silently skips non-existent nodes.",
  },
  gitHubRepo: "https://github.com/modelcontextprotocol/servers",
  license: "MIT",
  parameters: {},
  mcpConfig: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
  },
};
