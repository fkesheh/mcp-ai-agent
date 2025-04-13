import { AIAgent } from "../AIAgent.js";
import { Servers } from "../index.js";
import { openai } from "@ai-sdk/openai";
import fs from "fs";
import { AIAgentInterface } from "../types.js";
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

describe("Agent E2E", () => {
  let sequentialThinkingAgent: AIAgentInterface;
  let memoryAgent: AIAgentInterface;
  let masterAgent: AIAgentInterface;
  let braveSearchAgent: AIAgentInterface;

  beforeAll(async () => {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for tests"
      );
    }

    // The sequential thinking agent
    sequentialThinkingAgent = new AIAgent({
      name: "Sequential Thinker",
      description:
        "Use this agent to think sequentially and resolve complex problems",
      toolsConfigs: [Servers.sequentialThinking],
    });

    // The brave search agent
    braveSearchAgent = new AIAgent({
      name: "Brave Search",
      description:
        "Use this agent to search the web for the latest information",
      toolsConfigs: [Servers.braveSearch],
    });

    // The memory agent
    memoryAgent = new AIAgent({
      name: "Memory Agent",
      description: "Use this agent to store and retrieve memories",
      toolsConfigs: [
        Servers.memory,
        {
          mcpServers: {
            memory: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-memory"],
            },
          },
        },
      ],
    });

    // The master agent that can manage other agents
    masterAgent = new AIAgent({
      name: "Master Agent",
      description: "An agent that can manage other agents",
      toolsConfigs: [
        {
          type: "agent",
          agent: sequentialThinkingAgent,
          model: openai("gpt-4o-mini"),
        },
        {
          type: "agent",
          agent: memoryAgent,
          model: openai("gpt-4o-mini"),
        },
        {
          type: "agent",
          agent: braveSearchAgent,
          model: openai("gpt-4o-mini"),
        },
      ],
    });
  });

  afterAll(async () => {
    await masterAgent.close();
  });

  it("should initialize successfully and generate a response", async () => {
    const response = await masterAgent.generateResponse({
      prompt:
        "Solve 23 * 37. And create an entity with TEST_NUMBER as the answer to the question.",
      model: openai("gpt-4o-mini"),
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    expect(response.text).toContain("851");
  }, 60000);

  it("should search the web successfully and generate a response", async () => {
    const response = await masterAgent.generateResponse({
      prompt: "What is the lastest bitcoin price?",
      model: openai("gpt-4o-mini"),
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    console.log("response", response.text);
  }, 60000);

  it("should remember the answer to the question", async () => {
    const response = await masterAgent.generateResponse({
      prompt:
        "Use your knowledge graph memory and tell me what is the TEST_NUMBER?",
      model: openai("gpt-4o-mini"),
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    expect(response.text).toContain("851");
  }, 60000);

  it.skip("should be able to send image messages", async () => {
    const response = await masterAgent.generateResponse({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Use sequential thinking to solve the following equation",
            },
            {
              type: "image",
              image: fs.readFileSync("./src/__tests__/equation.png"),
            },
          ],
        },
      ],
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    console.log("response", response);
    const hasAnswer =
      response.text.includes("x = -2") || response.text.includes("minus two");
    expect(hasAnswer).toBe(true);
  }, 60000);

  it.skip("should be able to send pdf messages", async () => {
    const response = await masterAgent.generateResponse({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Use sequential thinking to solve the following equation",
            },
            {
              type: "file",
              data: fs.readFileSync("./src/__tests__/equation.pdf"),
              filename: "equation.pdf",
              mimeType: "application/pdf",
            },
          ],
        },
      ],
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    console.log("response", response);
    const hasAnswer =
      response.text.includes("x = -2") || response.text.includes("minus two");
    expect(hasAnswer).toBe(true);
  }, 60000);
});
