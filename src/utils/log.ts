import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { projectPath } from "./paths";

const runId = randomUUID().slice(0, 8);

export async function logEvent(event: Record<string, unknown>) {
  const now = new Date();
  const dir = projectPath("logs");
  await mkdir(dir, { recursive: true });
  const line = JSON.stringify({ time: now.toISOString(), runId, ...event });
  await appendFile(
    `${dir}/${now.toISOString().slice(0, 10)}.jsonl`,
    `${line}\n`,
  );
}

const clock = () => new Date().toTimeString().slice(0, 8);

export const info = (message: string) => console.log(`${clock()} ${message}`);

export const warn = (message: string) => console.error(`${clock()} ${message}`);

export const error = (message: string) => console.error(`${clock()} ${message}`);
