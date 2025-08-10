import { AIAgent, CrewStyleHelpers, Servers } from "../index.js";
import { openai } from "@ai-sdk/openai";
import { AIAgentInterface } from "../types.js";
import { z } from "zod";
import assert from "assert";

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
  const runnerAgent = new AIAgent({
    name: "Runner Agent",
    description: "A runner agent with no tools",
  });

  beforeAll(async () => {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for tests"
      );
    }
  });

  afterAll(async () => {
    if (runnerAgent) {
      await runnerAgent.close();
    }
  });

  // Project details
  const projectDetailsDescription = {
    project: "Website",
    industry: "Technology",
    project_objectives: "Create a website for a small business",
    team_members: [
      "John Doe (Project Manager)",
      "Jane Doe (Software Engineer)",
      "Bob Smith (Designer)",
      "Alice Johnson (QA Engineer)",
      "Tom Brown (QA Engineer)",
    ],
    project_requirements: [
      "Create a responsive design that works well on desktop and mobile devices",
      "Implement a modern, visually appealing user interface with a clean look",
      "Develop a user-friendly navigation system with intuitive menu structure",
      'Include an "About Us" page highlighting the company\'s history and values',
      'Design a "Services" page showcasing the business\'s offerings with descriptions',
      'Create a "Contact Us" page with a form and integrated map for communication',
      "Implement a blog section for sharing industry news and company updates",
      "Ensure fast loading times and optimize for search engines (SEO)",
      "Integrate social media links and sharing capabilities",
      "Include a testimonials section to showcase customer feedback and build trust",
    ],
  };

  // Define the tasks that the agents will execute
  const tasks = {
    task_breakdown: (projectDetails: typeof projectDetailsDescription) => ({
      description: `Carefully analyze the project_requirements for the ${projectDetails.project} project and break them down into individual tasks. Define each task's scope in detail, set achievable timelines, and ensure that all dependencies are accounted for:\n${projectDetails.project_requirements}\n\nTeam members:\n${projectDetails.team_members}\n`,
      expected_output: `A comprehensive list of tasks with detailed descriptions, timelines, dependencies, and deliverables. Your final output MUST include a Gantt chart or similar timeline visualization specific to the ${projectDetails.industry} project.\n`,
    }),
    time_resource_estimation: (
      projectDetails: typeof projectDetailsDescription
    ) => ({
      description: `Thoroughly evaluate each task in the ${projectDetails.project} project to estimate the time, resources, and effort required. Use historical data, task complexity, and available resources to provide a realistic estimation for each task.\n`,
      expected_output: `A detailed estimation report outlining the time, resources, and effort required for each task in the ${projectDetails.project} project. Your final report MUST include a summary of any risks or uncertainties associated with the estimations.\n`,
    }),
    resource_allocation: (
      projectDetails: typeof projectDetailsDescription
    ) => ({
      description: `Strategically allocate tasks for the ${projectDetails.project} project to team members based on their skills, availability, and current workload. Ensure that each task is assigned to the most suitable team member and that the workload is evenly distributed.\n\nTeam members:\n${projectDetails.team_members}\n`,
      expected_output: `A resource allocation chart showing which team members are responsible for each task in the ${projectDetails.project} project, along with start and end dates. Your final output MUST also include a summary explaining the rationale behind each allocation decision.\n`,
    }),
  };

  // Here we define the agents that will be used to execute the tasks
  const agents: { [key: string]: CrewStyleHelpers.CrewStyleAgent } = {
    project_planning_agent: {
      name: "The Ultimate Project Planner",
      goal: "To meticulously break down the project into actionable tasks, ensuring no detail is overlooked, and setting precise timelines that align with the project objectives.",
      backstory:
        "As a veteran project manager, you've led numerous successful projects, particularly in the technology industry. Your keen eye for detail and strategic thinking have always ensured that projects are delivered on time and within scope.",
      agent: runnerAgent,
      model: openai("gpt-4o-mini"),
    },
    estimation_agent: {
      name: "Estimation Analyst",
      goal: "Provide highly accurate time, resource, and effort estimations for each task in the project to ensure it is delivered efficiently and on budget.",
      backstory:
        "You are the go-to expert for project estimation in the technology industry. With a wealth of experience and access to vast historical data, you can predict the resources required for any task with remarkable accuracy.",
      agent: runnerAgent,
      model: openai("gpt-4o-mini"),
    },
    resource_allocation_agent: {
      name: "Resource Allocation Strategist",
      goal: "Optimize the allocation of tasks for the project by balancing team members' skills, availability, and current workload to maximize efficiency and project success.",
      backstory:
        "With a deep understanding of team dynamics and resource management in the technology industry, you have a track record of ensuring that the right person is always assigned to the right task.",
      agent: runnerAgent,
      model: openai("gpt-4o-mini"),
    },
  };

  // Define schema for resource allocation
  const projectPlanSchema = z.object({
    rationale: z
      .string()
      .describe("Rationale for the resource allocation decisions"),
    tasks: z.array(
      z.object({
        task_name: z.string().describe("Name of the task"),
        estimated_time_hours: z
          .number()
          .describe("Estimated time to complete the task in hours"),
        required_resources: z
          .array(z.string())
          .describe("List of resources required to complete the task"),
        assigned_to: z.string().describe("Team member assigned to this task"),
        start_date: z.string().describe("Planned start date for the task"),
        end_date: z.string().describe("Expected completion date for the task"),
      })
    ),
    milestones: z.array(
      z.object({
        milestone_name: z.string().describe("Name of the milestone"),
        tasks: z
          .array(z.string())
          .describe("List of task names associated with this milestone"),
        deadline: z.string().describe("Deadline for completing this milestone"),
      })
    ),
    workload_distribution: z
      .record(z.string(), z.number())
      .describe(
        "Total hours allocated to each team member as numbers (not percentages)"
      ),
  });

  it("should execute the project planning workflow", async () => {
    // Execute the first task using the CrewStyleHelpers
    const projectPlan = await CrewStyleHelpers.executeTask({
      agent: agents.project_planning_agent,
      task: tasks.task_breakdown(projectDetailsDescription),
    });

    console.log("Project Plan", projectPlan.text);
    assert(projectPlan.text, "Project plan is required");

    const timeResourceEstimation = await CrewStyleHelpers.executeTask({
      agent: agents.estimation_agent,
      task: tasks.time_resource_estimation(projectDetailsDescription),
      previousTasks: { projectPlan: projectPlan.text }, // Previous task context
    });

    console.log("Time Resource Estimation", timeResourceEstimation.text);
    assert(timeResourceEstimation.text, "Time resource estimation is required");

    const resourceAllocation = await CrewStyleHelpers.executeTask({
      agent: agents.resource_allocation_agent,
      task: tasks.resource_allocation(projectDetailsDescription),
      previousTasks: {
        projectPlan: projectPlan.text,
        timeResourceEstimation: timeResourceEstimation.text,
      }, // Previous task context
      schema: projectPlanSchema,
    });

    assert(resourceAllocation.object, "Resource allocation is required");
    console.log(
      "Resource Allocation",
      JSON.stringify(resourceAllocation.object, null, 2)
    );

    expect(resourceAllocation.object).toBeDefined();
  }, 180000);
});
