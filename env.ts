import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // OpenRouter API key
    OPENROUTER_API_KEY: z.string().min(1),
    // Web search for job descriptions
    TAVILY_API_KEY: z.string().min(1),
    // Optional: override the default OpenRouter model ID
    AGENT_MODEL: z.string().min(1).default("anthropic/claude-haiku-5.5"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
