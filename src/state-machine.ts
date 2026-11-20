import type { LanguageModelUsage } from "ai";
import { assign, createActor, fromPromise, setup, toPromise } from "xstate";
import { assessJob, type Assessment } from "./assess-job";
import type { Job } from "./jobs";
import type { Profile } from "./profile";
import { searchPosting, type SearchResult } from "./search-posting";
import { buildScoredJob, type ScoredJob } from "./build-scored-job";
import { error, info, logEvent } from "./utils/log";

export type JobResult = {
  scored: ScoredJob;
  failed: boolean;
  inputTokens: number;
  outputTokens: number;
};

type Stage = "search" | "assess" | "score";

type Context = {
  job: Job;
  profile: Profile;
  startedAt: number;
  results?: SearchResult[];
  searchMs?: number;
  assessment?: Assessment;
  usage?: LanguageModelUsage;
  assessMs?: number;
  result?: JobResult;
  failure?: { stage: Stage; message: string };
};

const seconds = (ms: number) => (ms / 1000).toFixed(1);
const thousands = (count: number) => `${(count / 1000).toFixed(1)}k`;
const labelOf = ({ job }: Context) => `${job.company} - ${job.title}`;
const failAt = (stage: Stage) => {
  return {
    target: "reportingFailure" as const,
    actions: { type: "recordFailure" as const, params: { stage } },
  };
};

const scoreJobMachine = setup({
  types: {
    input: {} as { job: Job; profile: Profile },
    context: {} as Context,
    output: {} as JobResult,
  },
  actors: {
    searchPosting: fromPromise(async ({ input }: { input: Job }) =>
      searchPosting(input),
    ),

    assess: fromPromise(
      async ({
        input,
      }: {
        input: { job: Job; profile: Profile; results: SearchResult[] };
      }) => assessJob(input),
    ),

    buildScoredJob: fromPromise(
      async ({
        input,
      }: {
        input: { job: Job; assessment: Assessment; requirements: string[] };
      }) => buildScoredJob(input),
    ),

    reportScored: fromPromise(async ({ input }: { input: Context }) => {
      const { results, assessment } = input;
      const scored = input.result?.scored;
      await logEvent({
        event: "job_scored",
        job: input.job,
        score: scored?.score,
        confidence: scored?.confidence,
        postingFound: assessment?.postingFound,
        resultCount: results?.length,
        searchMs: input.searchMs,
        assessMs: input.assessMs,
        usage: input.usage,
        results,
        assessment,
      });
      info(
        [
          String(scored?.score).padStart(3),
          scored?.confidence.padEnd(6),
          labelOf(input),
          `(${seconds(Date.now() - input.startedAt)}s,`,
          `${thousands(input.result!.inputTokens)} in /`,
          `${thousands(input.result!.outputTokens)} out)`,
        ].join(" "),
      );
    }),

    reportFailed: fromPromise(async ({ input }: { input: Context }) => {
      const { stage, message } = input.failure!;
      await logEvent({
        event: "job_failed",
        job: input.job,
        stage,
        error: message,
        durationMs: Date.now() - input.startedAt,
      });
      error(`FAILED at ${stage}: ${labelOf(input)}: ${message}`);
    }),
  },

  actions: {
    recordFailure: assign({
      failure: ({ event }, params: { stage: Stage }) => ({
        stage: params.stage,
        message:
          event.error instanceof Error
            ? event.error.message
            : String(event.error),
      }),
    }),
  },
}).createMachine({
  id: "scoreJob",
  initial: "searching",
  context: ({ input }) => ({ ...input, startedAt: Date.now() }),
  states: {
    searching: {
      invoke: {
        src: "searchPosting",
        input: ({ context }) => context.job,
        onDone: {
          target: "assessing",
          actions: assign({
            results: ({ event }) => event.output,
            searchMs: ({ context }) => Date.now() - context.startedAt,
          }),
        },
        onError: failAt("search"),
      },
    },

    assessing: {
      invoke: {
        src: "assess",
        input: ({ context }) => ({
          job: context.job,
          profile: context.profile,
          results: context.results ?? [],
        }),
        onDone: {
          target: "scoring",
          actions: assign({
            assessment: ({ event }) => event.output.assessment,
            usage: ({ event }) => event.output.usage,
            assessMs: ({ context }) =>
              Date.now() - context.startedAt - (context.searchMs ?? 0),
          }),
        },
        onError: failAt("assess"),
      },
    },

    scoring: {
      invoke: {
        src: "buildScoredJob",
        input: ({ context }) => ({
          job: context.job,
          assessment: context.assessment!,
          requirements: context.profile.hardRequirements,
        }),
        onDone: {
          target: "reportingScored",
          actions: assign({
            result: ({ context, event }) => ({
              scored: event.output,
              failed: false,
              inputTokens: context.usage?.inputTokens ?? 0,
              outputTokens: context.usage?.outputTokens ?? 0,
            }),
          }),
        },
        onError: failAt("score"),
      },
    },

    reportingScored: {
      invoke: {
        src: "reportScored",
        input: ({ context }) => context,
        onDone: "scored",
        onError: failAt("score"),
      },
    },

    reportingFailure: {
      invoke: {
        src: "reportFailed",
        input: ({ context }) => context,
        onDone: "failed",
      },
    },

    scored: { type: "final" },
    failed: { type: "final" },
  },
  output: ({ context }): JobResult =>
    context.failure
      ? {
          scored: {
            title: context.job.title,
            company: context.job.company,
            score: 0,
            confidence: "low",
            reasons: [`- Could not score: ${context.failure.message}`],
            source_url: context.job.url ?? "",
          },
          failed: true,
          inputTokens: 0,
          outputTokens: 0,
        }
      : context.result!,
});

export function scoreJob(job: Job, profile: Profile): Promise<JobResult> {
  const actor = createActor(scoreJobMachine, { input: { job, profile } });
  actor.start();
  return toPromise(actor);
}
