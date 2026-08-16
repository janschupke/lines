// Runs as the first step of the Playwright webServer command, under the
// webServer env (DATABASE_URL already pointing at `<db>_e2e`): creates and
// migrates that database before `next build` prerenders routes against it.
import { ensureDb } from "./ensure-db";

await ensureDb("e2e");
