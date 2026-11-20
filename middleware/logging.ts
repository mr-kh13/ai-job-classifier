import { createMiddleware } from "langchain";
import { appendFile, mkdir } from "node:fs/promises";
import { projectPath } from "../lib/paths";

async function record(event: Record<string, unknown>) {
  const now = new Date();
  const dir = projectPath("logs");
  await mkdir(dir, { recursive: true });
  const line = JSON.stringify({ time: now.toISOString(), ...event });
  await appendFile(`${dir}/${now.toISOString().slice(0, 10)}.jsonl`, `${line}\n`);
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const contentOf = (value: unknown) =>
  typeof value === "object" && value !== null && "content" in value ? value.content : value;

export const logging = createMiddleware({
  name: "logging",
  wrapModelCall: async (request, handler) => {
    const start = Date.now();
    const lastMessage = request.messages.at(-1);
    const input = lastMessage?.type === "tool" ? undefined : contentOf(lastMessage);
    const base = { event: "model_call", messageCount: request.messages.length, input };
    try {
      const response = await handler(request);
      await record({
        ...base,
        durationMs: Date.now() - start,
        output: response.content,
        toolCalls: response.tool_calls,
        usage: response.usage_metadata,
      });
      return response;
    } catch (error) {
      await record({ ...base, durationMs: Date.now() - start, error: errorMessage(error) });
      throw error;
    }
  },
  wrapToolCall: async (request, handler) => {
    const start = Date.now();
    const { name, args } = request.toolCall;
    const base = { event: "tool_call", tool: name, args };
    try {
      const result = await handler(request);
      await record({ ...base, durationMs: Date.now() - start, result: contentOf(result) });
      return result;
    } catch (error) {
      await record({ ...base, durationMs: Date.now() - start, error: errorMessage(error) });
      throw error;
    }
  },
});
