import { AIAgent } from "../AIAgent.js";
import { Servers } from "../index.js";
import { openai } from "@ai-sdk/openai";
import fs from "fs";
import { AIAgentInterface } from "../types.js";
import { z } from "zod";
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

describe("Automated Project E2E", () => {
  let projectPlannerAgent: AIAgentInterface;
  let estimationAgent: AIAgentInterface;
  let resourceAllocatorAgent: AIAgentInterface;

  beforeAll(async () => {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for tests"
      );
    }

    projectPlannerAgent = new AIAgent({
      name: "Project Planner",
      description:
        "The Ultimate Project Planner responsible for meticulously breaking down projects into actionable tasks, ensuring no detail is overlooked, and setting precise timelines that align with the project objectives. As a veteran project manager with extensive experience across multiple industries, this agent applies strategic thinking and detailed analysis to create comprehensive project plans that optimize resource utilization while maintaining quality standards. The agent excels at identifying dependencies, mitigating risks, and establishing realistic milestones to ensure successful project delivery.",
      toolsConfigs: [Servers.sequentialThinking],
    });

    estimationAgent = new AIAgent({
      name: "Project Estimator",
      description:
        "Expert Estimation Analyst responsible for providing highly accurate time, resource, and effort estimations for each task in the project to ensure it is delivered efficiently and on budget. With a wealth of experience and access to vast historical data, this agent can predict the resources required for any task with remarkable accuracy, ensuring the project remains feasible and avoids unnecessary delays or budget overruns.",
      toolsConfigs: [Servers.sequentialThinking],
    });

    resourceAllocatorAgent = new AIAgent({
      name: "Resource Allocator",
      description:
        "The Resource Allocator is responsible for allocating the resources to the project tasks to ensure the project is delivered on time and on budget. It will use the project plan and the project objectives to allocate the resources.",
      toolsConfigs: [Servers.sequentialThinking],
    });
  });

  afterAll(async () => {
    await projectPlannerAgent.close();
    await estimationAgent.close();
    await resourceAllocatorAgent.close();
  });

  const projectPlanScheme = z.object({
    tasks: z.array(
      z.object({
        task_name: z.string().describe("Name of the task"),
        estimated_time_hours: z
          .number()
          .describe("Estimated time to complete the task in hours"),
        required_resources: z
          .array(z.string())
          .describe("List of resources required to complete the task"),
      })
    ),
    milestones: z.array(
      z.object({
        milestone_name: z.string().describe("Name of the milestone"),
        tasks: z
          .array(z.string())
          .describe("List of task IDs associated with this milestone"),
      })
    ),
  });

  // Project details
  const projectDetails = {
    project: "Website",
    industry: "Technology",
    project_objectives: "Create a website for a small business",
    team_members: `
- John Doe (Project Manager)
- Jane Doe (Software Engineer)
- Bob Smith (Designer)
- Alice Johnson (QA Engineer)
- Tom Brown (QA Engineer)
`,
    project_requirements: `
- Create a responsive design that works well on desktop and mobile devices
- Implement a modern, visually appealing user interface with a clean look
- Develop a user-friendly navigation system with intuitive menu structure
- Include an "About Us" page highlighting the company's history and values
- Design a "Services" page showcasing the business's offerings with descriptions
- Create a "Contact Us" page with a form and integrated map for communication
- Implement a blog section for sharing industry news and company updates
- Ensure fast loading times and optimize for search engines (SEO)
- Integrate social media links and sharing capabilities
- Include a testimonials section to showcase customer feedback and build trust
`,
  };

  const stepsResponses = {} as {
    projectPlanner: string;
    estimationAgent: string;
    resourceAllocatorAgent: any;
  };

  it("should create a project plan", async () => {
    const projectPlanResponse = await projectPlannerAgent.generateResponse({
      prompt: `
        Carefully analyze the project_requirements for the ${projectDetails.project} 
        project and break them down into individual tasks. Define each
        task's scope in detail, set achievable timelines, and ensure that
        all dependencies are accounted for:
        
        ${projectDetails.project_requirements}
        
        Team members:
        ${projectDetails.team_members}

        Expected output:
        A comprehensive list of tasks with detailed descriptions, timelines, dependencies, and deliverables.
        Your final output MUST include a Gantt chart or similar timeline visualization specific to the ${projectDetails.project} project.
        `,
      model: openai("gpt-4o-mini"),
    });

    console.log("projectPlanResponse", projectPlanResponse.text);
    stepsResponses.projectPlanner = projectPlanResponse.text;
  }, 60000);

  it("should estimate the project", async () => {
    const response = await estimationAgent.generateResponse({
      prompt: `
        Thoroughly evaluate each task in the ${projectDetails.project} project to
        estimate the time, resources, and effort required.
        Use historical data, task complexity, and available resources to
        provide a realistic estimation for each task.
        
        Project Plan: ${stepsResponses.projectPlanner}

        Expected output:
        A detailed estimation report outlining the time, resources, and
        effort required for each task in the ${projectDetails.project} project.
        Your final report MUST include a summary of any risks or
        uncertainties associated with the estimations.
        `,
      model: openai("gpt-4o-mini"),
    });
    console.log("Task estimations response", response.text);
    stepsResponses.estimationAgent = response.text;

    expect(stepsResponses.estimationAgent).toBeDefined();
  }, 60000);

  it("should allocate resources for the project", async () => {
    console.log("Allocating resources for project tasks");

    const response = await resourceAllocatorAgent.generateObject({
      prompt: `
        resource_allocation:
          description: >
            Strategically allocate tasks for the ${projectDetails.project} project to
            team members based on their skills, availability, and current
            workload. Ensure that each task is assigned to the most suitable
            team member and that the workload is evenly distributed.

          Estimated project plan:
          ${stepsResponses.estimationAgent}
            
          Team members:
          ${projectDetails.team_members}
          
          expected_output: >
            A resource allocation chart showing which team members are
            responsible for each task in the ${projectDetails.project} project, along with
            justification for each assignment based on skills and workload.
        `,
      model: openai("gpt-4o-mini"),
      schema: projectPlanScheme,
    });
    stepsResponses.resourceAllocatorAgent = response.object;
    console.log("Final Response", JSON.stringify(stepsResponses, null, 2));

    expect(stepsResponses.resourceAllocatorAgent).toBeDefined();
  }, 60000);
});
