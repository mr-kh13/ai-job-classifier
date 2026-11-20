import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runningRoot = fileURLToPath(new URL("..", import.meta.url));
const isCompiledCopy = basename(dirname(runningRoot)) === ".mda";
const projectRoot = isCompiledCopy ? resolve(runningRoot, "..", "..") : runningRoot;

export const projectPath = (...segments: string[]) => join(projectRoot, ...segments);
