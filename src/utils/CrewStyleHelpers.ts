import { LanguageModel } from "ai";
import { z } from "zod";
import { AIAgentInterface } from "../types.js";

export type CrewStyleAgent = {
  name: string;
  goal: string;
  backstory: string;
  agent: AIAgentInterface;
  model: LanguageModel;
};

const crewAIStylePrompt = (
  agent: CrewStyleAgent,
  previousTasks: { [key: string]: string } | undefined,
  task: {
    description: string;
    expected_output: string;
  }
) => {
  return `
  <role>
  ${agent.name}.
  </role>

  <backstory>
  ${agent.backstory}
  </backstory>

  ${
    previousTasks
      ? `
  <previous_tasks>
  ${Object.entries(previousTasks)
    .map(([key, value]) => `<${key}>${value}</${key}>`)
    .join("\n")}
  </previous_tasks>
  `
      : ""
  }

  <goal>
  ${agent.goal}
  </goal>

  <current_task>
  ${task.description}
  </current_task>

  <expected_output>
  ${task.expected_output}
  </expected_output>
  `;
};

export const executeTask = async ({
  agent,
  task,
  previousTasks,
  schema,
}: {
  agent: CrewStyleAgent;
  task: {
    description: string;
    expected_output: string;
  };
  previousTasks?: { [key: string]: string };
  schema?: z.ZodSchema;
}) => {
  const prompt = crewAIStylePrompt(agent, previousTasks, task);
  if (schema) {
    const response = await agent.agent.generateObject({
      prompt: prompt,
      model: agent.model,
      schema: schema,
    });
    return {
      object: response.object,
      textGenerationResult: response.textGenerationResult,
      objectGenerationResult: response.objectGenerationResult,
      usage: response.usage,
    };
  } else {
    const response = await agent.agent.generateResponse({
      prompt: prompt,
      model: agent.model,
    });

    return {
      text: response.text,
      textGenerationResult: response,
      usage: response.usage,
    };
  }
};
