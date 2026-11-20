import { ChatOpenRouter } from "@langchain/openrouter";
import { defineDeepAgent } from "managed-deepagents";
import { env } from "./env";
import { assertProfileFiles } from "./lib/profile";
import { getCandidateProfile } from "./tools/get-candidate-profile";
import { readJobs } from "./tools/read-jobs";
import { saveScores } from "./tools/save-scores";
import { searchJobPosting } from "./tools/search-job-posting";

assertProfileFiles();

export const agent = defineDeepAgent({
  name: "ai-job-classifier",
  model: new ChatOpenRouter({
    model: env.AGENT_MODEL,
    apiKey: env.OPENROUTER_API_KEY,
  }),
  tools: [getCandidateProfile, readJobs, searchJobPosting, saveScores],
});
