import { readFile, rename, writeFile } from "node:fs/promises";
import { z } from "zod";

const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().nullish(),
  salary: z.string().nullish(),
  source: z.string().nullish(),
  url: z.string().nullish(),
  status: z.enum(["new", "seen"]).nullish(),
});

export type Job = z.infer<typeof jobSchema>;

export async function readJobs(path: string): Promise<Job[]> {
  const text = await readFile(path, "utf8");
  const jobs = z.array(jobSchema).parse(JSON.parse(text));
  return jobs.filter((job) => job.status == null || job.status === "new");
}

function jobKey(job: Pick<Job, "title" | "company" | "url">) {
  return job.url ?? `${job.title}|${job.company}`;
}

export async function markJobsSeen(path: string, scoredJobs: Job[]) {
  const keys = new Set(scoredJobs.map(jobKey));
  const entries: Record<string, unknown>[] = JSON.parse(
    await readFile(path, "utf8"),
  );
  let marked = 0;
  for (const entry of entries) {
    const job = jobSchema.safeParse(entry);
    if (job.success && job.data.status !== "seen" && keys.has(jobKey(job.data))) {
      entry.status = "seen";
      marked++;
    }
  }
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(entries, null, 2));
  await rename(temporaryPath, path);
  return marked;
}
