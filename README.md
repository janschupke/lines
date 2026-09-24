# Lines

A turn-based puzzle game on a 9×9 grid: move balls to form lines of five or
more, which pop and score; every move that pops nothing materializes the
preview ghosts into real balls. The board filling up ends the game.

Play at [https://lines.schupke.io/](https://lines.schupke.io/).

## Game

- **Line formation**: horizontal, vertical, or diagonal lines of 5+ clear and
  score on a Fibonacci-style table (5 → 5, 6 → 8, 7 → 13, …).
- **Ghost preview**: the next three spawns are visible as small ghosts before
  they land.
- **Two modes**:
  - **Ranked** — the server referees every move: spawns are dealt one packet
    at a time so no move can be made with foreknowledge, and the whole game
    is replayed server-side before a score is accepted. Ranked scores go on
    the public leaderboard, and every leaderboard row links a public replay.
  - **Casual** — instant and offline-capable; the client holds the game key.
    Scores stay on the device as a local best. The game picks a mode
    automatically (and says why in the mode chip); a ranked game that loses
    its connection degrades to casual rather than blocking play.
- **Keyboard**: `G` guide, `N` new game, `L` leaderboard, `Escape` closes.
- **Persistence**: the running game (as an action log), per-mode local bests,
  and the last used leaderboard name live in localStorage. A saved game is
  replay-validated on load.

## Architecture

Three layers with a hard boundary:

```
src/engine/   Pure rules. No IO, no Date, no Math.random, no DOM — entropy is
              injected (ChaCha20 + HKDF from a game key). Same inputs, same
              game, everywhere. ESLint enforces the purity.
src/game/     Presentation and orchestration: the controller, effect player,
              clocks, persistence, API client, mode/connection machines.
src/server/   Server-only: HMAC session tokens, key derivation, rate
              limiting, Prisma access. Never imported by client code.
```

Next.js route handlers under `app/api/` implement `/games/start`, `/move`,
`/state`, `/finish`, `/scores`, and `/replays/:id`. The leaderboard stores
exactly its 20 rows (insert-and-evict under an advisory lock) — no per-game
ledger; an evicted row takes its replay with it. Design tokens live in
`src/design/tokens.ts` and generate both `app/tokens.generated.css` and the
Tailwind 4 `@theme` block (`app/theme.generated.css`) via `npm run tokens`.

### Layering

Every z-index in the app comes from `LAYERS` in `src/design/tokens.ts` and is
consumed as `var(--z-*)` in CSS or a generated `z-*` utility in markup. There
are no numeric z-index literals in the source, and a unit test scans for them.

One flat order, because there is one stacking context that matters — the root:

```
board decor 0 < cell 1 < popping cell 2 < floating score 3 <
syncing chip 4 < reconnect scrim 5 < chrome 20 < dialog 30
```

`.board-area` is deliberately **not** sealed. `container-type: size` on it
computes to `contain: none` and creates neither a stacking context nor a
containing block, so the board's own layers live in the root context beside
the page chrome — and any `isolation` or z-index there (a flex item with one
becomes a stacking context) would trap the `position: fixed` dialog sheet
used below the sheet breakpoint inside the board. The chrome layer exists
because the mode popover is anchored inside a transformed `.panel-center`,
which traps it at level 0 of its own context; the layer has to be owned by
`.top-panel` / `.page-footer` rather than by the popover.

Modal surfaces share one class, `.game-overlay`; the board's own blocking
status surface is `.board-scrim`. Paint order is covered by
`e2e/layering.spec.ts` across all six viewports — jsdom has no layout and
cannot see a stacking regression.

Leaderboard names pass a multilingual sanitation pipeline
(`src/shared/names/`): NFKC, invisible/zalgo stripping, a 16-grapheme limit,
homoglyph/leet folding, and profanity lists for 14 languages — the same
module runs in the dialog and on the server.

## Development

```bash
npm install
npm run db:up          # Postgres 16 in docker (port 5437)
npx prisma migrate dev
npm run dev
```

Copy `.env.example` to `.env` for the dev secrets. Without a database the
game still runs — it just always picks Casual.

### Test tiers

| Tier        | Command                           | What it is                                                                   |
| ----------- | --------------------------------- | ---------------------------------------------------------------------------- |
| engine      | `npx vitest run --project engine` | pure rules, property tests (fast-check), golden corpus                       |
| ui          | `npx vitest run --project ui`     | jsdom component + controller tests                                           |
| integration | `npm run test:integration`        | route handlers against the real Postgres, single-forked                      |
| e2e         | `npm run test:e2e`                | Playwright across a 6-viewport matrix, incl. zero-tolerance visual baselines |

`npm run test` runs the three vitest tiers; `npm run check` runs knip,
typecheck, tests, lint, format, and the production build. A nightly fuzz
workflow replays random games against the invariants.

### Replay CLI

`npm run replay -- --key <64 hex> --moves <log>` replays an encoded move log
and prints `{score, rngDraws, boardHash, stats}` — used to generate golden
fixtures, precompute Playwright move sequences, and audit a rejected
submission by hand.

### Environment variables

| Var                 | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`      | app connection (pooled in production, `connection_limit=1`) |
| `DIRECT_URL`        | direct connection for `prisma migrate` / `studio`           |
| `GAME_TOKEN_SECRET` | HMAC for session tokens                                     |
| `ENTROPY_SECRET_V1` | game-key derivation (versioned; rotate by adding V2)        |
| `IP_HASH_SALT`      | salted hashing of client IPs for rate limiting              |
| `E2E_FIXED_KEY`     | Playwright determinism only — refused in production         |

Deployment (Vercel + Supabase, pg_cron TTL sweep, production checklists) is
documented in [docs/deploy.md](docs/deploy.md).

## Non-goals

Recorded so they are not re-litigated:

- No UI internationalisation — the profanity filter is multilingual, the UI
  stays English.
- No accounts or auth; identity is a local `playerId` plus a display name.
- No changes to the visual design or to game balance.
- No moderation UI — the deny/allow lists are code.
- No week/day leaderboards and no score history — the table stores exactly
  what it shows; personal bests are local.

## License

This project is licensed under the GNU General Public License v3.0
(GPL-3.0): you can run, study, modify, and redistribute it, and modified
versions must remain under GPL-3.0. See
[https://www.gnu.org/licenses/](https://www.gnu.org/licenses/).
