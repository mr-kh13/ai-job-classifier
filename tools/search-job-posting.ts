import { tool } from "@langchain/core/tools";
import { tavily } from "@tavily/core";
import { z } from "zod";
import { env } from "../env";

const client = tavily({ apiKey: env.TAVILY_API_KEY });

const MAX_CHARS = 12_000;

export const searchJobPosting = tool(
  async ({ title, company, location }) => {
    const query = [title, company, location, "job description"]
      .filter(Boolean)
      .join(" ");
    const res = await client.search(query, {
      maxResults: 3,
      searchDepth: "advanced",
      includeRawContent: "text",
    });
    return JSON.stringify(
      res.results.map((r) => ({
        url: r.url,
        title: r.title,
        content: (r.rawContent || r.content).slice(0, MAX_CHARS),
      })),
    );
  },
  {
    name: "search_job_posting",
    description:
      "Find the full job description for a job. Returns up to 3 candidate pages with their text. Verify the company and title match before relying on a result.",
    schema: z.object({
      title: z.string().describe("Job title"),
      company: z.string().describe("Company name"),
      location: z.string().optional().describe("Location"),
    }),
  },
);
