import { MCPAgent } from "../MCPAgent.js";
import { openai } from "@ai-sdk/openai";

// Add Jest type declarations
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeDefined(): R;
      toBe(expected: any): R;
      toBeGreaterThan(expected: number): R;
      rejects: {
        toThrow(): Promise<void>;
      };
    }
  }
}

describe("MCPAgent E2E", () => {
  let agent: MCPAgent;

  beforeAll(async () => {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for tests"
      );
    }

    // Initialize the MCPAgent with the sequential-thinking server
    agent = new MCPAgent({
      mcpServers: {
        "sequential-thinking": {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
          env: {
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
          },
        },
      },
    });

    await agent.initialize();
  });

  afterAll(async () => {
    await agent.close();
  });

  it("should initialize successfully and generate a response", async () => {
    const response = await agent.generateResponse(
      "Solve 23 * 37",
      openai("gpt-4o-mini"),
      10
    );

    expect(response).toBeDefined();
    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(0);
    expect(response).toContain("851");
  }, 60000);
});
