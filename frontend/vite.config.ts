import path from "node:path";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function readGitValue(args: string[], fallback: string) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim() || fallback;
  } catch {
    return fallback;
  }
}

const versionConfig = readFileSync(path.resolve(__dirname, "../config/version.php"), "utf8");

function readVersionValue(name: string) {
  const match = versionConfig.match(new RegExp(`const\\s+${name}\\s*=\\s*['\"]?([^;'\\s]+)['\"]?\\s*;`));
  if (!match) {
    throw new Error(`A constante ${name} não foi encontrada em config/version.php.`);
  }

  return match[1];
}

const appVersion = [
  readVersionValue("APP_VERSION_MAJOR"),
  readVersionValue("APP_VERSION_MINOR"),
  readVersionValue("APP_VERSION_PATCH"),
].join(".");
const appBuild = `${readVersionValue("APP_BUILD_DATE")}.${readVersionValue("APP_BUILD_NUMBER")}`;

const buildCommit =
  process.env.APP_COMMIT_SHA?.slice(0, 7) ??
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  process.env.RENDER_GIT_COMMIT?.slice(0, 7) ??
  readGitValue(["rev-parse", "--short=7", "HEAD"], "local");
export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    "import.meta.env.VITE_APP_BUILD": JSON.stringify(appBuild),
    "import.meta.env.VITE_BUILD_COMMIT": JSON.stringify(buildCommit),
  },
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
