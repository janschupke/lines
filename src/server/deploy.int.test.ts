import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { MAX_GAME_MS, e2eFixedKeyHex } from "./config";

/**
 * Deploy-shape guards (Phase 10). No database needed — these pin the deploy
 * artifacts to the code so an ops file cannot drift silently.
 */

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("pg_cron TTL sweep", () => {
  const sql = read("prisma/sql/pg_cron_ttl_sweep.sql");

  it("sweeps GameSession only, with the window matching MAX_GAME_MS", () => {
    const interval = sql.match(/interval '(\d+) hours'/);
    expect(interval).not.toBeNull();
    expect(Number(interval![1]) * 3600 * 1000).toBe(MAX_GAME_MS);
    expect(sql).toContain('DELETE FROM "GameSession" WHERE "createdAt" <');
    // Expiry, not retention: Score is self-bounding, SubmissionAttempt is
    // kept by decision.
    expect(sql).not.toMatch(/DELETE FROM "(Score|SubmissionAttempt)"/);
  });

  it("is idempotent to re-run (named cron.schedule upserts)", () => {
    expect(sql).toContain("create extension if not exists pg_cron");
    expect(sql).toMatch(/cron\.schedule\(\s*'lines-gamesession-ttl-sweep'/);
  });
});

describe("serverless route shape", () => {
  it("every API route and Prisma-reading page pins runtime = nodejs", () => {
    const files = (
      readdirSync(join(root, "app"), { recursive: true }) as string[]
    ).filter((f) => f.endsWith("route.ts"));
    expect(files.length).toBeGreaterThanOrEqual(6);
    for (const file of files) {
      expect(read(join("app", file))).toContain(
        'export const runtime = "nodejs"',
      );
    }
    expect(read("app/leaderboard/page.tsx")).toContain(
      'export const runtime = "nodejs"',
    );
  });
});

describe("Supabase is nothing but hosted Postgres", () => {
  it("no @supabase/supabase-js, no NEXT_PUBLIC_* variables", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps)).not.toContain("@supabase/supabase-js");

    const sources = (["src", "app"] as const).flatMap((dir) =>
      (readdirSync(join(root, dir), { recursive: true }) as string[])
        .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes("deploy.int"))
        .map((f) => join(dir, f)),
    );
    const offenders = sources.filter((f) => read(f).includes("NEXT_PUBLIC_"));
    expect(offenders).toEqual([]);
  });
});

describe("Vercel build", () => {
  it("the build command migrates over the direct URL, then builds via prebuild", () => {
    const vercel = JSON.parse(read("vercel.json")) as { buildCommand: string };
    expect(vercel.buildCommand).toBe("npm run build:deploy");
    const pkg = JSON.parse(read("package.json")) as {
      scripts: Record<string, string>;
    };
    // `npm run build` (not `next build`) so the tokens prebuild still fires.
    expect(pkg.scripts["build:deploy"]).toBe(
      "prisma migrate deploy && npm run build",
    );
  });
});

describe("E2E_FIXED_KEY containment", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("throws in production on Vercel even when set", () => {
    vi.stubEnv("E2E_FIXED_KEY", "07".repeat(32));
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => e2eFixedKeyHex()).toThrow(/never be set in production/);
  });
});
