# ai-job-classifier

Scores a list of jobs against your resume and preferences, and saves a ranked shortlist. For each job it searches the web for the posting (Tavily), asks a model (OpenRouter, through the Vercel AI SDK) to assess the fit, and calculates the score in code.

## Setup

```bash
pnpm install
```

Set these in your shell or a `.env` file. `env.ts` validates them at startup.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | yes | OpenRouter API key |
| `TAVILY_API_KEY` | yes | Web search for job descriptions |
| `AGENT_MODEL` | no | OpenRouter model ID (default `anthropic/claude-haiku-5.5`) |

## Your profile

Create `profile/resume.md` and `profile/preferences.md`. Both are gitignored, and the app won't start without them. The model reads both files as plain text.

`resume.md` can be any plain description of your background: summary, experience, skills, work rights and location.

In `preferences.md`, write whatever you want in free text, such as roles, stack and industries. The only part the app parses is the `## Hard requirements` section:

- The heading must be level 2 (`##`) and read `Hard requirements`. Case doesn't matter.
- Write one requirement per bullet, starting with `-` or `*`, dealbreakers included. Each is checked separately for every job.
- The section ends at the next `#` or `##` heading. Anything under it that isn't a bullet is ignored.
- The section is optional. Without it, jobs are scored with no hard requirements.

A job that breaks a hard requirement is capped at a score of 30.

```md
# Preferences

## Hard requirements

- Work rights: skip jobs that require permanent residency or citizenship.
- Dealbreaker: no on-call rotation.

## Wanted

- Target roles: ...
- Preferred stack: ...
```

<details>
<summary>Generate both files with a chat model</summary>

Paste this into any chat model, with your CV and a few lines on what you're looking for. Save its two answers as `profile/resume.md` and `profile/preferences.md`. This sends your details to that model, so use one you're comfortable sharing them with.

```text
I use a tool that scores job postings against my resume and preferences. From the material at the end, write two markdown files.

File 1, resume.md: a plain description of my background: summary, experience, skills, work rights and location. Use only facts from my material. Don't invent anything.

File 2, preferences.md, in this format:

# Preferences

## Hard requirements

- <one rule per bullet>

## Wanted

- <target roles, preferred stack, industries, anything else I care about>

Rules for preferences.md:
- The heading must be exactly "## Hard requirements", with only "-" bullets under it.
- A hard requirement is a dealbreaker that rules a job out. Each bullet is one rule, stated so a job clearly passes or fails it. A job that fails one is capped at a score of 30, so keep the list short.
- Put everything that is only nice to have under "## Wanted".

If anything is unclear, ask me before you write.

My material:
<paste your CV and what you're looking for>
```

</details>

## Jobs

Put the jobs in `data/job-alerts.json`, an array of `{ title, company, location, salary, source, url }`. Only `title` and `company` are required.

## Run

```bash
pnpm start                      # data/job-alerts.json
pnpm start my-jobs.json         # data/my-jobs.json
pnpm start --concurrency 5      # jobs scored at once (-c, default 3)
```

Scores are saved to `output/<timestamp>.json`, best first. Each entry has `title`, `company`, `score`, `confidence`, `reasons` and `source_url`. `pnpm typecheck` type-checks the project.

## How a job is processed

Each job runs through the state machine in `src/state-machine.ts`. A step that fails sends the job to `reportingFailure`, which logs the error. The job then gets a score of 0 and is marked failed, and the run carries on with the other jobs.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> searching
    searching --> assessing: posting found
    assessing --> scoring: assessment done
    scoring --> reportingScored: score built
    reportingScored --> scored: logged
    scored --> [*]

    searching --> reportingFailure: error
    assessing --> reportingFailure: error
    scoring --> reportingFailure: error
    reportingScored --> reportingFailure: error
    reportingFailure --> failed: logged
    failed --> [*]
```

## How scoring works

The settings are fixed in `src/scoring-config.ts`. The model marks each hard requirement `pass`, `fail` or `unknown` and gives each dimension a level. The code adds up the points.

| Dimension | Points | Judges |
| --- | --- | --- |
| Stack | 40 | The technologies the posting requires, against your resume |
| Domain | 60 | How well the job matches your resume and what you're looking for |

Partial matches are acceptable. Seniority and salary aren't scored.

The score is the points earned divided by the points available, scaled to 100. A failed hard requirement caps it at 30. Confidence is `low` when no posting was found, `medium` when only part was found or any hard requirement is unknown, and `high` otherwise.

## Logs

The console prints one line per job (score, confidence, time, tokens) and a final summary. The same run is written to `logs/<date>.jsonl`, one JSON object per line, each with a `runId` shared by the run.

| Event | When | Notable fields |
| --- | --- | --- |
| `run_start` | The run begins | jobs file, job count, concurrency, model |
| `job_scored` | A job was scored | score, confidence, `searchMs`, `assessMs`, token usage, search results, assessment |
| `job_failed` | A job could not be scored | `stage` (`search`, `assess` or `score`) and the error |
| `run_end` | The run finishes | scored and failed counts, token totals, duration, output file |
| `run_failed` | The run stops early | the error |

The logs contain your resume details and job postings, so don't share them.
