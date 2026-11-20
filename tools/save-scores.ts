import { tool } from "@langchain/core/tools";
import { mkdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import { projectPath } from "../lib/paths";

const scoreSchema = z.object({
  title: z.string(),
  company: z.string(),
  score: z.number().int().min(0).max(100),
  confidence: z.enum(["high", "medium", "low"]),
  reasons: z.array(z.string()),
  source_url: z.string(),
});

export const saveScores = tool(
  async ({ scores }) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = projectPath("output", `${stamp}.json`);
    await mkdir(projectPath("output"), { recursive: true });
    await writeFile(file, JSON.stringify(scores, null, 2));
    return `Saved ${scores.length} scores to output/${stamp}.json`;
  },
  {
    name: "save_scores",
    description: "Save the final scored jobs, sorted by score descending.",
    schema: z.object({ scores: z.array(scoreSchema) }),
  },
);
