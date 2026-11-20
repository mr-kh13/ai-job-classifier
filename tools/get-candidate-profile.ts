import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { readProfile } from "../lib/profile";

export const getCandidateProfile = tool(async () => JSON.stringify(await readProfile()), {
  name: "get_candidate_profile",
  description: "Get the candidate's resume and preferences.",
  schema: z.object({}),
});
