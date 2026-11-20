import { tavily } from "@tavily/core";
import { env } from "../env";
import type { Job } from "./jobs";

const client = tavily({ apiKey: env.TAVILY_API_KEY });

const MAX_CHARS = 12_000;

export async function searchPosting({ title, company, location }: Job) {
  const query = [title, company, location, "job description"].filter(Boolean).join(" ");
  const response = await client.search(query, {
    maxResults: 3,
    searchDepth: "advanced",
    includeRawContent: "text",
  });
  return response.results.map((result) => ({
    url: result.url,
    title: result.title,
    content: (result.rawContent || result.content).slice(0, MAX_CHARS),
  }));
}

export type SearchResult = Awaited<ReturnType<typeof searchPosting>>[number];
