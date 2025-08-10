import { AIAgent } from "./src/AIAgent";
import * as Servers from "./src/servers";
import { openai } from "@ai-sdk/openai";
import { exit } from "process";

import { generateText } from "ai";

const { text } = await generateText({
  model: openai("gpt-4o"),
  prompt: "Invent a new holiday and describe its traditions.",
});

console.log(text);

// Use a preconfigured server
const agent = new AIAgent({
  name: "Sequential Thinking Agent",
  description: "This agent can be used to solve complex tasks",
  model: openai("gpt-5-nano"),
  toolsConfigs: [Servers.sequentialThinking],
});

// Use the agent
const response = await agent.generateResponse({
  prompt: "What is 25 * 25?",
});
console.log(JSON.stringify(response, null, 2));
console.log(response.text);
exit(0);
