# Deploying to Vercel + Supabase (Phase 10)

In this architecture Supabase is nothing but hosted Postgres. Prisma connects
over the Postgres wire protocol as a database role; PostgREST is not in the
path. **Do not install `@supabase/supabase-js`, do not ship any Supabase key
to the client, and do not add `NEXT_PUBLIC_*` variables** — the client talks
only to our own route handlers. `src/server/deploy.int.test.ts` enforces all
three.

## 1. Environment split

| Var            | Value                                                                                 | Used by                              |
| -------------- | ------------------------------------------------------------------------------------- | ------------------------------------ |
| `DATABASE_URL` | `postgresql://…@…pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` | the running app (`src/server/db.ts`) |
| `DIRECT_URL`   | `postgresql://…@db.<ref>.supabase.co:5432/postgres`                                   | `prisma migrate`, `prisma studio`    |

Both URLs come from Supabase Dashboard → Connect. `connection_limit=1` is
**mandatory** on serverless: each lambda invocation gets its own Prisma
client, and anything higher exhausts the pooler under concurrency.

`prisma.config.ts` resolves the CLI URL as `DATABASE_DIRECT_URL` →
`DIRECT_URL` → `DATABASE_URL_UNPOOLED` → `DATABASE_URL` and **throws** if a
`*.pooler.supabase.com:6543` URL reaches `migrate` — without the guard the
command hangs until CI times out. Verified rehearsal:

```sh
DIRECT_URL="postgresql://x:y@aws-0-eu.pooler.supabase.com:6543/postgres" \
  npx prisma migrate status   # fails fast with the guard's message
```

Secrets, ≥32 random bytes each (`openssl rand -hex 32`):

- `GAME_TOKEN_SECRET`
- `ENTROPY_SECRET_V1` (rotating; rows store `keyVersion`, older secrets stay
  readable — add `ENTROPY_SECRET_V2` and bump `CURRENT_KEY_VERSION` to rotate)
- `IP_HASH_SALT`

`E2E_FIXED_KEY` must **not** be set in production. `src/server/config.ts`
throws if it is set while `VERCEL` + `NODE_ENV=production`
(covered by `deploy.int.test.ts`), but check the Vercel env list once by hand.

## 2. Build + migrations

`vercel.json` sets `buildCommand: "npm run build:deploy"`, which runs
`prisma migrate deploy && npm run build` — migrate goes through
`prisma.config.ts` (so over `DIRECT_URL`, pooler-guarded), and `npm run build`
keeps the `prebuild` tokens step. **Never `db push` against production.**

Both migrations must apply: `…_init` and `…_rls_lockdown`. The lockdown is
not optional — Supabase exposes every table in `public` over PostgREST with
the public anon key by default, and `playerId`, `ipHash` and the
`SubmissionAttempt` rate-limit map must not be enumerable.

## 3. pg_cron TTL sweep

Run `prisma/sql/pg_cron_ttl_sweep.sql` once in the Supabase SQL editor (or
`psql "$DIRECT_URL" -f prisma/sql/pg_cron_ttl_sweep.sql`). It is idempotent.
This is `pg_cron`, not a Vercel cron — a Vercel cron would depend on the app
being up. The 24-hour window matches `MAX_GAME_MS`; `deploy.int.test.ts`
pins them together, and `db.int.test.ts` exercises the DELETE itself
(25-hour-old row swept, fresh row kept).

Verify in production once:

```sql
select jobname, schedule, command from cron.job;               -- job exists
insert into "GameSession" ("gameId","playerId","keyVersion","balls","ghosts",
  "boardHash","stats","engineVersion","ipHash","createdAt","moveCount","moves","suspicious")
values (gen_random_uuid(), gen_random_uuid(), 1, '\x00', '\x00',
  '00000000', '{}', 2, 'deadbeef', now() - interval '25 hours', 0, '', false);
select cron.schedule('lines-gamesession-ttl-sweep-once','1 second',
  $$DELETE FROM "GameSession" WHERE "createdAt" < now() - interval '24 hours'$$);
-- wait a few seconds, confirm the old row is gone and live sessions are not,
-- then: select cron.unschedule('lines-gamesession-ttl-sweep-once');
```

## 4. Production verification (once, by hand)

- **RLS**: `psql "postgresql://anon@db.<ref>.supabase.co:5432/postgres" -c
'SELECT * FROM "Score" LIMIT 1'` is denied. The integration suite covers
  this locally; this confirms the lockdown migration actually applied.
- **Eviction**: submit 25 qualifying games in sequence and assert
  `SELECT count(*) FROM "Score"` never exceeds 20, the five lowest are gone,
  and `GET /api/replays/<evicted id>` returns 404.
- **Non-qualifying**: submit a score below the threshold — no `Score` row is
  written and the `GameSession` row is still deleted.
- **Concurrency**: fire two qualifying submissions at once — the advisory
  lock leaves exactly 20 rows, both ranked correctly.
- **HOT updates**: after ~200 `/move` calls on one session,

  ```sql
  select n_tup_upd, n_tup_hot_upd from pg_stat_user_tables
  where relname = 'GameSession';
  ```

  `n_tup_hot_upd` should be close to `n_tup_upd`. If not, an indexed column
  is being updated on the move path.

- **Key containment**: `curl` the live `/api/scores`, a `/api/replays/:id`
  and a full `/start`→`/move` exchange; grep the responses for the entropy
  secret, `ipHash`, `playerId` — none may appear.

## 5. Preview smoke tests

```sh
SMOKE_BASE_URL=https://<preview>.vercel.app \
  npx playwright test e2e/deploy-smoke.spec.ts --project=desktop
```

`e2e/deploy-smoke.spec.ts` runs only when `SMOKE_BASE_URL` is set (the
regular suite always skips it) and needs no local server or database. It
covers: page load with a **stated mode reason** (a cold start may
legitimately yield Casual — the reason string is the assertion, never the
mode), a full game to the end dialog, two concurrent ranked API games played
to `/finish` (pooler exhaustion shows up here), and the leaderboard + replay
with a no-leak check on the page source.

It writes real rows — up to two finished games named "Smoke". Point it at
previews, not production. Rehearse locally against a production build:

```sh
npm run build
npm run start          # with .env pointing at the docker Postgres
SMOKE_BASE_URL=http://localhost:3000 \
  npx playwright test e2e/deploy-smoke.spec.ts --project=desktop
```
