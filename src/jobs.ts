import { readFile, rename, writeFile } from "node:fs/promises";
import { z } from "zod";

const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().nullish(),
  salary: z.string().nullish(),
  source: z.string().nullish(),
  url: z.string().min(1),
  status: z.enum(["new", "seen"]).nullish(),
});

export type Job = z.infer<typeof jobSchema>;

export async function readJobs(path: string) {
  const text = await readFile(path, "utf8");
  const jobs = z.array(jobSchema).parse(JSON.parse(text));
  const seenUrls = new Set(
    jobs.filter((job) => job.status === "seen").map((job) => job.url),
  );
  const newJobs: Job[] = [];
  const queuedUrls = new Set<string>();
  let repeated = 0;
  let alreadySeen = 0;
  for (const job of jobs) {
    if (job.status === "seen") continue;
    if (seenUrls.has(job.url)) alreadySeen++;
    else if (queuedUrls.has(job.url)) repeated++;
    else {
      queuedUrls.add(job.url);
      newJobs.push(job);
    }
  }
  return { jobs: newJobs, repeated, alreadySeen };
}

export async function markJobsSeen(path: string, scoredJobs: Job[]) {
  const entries: Record<string, unknown>[] = JSON.parse(
    await readFile(path, "utf8"),
  );
  const parsed = entries.map((entry) => jobSchema.safeParse(entry));
  const seenUrls = new Set(scoredJobs.map((job) => job.url));
  for (const job of parsed) {
    if (job.success && job.data.status === "seen") seenUrls.add(job.data.url);
  }
  let marked = 0;
  entries.forEach((entry, index) => {
    const job = parsed[index]!;
    if (job.success && job.data.status !== "seen" && seenUrls.has(job.data.url)) {
      entry.status = "seen";
      marked++;
    }
  });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(entries, null, 2));
  await rename(temporaryPath, path);
  return marked;
}
