import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { z } from "zod";
import { projectPath } from "./utils/paths";

const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().nullish(),
  salary: z.string().nullish(),
  source: z.string().nullish(),
  url: z.string().nullish(),
});

export type Job = z.infer<typeof jobSchema>;

export async function readJobs(file: string): Promise<Job[]> {
  const text = await readFile(projectPath("data", basename(file)), "utf8");
  return z.array(jobSchema).parse(JSON.parse(text));
}
