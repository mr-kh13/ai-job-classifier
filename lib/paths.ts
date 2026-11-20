import { fileURLToPath } from "node:url";

export const projectPath = (...segments: string[]) =>
  fileURLToPath(new URL(["..", ...segments].join("/"), import.meta.url));
