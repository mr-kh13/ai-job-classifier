import { basename } from "node:path";
import { args } from "./args";
import { env } from "./env";
import { markJobsSeen, readJobs } from "./src/jobs";
import { info, logEvent } from "./src/utils/log";
import { projectPath } from "./src/utils/paths";
import { mapLimit } from "./src/utils/map-limit";
import { assertProfileFiles, readProfile } from "./src/profile";
import { saveScores } from "./src/save-scores";
import { scoreJob } from "./src/state-machine";

const jobsPath =
  (args.jobsFile && projectPath("data", basename(args.jobsFile))) ??
  env.JOBS_FILE ??
  projectPath("data", "job-alerts.json");

const start = Date.now();

try {
  assertProfileFiles();
  const [profile, { jobs, repeated, alreadySeen }] = await Promise.all([
    readProfile(),
    readJobs(jobsPath),
  ]);

  info(
    `Scoring ${jobs.length} jobs from ${jobsPath} (skipped ${repeated} repeated in the file, ${alreadySeen} already seen; concurrency ${args.concurrency}, model ${env.AGENT_MODEL})`,
  );
  await logEvent({
    event: "run_start",
    jobsFile: jobsPath,
    jobCount: jobs.length,
    repeatedJobs: repeated,
    alreadySeenJobs: alreadySeen,
    concurrency: args.concurrency,
    model: env.AGENT_MODEL,
    resumeChars: profile.resume.length,
    preferencesChars: profile.preferences.length,
    hardRequirements: profile.hardRequirements,
  });

  const results = await mapLimit(jobs, args.concurrency, (job) =>
    scoreJob(job, profile),
  );
  const scores = results
    .map((result) => result.scored)
    .sort((a, b) => b.score - a.score);

  const file = await saveScores(scores);
  const failed = results.filter((result) => result.failed).length;
  const marked = await markJobsSeen(
    jobsPath,
    jobs.filter((_, index) => !results[index]?.failed),
  );
  const inputTokens = results.reduce((sum, r) => sum + r.inputTokens, 0);
  const outputTokens = results.reduce((sum, r) => sum + r.outputTokens, 0);
  const durationMs = Date.now() - start;

  await logEvent({
    event: "run_end",
    scored: scores.length - failed,
    failed,
    inputTokens,
    outputTokens,
    durationMs,
    file,
  });
  info(
    `Done in ${(durationMs / 1000).toFixed(1)}s: ${scores.length - failed} scored, ${failed} failed, ${inputTokens} in / ${outputTokens} out tokens. Saved to ${file}. Marked ${marked} jobs as seen.`,
  );
} catch (error) {
  await logEvent({
    event: "run_failed",
    error: error instanceof Error ? error.message : String(error),
    durationMs: Date.now() - start,
  });
  throw error;
}
