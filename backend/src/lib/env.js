import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let loaded = false;

function parseEnvironmentLine(line) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const rawValue = trimmed.slice(separatorIndex + 1).trim();

  if (!key) {
    return null;
  }

  const value = rawValue.replace(/^['"]|['"]$/g, "");
  return { key, value };
}

export function loadEnvironment() {
  if (loaded) {
    return;
  }

  loaded = true;

  const currentFile = fileURLToPath(import.meta.url);
  const envPath = path.resolve(path.dirname(currentFile), "../../.env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");

  contents.split(/\r?\n/).forEach((line) => {
    const parsed = parseEnvironmentLine(line);

    if (!parsed || process.env[parsed.key] !== undefined) {
      return;
    }

    process.env[parsed.key] = parsed.value;
  });
}
