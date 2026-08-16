import "dotenv/config";
import { ensureDb } from "../../scripts/ensure-db";

// Runs before every integration test file: point the tier at its own
// `<db>_test` database. These tests TRUNCATE tables in beforeEach — they
// must never run against the dev database. The globalThis flag survives
// vitest's per-file module isolation, so the create+migrate runs once.
const state = globalThis as { __intDbReady?: boolean };
if (process.env["DATABASE_URL"] && !state.__intDbReady) {
  process.env["DATABASE_URL"] = await ensureDb("test");
  state.__intDbReady = true;
}
