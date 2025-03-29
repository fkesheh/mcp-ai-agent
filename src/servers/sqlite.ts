import { MCPAutoConfig } from "../types.js";

export const sqlite: MCPAutoConfig = {
  type: "auto",
  name: "sqlite",
  description:
    "A Model Context Protocol (MCP) server implementation that provides database interaction and business intelligence capabilities through SQLite. " +
    "This server enables running SQL queries, analyzing business data, and automatically generating business insight memos. " +
    "Features include executing read/write queries, managing database schema, and generating business insights.",
  toolsDescription: {
    read_query: "Execute SELECT queries to read data from the database.",
    write_query: "Execute INSERT, UPDATE, or DELETE queries to modify data.",
    create_table: "Create new tables in the database.",
    list_tables: "Get a list of all tables in the database.",
    describe_table: "View schema information for a specific table.",
    append_insight: "Add new business insights to the memo resource.",
  },
  gitHubRepo: "https://github.com/modelcontextprotocol/servers",
  license: "MIT",
  parameters: {
    SQLITE_DB_PATH: {
      description: "Path to the SQLite database file",
      required: true,
    },
  },
  mcpConfig: {
    mcpServers: {
      sqlite: {
        command: "docker",
        args: [
          "run",
          "--rm",
          "-i",
          "-v",
          "mcp-test:/mcp",
          "mcp/sqlite",
          "--db-path",
          "${SQLITE_DB_PATH}",
        ],
      },
    },
  },
};
