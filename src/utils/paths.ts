import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

export const projectPath = (...segments: string[]) => join(projectRoot, ...segments);
