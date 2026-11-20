import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { projectPath } from "./utils/paths";

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

function parseHardRequirements(preferences: string) {
  const lines = preferences.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+hard requirements\s*$/i.test(line.trim()));
  if (start === -1) return [];

  const requirements: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2}\s/.test(line)) break;
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) requirements.push(bullet[1].trim());
  }
  return requirements;
}

export async function readProfile() {
  const [resume, preferences] = await Promise.all([
    readFile(profilePath(PROFILE_FILES.resume), "utf8"),
    readFile(profilePath(PROFILE_FILES.preferences), "utf8"),
  ]);
  return { resume, preferences, hardRequirements: parseHardRequirements(preferences) };
}

export type Profile = Awaited<ReturnType<typeof readProfile>>;
