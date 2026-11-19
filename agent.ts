import { defineDeepAgent } from "managed-deepagents";

export const agent = defineDeepAgent({
  name: "ai-job-classifier",
  model: "openai:gpt-6-luna",
});
