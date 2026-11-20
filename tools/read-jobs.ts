import { tool } from "@langchain/core/tools";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { z } from "zod";
import { projectPath } from "../lib/paths";

const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().nullish(),
  salary: z.string().nullish(),
  source: z.string().nullish(),
  url: z.string().nullish(),
});

export const readJobs = tool(
  async ({ file }) => {
    const text = await readFile(projectPath("data", basename(file)), "utf8");
    return JSON.stringify(z.array(jobSchema).parse(JSON.parse(text)));
  },
  {
    name: "read_jobs",
    description: "Get the list of jobs to score.",
    schema: z.object({
      file: z.string().default("job-alerts.json").describe("Which list to read; omit for the default"),
    }),
  },
);
