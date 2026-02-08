import fs from "node:fs";
import path from "node:path";

export type E2ETestEnvironment = {
  BASE_URL?: string;
  NEXT_PUBLIC_API_URL?: string;
};

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex < 1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  if (!key) {
    return null;
  }

  const rawValue = trimmed.slice(separatorIndex + 1).trim();
  const value = rawValue.replace(/^(["'])(.*)\1$/, "$2");

  return [key, value];
}

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const env: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      continue;
    }
    const [key, value] = parsed;
    env[key] = value;
  }

  return env;
}

export function loadTestEnvironment(projectRoot: string): E2ETestEnvironment {
  const envFiles = [".env.test.local", ".env.test"];

  for (const fileName of envFiles) {
    const filePath = path.join(projectRoot, fileName);
    const values = readEnvFile(filePath);
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  return {
    BASE_URL: process.env.BASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  };
}
