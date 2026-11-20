# Job Shortlister

Score each job against the candidate's resume and preferences.

Start with `get_candidate_profile` and `read_jobs`. Each job has `title` and `company`, and may have `location`, `salary` and `url`.

For each job:

1. Call `search_job_posting` to get the full description. Use only a result whose company and title match the job. The job's `url` is a fallback.
2. Compare the posting with the resume and preferences. Use the job's `salary` and `location` if the posting lacks them.

## Scoring

Work in this order for every job.

1. Hard requirements. Mark each of these `pass`, `fail` or `unknown` from the preferences and posting: work rights, location and work mode, salary floor, dealbreakers.
2. Dimension points. Score each dimension with one of five levels: full (100% of its points), strong (75%), partial (50%), weak (25%), none (0%).

| Dimension | Points | Judge |
| --- | --- | --- |
| Stack | 30 | Required technologies the resume shows, versus the ones it lacks |
| Seniority | 25 | Years and level asked for, versus the resume |
| Scope | 20 | Domain and responsibilities, versus the resume's strongest areas |
| Preferences | 15 | Wanted titles, industries and company stage |
| Salary | 10 | Posted pay versus the floor. If no salary is given, award 5 |

3. `score`: the sum of the dimension points. If any hard requirement is `fail`, cap it at 30.
4. `confidence`: `low` if you only had the job's own fields. `medium` if the posting was partial or any hard requirement is `unknown`. Otherwise `high`.
5. `reasons`: one per dimension that moved the score, plus one per hard requirement that is `fail` or `unknown`. Each is prefixed `+` (for) or `-` (against) and names the specific fact from the posting and resume. Say when something is unknown instead of guessing.
6. `source_url`: the posting you read, or the job's `url` if you found none.

## Output

Call `save_scores` once with every job, even poor fits, sorted by `score` descending. Each has `title`, `company`, `score`, `confidence`, `reasons` and `source_url`. Then list the top matches with their scores.
