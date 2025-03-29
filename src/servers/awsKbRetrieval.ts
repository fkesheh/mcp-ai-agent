import { MCPAutoConfig } from "../types.js";

export const awsKbRetrieval: MCPAutoConfig = {
  type: "auto",
  name: "aws-kb-retrieval",
  description:
    "An MCP server implementation for retrieving information from the AWS Knowledge Base using the Bedrock Agent Runtime. " +
    "Provides RAG (Retrieval-Augmented Generation) capabilities to retrieve context from AWS Knowledge Bases based on queries.",
  toolsDescription: {
    retrieve_from_aws_kb:
      "Perform retrieval operations using the AWS Knowledge Base. Inputs include query (string), " +
      "knowledgeBaseId (string), and n (optional number, default: 3) for number of results to retrieve.",
  },
  gitHubRepo: "https://github.com/modelcontextprotocol/servers",
  license: "MIT",
  parameters: {
    AWS_ACCESS_KEY_ID: {
      description: "AWS access key ID for authentication",
      required: true,
    },
    AWS_SECRET_ACCESS_KEY: {
      description: "AWS secret access key for authentication",
      required: true,
    },
    AWS_REGION: {
      description: "AWS region where the Knowledge Base is located",
      required: true,
    },
  },
  mcpConfig: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-aws-kb-retrieval"],
  },
};
