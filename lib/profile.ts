import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { projectPath } from "./paths";

const PROFILE_FILES = {
  resume: "resume.md",
  preferences: "preferences.md",
} as const;

const profilePath = (name: string) => projectPath("profile", name);

export function assertProfileFiles() {
  const missing = Object.values(PROFILE_FILES).filter((name) => !existsSync(profilePath(name)));
  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.map((name) => `profile/${name}`).join(", ")}. Create them as described in the README.`,
    );
  }
}

export async function readProfile() {
  const [resume, preferences] = await Promise.all([
    readFile(profilePath(PROFILE_FILES.resume), "utf8"),
    readFile(profilePath(PROFILE_FILES.preferences), "utf8"),
  ]);
  return { resume, preferences };
}
