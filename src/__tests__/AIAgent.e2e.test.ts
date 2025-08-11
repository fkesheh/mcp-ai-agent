import { AIAgent } from "../AIAgent.js";
import { Servers } from "../index.js";
import fs from "fs";
import { AIAgentInterface } from "../types.js";
import { z } from "zod";
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

const stepDebug = (response: any) => {
  const { stepType, text, toolResults } = response;
  console.debug(
    "Step finished",
    JSON.stringify(
      {
        stepType,
        text,
        toolResults,
      },
      null,
      2
    )
  );
};

describe("Agent E2E", () => {
  let sequentialThinkingAgent: AIAgentInterface;
  let memoryAgent: AIAgentInterface;
  let masterAgent: AIAgentInterface;
  let braveSearchAgent: AIAgentInterface;
  let calculatorAgent: AIAgentInterface;

  beforeAll(async () => {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for tests"
      );
    }

    const modelForTest = openai("gpt-4o-mini");

    // The sequential thinking agent
    sequentialThinkingAgent = new AIAgent({
      name: "Sequential Thinker",
      description:
        "Use this agent to think sequentially and resolve complex problems",
      toolsConfigs: [Servers.sequentialThinking],
      model: modelForTest,
    });

    // The brave search agent
    braveSearchAgent = new AIAgent({
      name: "Brave Search",
      description:
        "Use this agent to search the web for the latest information",
      toolsConfigs: [Servers.braveSearch],
      model: modelForTest,
    });

    // The memory agent
    memoryAgent = new AIAgent({
      name: "Memory Agent",
      description:
        "Use this agent to store and retrieve memories. Pass a full prompt to the agent with all the context it will need to store and retrieve memories.",
      systemPrompt:
        "If the use asks to store something use the create_entities tool. If the user asks to retrieve something use the read_graph tool.",
      model: modelForTest,
      toolsConfigs: [
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
      model: modelForTest,
      toolsConfigs: [
        {
          type: "agent",
          agent: sequentialThinkingAgent,
        },
        {
          type: "agent",
          agent: memoryAgent,
        },
        {
          type: "agent",
          agent: braveSearchAgent,
        },
      ],
    });

    calculatorAgent = new AIAgent({
      name: "Calculator Agent",
      description: "A calculator agent",
      toolsConfigs: [
        {
          type: "tool",
          name: "multiply",
          description: "A tool for multiplying two numbers",
          parameters: z.object({
            number1: z.number(),
            number2: z.number(),
          }),
          execute: async (args) => {
            return args.number1 * args.number2;
          },
        },
        {
          type: "tool",
          name: "add",
          description: "A tool for adding two numbers",
          parameters: z.object({
            number1: z.number(),
            number2: z.number(),
          }),
          execute: async (args) => {
            return args.number1 + args.number2;
          },
        },
        {
          type: "tool",
          name: "subtract",
          description: "A tool for subtracting two numbers",
          parameters: z.object({
            number1: z.number(),
            number2: z.number(),
          }),
          execute: async (args) => {
            return args.number1 - args.number2;
          },
        },
        {
          type: "tool",
          name: "divide",
          description: "A tool for dividing two numbers",
          parameters: z.object({
            number1: z.number(),
            number2: z.number(),
          }),
          execute: async (args) => {
            return args.number1 / args.number2;
          },
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
        "Solve 23 * 37. Then ask the memory agent to store the answer as TEST_NUMBER.",
      onStepFinish: stepDebug,
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    expect(response.text).toContain("851");
  }, 60000);

  it("should search the web successfully and generate a response", async () => {
    const response = await masterAgent.generateResponse({
      prompt: "What is the lastest bitcoin price?",
      onStepFinish: stepDebug,
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    console.log("response", response.text);
  }, 120000);

  it("should remember the answer to the question", async () => {
    const response = await masterAgent.generateResponse({
      prompt:
        "Use your knowledge graph memory and tell me what is the TEST_NUMBER? (ask the memory agent to retrieve the answer)",
      onStepFinish: stepDebug,
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    expect(response.text).toContain("851");
  }, 60000);

  it("should calculate the answer to the question using the calculator agent", async () => {
    const response = await calculatorAgent.generateResponse({
      prompt:
        "What is 36452 * 23 * 59 * 78 * 356 * 7? Output as a non formatted number e.g. 2324343 or 45459495849859.",
      onStepFinish: stepDebug,
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    console.log("response", response.text);
    const hasAnswer = response.text.includes("9614879592864");
    expect(hasAnswer).toBe(true);
  }, 60000);

  it("should be able to send image messages", async () => {
    const response = await masterAgent.generateResponse({
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
      onStepFinish: stepDebug,
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    console.log("response", response.text);
    const hasAnswer =
      response.text.includes("x = -2") || response.text.includes("minus two");
    expect(hasAnswer).toBe(true);
  }, 60000);

  it("should be able to send pdf messages", async () => {
    const response = await masterAgent.generateResponse({
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
              mediaType: "application/pdf",
            },
          ],
        },
      ],
      onStepFinish: stepDebug,
    });

    expect(response).toBeDefined();
    expect(typeof response.text).toBe("string");
    expect(response.text.length).toBeGreaterThan(0);
    console.log("response", response.text);
    const hasAnswer =
      response.text.includes("x = -2") ||
      response.text.includes("x = −2") ||
      response.text.includes("minus two");
    expect(hasAnswer).toBe(true);
  }, 60000);
});
