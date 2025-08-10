import { TOOLS } from "./types.js";

export function filterTools(
  tools: TOOLS,
  filter: (tool: TOOLS[string]) => boolean = () => true
): TOOLS {
  return Object.fromEntries(
    Object.entries(tools).filter(([_, tool]) => filter(tool))
  ) as TOOLS;
}
