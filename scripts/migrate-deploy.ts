// The migrate half of `build:deploy`. The database is optional, so a deploy
// must never fail on it: with no URL configured there is nothing to migrate,
// and a failed migration only costs ranked play (the probe falls back to
// Casual) — it must not take the casual game down with it.
import "dotenv/config";
import { execSync } from "node:child_process";

// Same precedence as prisma.config.ts, which the CLI resolves on its own.
const CLI_URL_VARS = [
  "DATABASE_DIRECT_URL",
  "DIRECT_URL",
  "DATABASE_URL_UNPOOLED",
  "DATABASE_URL",
];

const configured = CLI_URL_VARS.some((name) => process.env[name]?.trim());

if (!configured) {
  console.warn("[migrate] no database configured — skipping migrations");
} else {
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  } catch {
    console.warn(
      "[migrate] prisma migrate deploy failed — building anyway; ranked play " +
        "stays unavailable until the migrations apply",
    );
  }
}
