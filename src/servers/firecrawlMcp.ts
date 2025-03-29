import { MCPAutoConfig } from "../types.js";

export const firecrawlMcp: MCPAutoConfig = {
  type: "auto",
  name: "firecrawl-mcp",
  description:
    "A MCP server implementation that integrates with Firecrawl for web scraping capabilities",
  toolsDescription: {
    firecrawl_scrape:
      "Scrape content from a single URL with advanced options like content filtering, mobile/desktop viewport, and custom wait times.",
    firecrawl_batch_scrape:
      "Scrape multiple URLs efficiently with built-in rate limiting and parallel processing.",
    firecrawl_check_batch_status:
      "Check the status of a batch scraping operation.",
    firecrawl_search:
      "Search the web and optionally extract content from search results.",
    firecrawl_crawl:
      "Start an asynchronous crawl with advanced options like depth control and link filtering.",
    firecrawl_extract:
      "Extract structured information from web pages using LLM capabilities.",
    firecrawl_deep_research:
      "Conduct deep web research on a query using intelligent crawling, search, and LLM analysis.",
    firecrawl_generate_llmstxt:
      "Generate a standardized llms.txt file for a given domain defining how LLMs should interact with the site.",
  },
  gitHubRepo: "https://github.com/mendableai/firecrawl-mcp-server",
  license: "MIT",
  parameters: {
    FIRECRAWL_API_KEY: {
      description: "Your FireCrawl API key (required for cloud API)",
      required: true,
    },
    FIRECRAWL_API_URL: {
      description: "Custom API endpoint for self-hosted instances",
      required: false,
    },
    FIRECRAWL_RETRY_MAX_ATTEMPTS: {
      description: "Maximum number of retry attempts",
      required: false,
    },
    FIRECRAWL_RETRY_INITIAL_DELAY: {
      description: "Initial delay in milliseconds before first retry",
      required: false,
    },
    FIRECRAWL_RETRY_MAX_DELAY: {
      description: "Maximum delay in milliseconds between retries",
      required: false,
    },
    FIRECRAWL_RETRY_BACKOFF_FACTOR: {
      description: "Exponential backoff multiplier",
      required: false,
    },
    FIRECRAWL_CREDIT_WARNING_THRESHOLD: {
      description: "Credit usage warning threshold",
      required: false,
    },
    FIRECRAWL_CREDIT_CRITICAL_THRESHOLD: {
      description: "Credit usage critical threshold",
      required: false,
    },
  },
  mcpConfig: {
    command: "npx",
    args: ["-y", "firecrawl-mcp"],
  },
};
