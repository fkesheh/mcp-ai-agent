import { MCPAutoConfig } from "../types.js";

export const fileSystem: MCPAutoConfig = {
  type: "auto",
  name: "filesystem",
  description:
    "An MCP server implementation for filesystem operations, providing capabilities to read/write files, " +
    "create/list/delete directories, move files/directories, search files, and get file metadata. " +
    "The server only allows operations within directories specified via arguments.",
  toolsDescription: {
    read_file:
      "Read complete contents of a file with UTF-8 encoding. Input: path (string).",
    read_multiple_files:
      "Read multiple files simultaneously. Input: paths (string[]). Failed reads won't stop the entire operation.",
    write_file:
      "Create new file or overwrite existing. Inputs: path (string) for file location, content (string) for file content.",
    edit_file:
      "Make selective edits using advanced pattern matching and formatting. Supports line-based and multi-line content matching, " +
      "whitespace normalization with indentation preservation, and more.",
    create_directory:
      "Create new directory or ensure it exists. Input: path (string). Creates parent directories if needed.",
    list_directory:
      "List directory contents with [FILE] or [DIR] prefixes. Input: path (string).",
    move_file:
      "Move or rename files and directories. Inputs: source (string), destination (string).",
    search_files:
      "Recursively search for files/directories. Inputs: path (string) for starting directory, pattern (string) for search pattern, " +
      "excludePatterns (string[]) for excluding patterns.",
    get_file_info:
      "Get detailed file/directory metadata including size, timestamps, type, and permissions. Input: path (string).",
    list_allowed_directories:
      "List all directories the server is allowed to access. No input required.",
  },
  gitHubRepo: "https://github.com/modelcontextprotocol/servers",
  license: "MIT",
  parameters: {},
  mcpConfig: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "~/Documents"],
  },
};
