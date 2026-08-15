-- GameSession TTL sweep (Phase 10). Run once against the PRODUCTION database
-- (Supabase SQL editor, or psql over DIRECT_URL). pg_cron is not in the local
-- docker image; locally the sweep DELETE itself is exercised by
-- src/server/db.int.test.ts.
--
-- This is expiry, not retention: an abandoned in-progress game must
-- eventually stop occupying a row, or /start becomes an unbounded
-- row-insertion amplifier. Score is self-bounding (20 rows) and
-- SubmissionAttempt is kept indefinitely by decision — do not sweep those.
--
-- The 24-hour window MUST match MAX_GAME_MS in src/server/config.ts, or a
-- game can outlive its own session — deploy.int.test.ts pins the two
-- together. Scheduled with pg_cron, not a Vercel cron: a Vercel cron would
-- depend on the app being up.

create extension if not exists pg_cron;

-- cron.schedule upserts by job name, so re-running this file is safe.
select cron.schedule(
  'lines-gamesession-ttl-sweep',
  '17 * * * *', -- hourly, off the top of the hour
  $$DELETE FROM "GameSession" WHERE "createdAt" < now() - interval '24 hours'$$
);
