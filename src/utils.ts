import { TOOLS } from "./types.js";

export function filterTools(
  tools: TOOLS,
  filter: (tool: TOOLS) => boolean = () => true
) {
  return Object.fromEntries(
    Object.entries(tools).filter(([_, tool]) => filter(tool))
  );
}
