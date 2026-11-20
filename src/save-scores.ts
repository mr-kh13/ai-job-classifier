import { mkdir, writeFile } from "node:fs/promises";
import { projectPath } from "./utils/paths";
import type { ScoredJob } from "./build-scored-job";

export async function saveScores(scores: ScoredJob[]) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await mkdir(projectPath("output"), { recursive: true });
  await writeFile(
    projectPath("output", `${stamp}.json`),
    JSON.stringify(scores, null, 2),
  );
  return `output/${stamp}.json`;
}
