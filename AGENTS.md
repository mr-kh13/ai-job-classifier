# ai-job-classifier

Scores a list of jobs against the user's resume and preferences and saves a ranked shortlist. TypeScript, Vercel AI SDK, OpenRouter for the model, Tavily for job postings.

## Layout

- `index.ts` is the entry point: reads the jobs, scores each one, saves `output/<timestamp>.json`. `args.ts` and `env.ts` validate the command-line arguments and environment variables.
- `src/` holds the shortlisting logic, which is specific to this app.
  - `scoring-config.ts` holds the fixed scoring settings (dimensions, weights, levels). It is code, not a per-run option. The prompt, the output schema and the score arithmetic all read from it.
  - `state-machine.ts` scores one job as an XState machine: search, assess, score, then report. It exports `scoreJob`, which `index.ts` calls for each job.
  - `search-posting.ts` finds the posting with Tavily. `assess-job.ts` holds the prompt and output schema and asks the model for an assessment. `build-scored-job.ts` turns the assessment into a score in code.
  - `jobs.ts`, `profile.ts` and `save-scores.ts` read and write the app's own files.
- `src/utils/` holds generic helpers (`paths`, `log`, `map-limit`) that know nothing about jobs. `src` may import from `utils`, never the reverse.
- `profile/resume.md` and `profile/preferences.md` hold the user's details. `data/`, `output/` and `logs/` are runtime folders. All of these are gitignored.

## Commands

- `pnpm install` installs dependencies.
- `pnpm start [jobs-file]` scores the jobs in `data/` (default `job-alerts.json`).
- `pnpm typecheck` type-checks the project.
- Keys come from the environment: `bws run -- pnpm start`, or a `.env` file. `env.ts` validates them at startup.

## Conventions

- No comments unless essential. Prefer clear names.
- Never commit or log-share the profile, `data/`, `output/` or `logs/`. They contain personal details.

## Ending a session

When you finish a task, summarize what changed, any assumptions you made, and how to run it, including any keys that are still empty.
