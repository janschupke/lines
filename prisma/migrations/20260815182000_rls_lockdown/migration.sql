-- RLS lockdown. Prisma connects as the table-owning role (owners bypass
-- RLS), so route handlers are unaffected. Supabase exposes public tables
-- over PostgREST with the anon key by default — RLS enabled with zero
-- policies is deny-all, and the REVOKEs close the grants as well.

-- Local Postgres has no anon/authenticated roles; create them (NOLOGIN) so
-- the migration and the integration test behave identically everywhere.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;

ALTER TABLE "Score" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubmissionAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameSession" ENABLE ROW LEVEL SECURITY;
-- No policies. RLS enabled with zero policies is deny-all.

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
