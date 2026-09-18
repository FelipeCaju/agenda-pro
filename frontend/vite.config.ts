import path from "node:path";
import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function readGitValue(args: string[], fallback: string) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim() || fallback;
  } catch {
    return fallback;
  }
}

const buildCommit =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  process.env.RENDER_GIT_COMMIT?.slice(0, 7) ??
  readGitValue(["rev-parse", "--short=7", "HEAD"], "local");
const buildDate = readGitValue(["show", "-s", "--format=%cd", "--date=format:%d/%m/%Y", "HEAD"], "em desenvolvimento");

export default defineConfig({
  define: {
    "import.meta.env.VITE_BUILD_COMMIT": JSON.stringify(buildCommit),
    "import.meta.env.VITE_BUILD_DATE": JSON.stringify(buildDate),
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
