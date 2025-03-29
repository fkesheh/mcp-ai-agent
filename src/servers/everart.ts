import { MCPAutoConfig } from "../types.js";

export const everart: MCPAutoConfig = {
  type: "auto",
  name: "everart",
  description:
    "An MCP server implementation that integrates with EverArt's API for image generation. " +
    "Supports multiple AI models for image creation with customizable parameters. " +
    "Generated images are opened in the browser and URLs are returned for reference.",
  toolsDescription: {
    generate_image:
      "Generates images based on text prompts with multiple model options. " +
      "Parameters include prompt (required), model ID (optional), and image count (optional). " +
      "Opens the generated image in the browser and returns the URL. " +
      "All images are generated at 1024x1024 resolution.",
  },
  gitHubRepo: "https://github.com/modelcontextprotocol/servers",
  license: "MIT",
  parameters: {
    EVERART_API_KEY: {
      description: "API key for EverArt image generation API",
      required: true,
    },
  },
  mcpConfig: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-everart"],
  },
};
