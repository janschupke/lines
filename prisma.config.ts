// Ported from ~/dev/corpus/prisma.config.ts — CLI URL resolution with a
// documented precedence, plus the transaction-pooler guard for migrate.
import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Connection string for Prisma CLI only (`migrate`, `db push`, `studio`, etc.).
 *
 * Local Postgres: `DATABASE_URL` alone is enough (no pooler in the way).
 *
 * Hosted poolers (Neon, Supabase transaction pooler, PgBouncer): set a **direct**
 * Postgres URL for the CLI — first match wins:
 * `DATABASE_DIRECT_URL`, `DIRECT_URL` (common in Supabase templates), `DATABASE_URL_UNPOOLED` (Neon).
 * The Next API uses `DATABASE_URL` in `src/server/db.ts` (often pooled).
 */
function prismaCliDatabaseUrl(): string {
  const url =
    process.env["DATABASE_DIRECT_URL"]?.trim() ||
    process.env["DIRECT_URL"]?.trim() ||
    process.env["DATABASE_URL_UNPOOLED"]?.trim() ||
    process.env["DATABASE_URL"]?.trim();
  if (!url) {
    if (!prismaCommandNeedsDatabase()) {
      return "postgresql://lines:lines@localhost:5437/lines";
    }
    throw new Error(
      "Prisma CLI needs DATABASE_URL (or DATABASE_DIRECT_URL / DIRECT_URL). See .env.example.",
    );
  }
  assertNotSupabaseTransactionPoolerForMigrate(url);
  return url;
}

function prismaCommandNeedsDatabase(): boolean {
  return process.argv.some((arg) => ["migrate", "db", "studio"].includes(arg));
}

/** Supabase transaction pooler (:6543) breaks Prisma Migrate and often hangs until CI times out. */
function assertNotSupabaseTransactionPoolerForMigrate(url: string): void {
  let parsed: URL;
  try {
    const normalized = url.startsWith("postgres://")
      ? `postgresql://${url.slice("postgres://".length)}`
      : url;
    if (!normalized.startsWith("postgresql://")) {
      return;
    }
    parsed = new URL(normalized);
  } catch {
    return;
  }
  const host = parsed.hostname.toLowerCase();
  const port = parsed.port || "5432";
  if (host.endsWith(".pooler.supabase.com") && port === "6543") {
    throw new Error(
      "Prisma migrate cannot use the Supabase transaction pooler (port 6543); it will hang or time out. " +
        "Set DATABASE_DIRECT_URL or DIRECT_URL in your Vercel env to the direct connection string " +
        "(host `db.<project-ref>.supabase.co`, port `5432`, from Supabase Dashboard → Connect → Direct). " +
        "Keep DATABASE_URL as the pooler URL for the running API.",
    );
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: prismaCliDatabaseUrl(),
  },
});
