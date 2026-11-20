import { parseArgs } from "node:util";
import { z } from "zod";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    concurrency: { type: "string", short: "c" },
  },
});

const argsSchema = z.object({
  jobsFile: z.string().min(1).default("job-alerts.json"),
  concurrency: z.coerce.number().int().min(1).default(3), // Run `x` scoring run concurrently
});

export const args = argsSchema.parse({
  jobsFile: positionals[0],
  concurrency: values.concurrency,
});
