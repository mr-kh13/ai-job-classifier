import type { Assessment } from "./assess-job";
import type { Job } from "./jobs";
import { dimensionKeys, DIMENSIONS, LEVELS } from "./scoring-config";

/** Highest score a job can get when it fails a hard requirement. */
const FAILED_REQUIREMENT_CAP = 30;
/** Total points across all dimensions, so weights are relative and need not sum to 100. */
const MAX_POINTS = dimensionKeys.reduce(
  (sum, key) => sum + DIMENSIONS[key].points,
  0,
);

export type ScoredJob = {
  title: string;
  company: string;
  score: number;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  source_url: string;
};

export function buildScoredJob({
  assessment,
  job,
  requirements,
}: {
  job: Job;
  assessment: Assessment;
  requirements: string[];
}): ScoredJob {
  const { hardRequirements, dimensions } = assessment;

  const earnedPoints = dimensionKeys.reduce(
    (sum, key) => sum + DIMENSIONS[key].points * LEVELS[dimensions[key].level],
    0,
  );
  const rawScore = (earnedPoints / MAX_POINTS) * 100;

  const anyFailed = hardRequirements.some(({ status }) => status === "fail");

  const dimensionReasons = dimensionKeys.map((key) => {
    const { level, reason } = dimensions[key];
    const sign = level === "full" || level === "strong" ? "+" : "-";
    return `${sign} ${DIMENSIONS[key].label}: ${reason}`;
  });
  const requirementReasons = hardRequirements.flatMap(
    ({ status, reason }, index) => {
      if (status === "pass") return [];
      const requirementName = requirements[index].split(":")[0].trim();
      return [`- ${requirementName} (${status}): ${reason}`];
    },
  );

  let confidence: ScoredJob["confidence"] = "high";
  if (assessment.postingFound === "none") confidence = "low";
  else if (assessment.postingFound === "partial") confidence = "medium";

  const score = Math.round(rawScore);
  return {
    title: job.title,
    company: job.company,
    score: anyFailed ? Math.min(score, FAILED_REQUIREMENT_CAP) : score,
    confidence,
    reasons: [...dimensionReasons, ...requirementReasons],
    source_url: assessment.sourceUrl ?? job.url ?? "",
  };
}
