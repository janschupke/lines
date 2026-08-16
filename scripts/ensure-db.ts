import { execSync } from "node:child_process";
import { Client } from "pg";

/**
 * Test-tier database isolation. The integration suite truncates tables and
 * the e2e suite plays with the fixed E2E key — neither may ever touch the
 * dev database, or dev ends up with a wiped leaderboard and rows whose
 * replays cannot be reconstructed. Derives `<db>_<suffix>` from
 * DATABASE_URL, creates it if missing and migrates it, returning the URL.
 */
export async function ensureDb(suffix: string): Promise<string> {
  const baseUrl = process.env["DATABASE_URL"];
  if (!baseUrl) throw new Error("DATABASE_URL is not set");
  const url = new URL(baseUrl);
  const baseName = url.pathname.slice(1);
  const name = baseName.endsWith(`_${suffix}`)
    ? baseName
    : `${baseName}_${suffix}`;

  // Admin connection via the always-present maintenance db — DATABASE_URL
  // may already point at the (possibly nonexistent) target database.
  const adminUrl = new URL(baseUrl);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== "42P04") throw err; // 42P04 = already exists
  } finally {
    await admin.end();
  }

  url.pathname = `/${name}`;
  const target = url.toString();
  execSync("npx prisma migrate deploy", {
    env: {
      ...process.env,
      DATABASE_URL: target,
      DATABASE_DIRECT_URL: target,
    },
    stdio: "pipe",
  });
  return target;
}

/** Pure URL transform for config files that must not do IO at load time. */
export function suffixedDbUrl(suffix: string): string | undefined {
  const baseUrl = process.env["DATABASE_URL"];
  if (!baseUrl) return undefined;
  const url = new URL(baseUrl);
  if (url.pathname.endsWith(`_${suffix}`)) return baseUrl;
  url.pathname = `${url.pathname}_${suffix}`;
  return url.toString();
}
