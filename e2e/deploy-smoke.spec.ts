import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import {
  createGame,
  applyAction,
  scriptedEntropy,
  boardHash,
  freeOfBalls,
  reachableFrom,
} from "@/engine";
import type { GameAction, GameState, InitPacket, SpawnPacket } from "@/engine";

// Post-deploy smoke pass (Phase 10): runs ONLY when SMOKE_BASE_URL points at
// a live deployment — a Vercel preview, or a local `next start` rehearsal.
// It watches for the serverless-shaped failures the local suite cannot
// produce: cold starts pushing /start past the probe budget (so assert the
// REASON is stated, never that the mode is ranked), pooler exhaustion under
// concurrent games, and a route that lost `runtime = "nodejs"`.
//
// It writes real rows: up to two ranked games finish under the name "Smoke".
// Point it at previews, not production.
const base = process.env["SMOKE_BASE_URL"];

test.skip(!base, "deploy smoke: set SMOKE_BASE_URL to run");
test.skip(({ viewport }) => viewport!.width !== 1280, "desktop only");
test.setTimeout(300_000);

const seenIntro = `localStorage.setItem("lines:seenModeIntro:v1", "1");`;

test("the game loads and states why it picked its mode", async ({ page }) => {
  await page.addInitScript(seenIntro);
  await page.goto("/");
  const chip = page.locator('[data-testid="mode-chip"]');
  await expect(chip).toBeVisible({ timeout: 20_000 });
  // A cold start may legitimately push the probe past its budget and yield
  // Casual — what must hold is a settled mode with a stated reason.
  await expect(chip).toHaveAttribute("data-mode", /^(ranked|casual)$/, {
    timeout: 20_000,
  });
  await expect(page.locator('[data-testid="mode-reason"]')).not.toBeEmpty();
  await expect(page.locator("[data-cell]")).toHaveCount(81);
});

test("a full game reaches the end dialog in some honest state", async ({
  page,
}) => {
  await page.addInitScript(seenIntro);
  await page.goto("/");
  await expect(page.locator("[data-cell]")).toHaveCount(81);

  for (let turn = 0; turn < 120; turn++) {
    const dialogOpen = await page
      .locator('[data-testid^="submission-"]')
      .count();
    if (dialogOpen > 0) break;
    const pair = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll("[data-cell]"));
      const at = (i: number) =>
        cells.find((c) => c.getAttribute("data-cell") === String(i));
      for (const cell of cells) {
        if (!cell.hasAttribute("data-ball")) continue;
        const i = Number(cell.getAttribute("data-cell"));
        const x = i % 9;
        const neighbours = [
          x > 0 ? i - 1 : -1,
          x < 8 ? i + 1 : -1,
          i - 9,
          i + 9,
        ];
        for (const n of neighbours) {
          if (n < 0 || n > 80) continue;
          const target = at(n);
          if (target && !target.hasAttribute("data-ball")) {
            return { from: i, to: n };
          }
        }
      }
      return null;
    });
    if (!pair) break;
    await page.locator(`[data-cell="${pair.from}"]`).click();
    await page.locator(`[data-cell="${pair.to}"]`).click();
    await page.waitForTimeout(150);
  }

  // Any submission state is a pass: casual, form, not-qualified, unreachable.
  // What must NOT happen is a hung game or a dialog that never opens.
  await expect(
    page.locator('[data-testid^="submission-"]').first(),
  ).toBeVisible({ timeout: 30_000 });
});

function anyLegalMove(state: GameState): GameAction {
  for (let from = 0; from < 81; from++) {
    if (state.balls[from] === 0) continue;
    const reach = reachableFrom(state.balls, from);
    for (const to of freeOfBalls(state.balls)) {
      if (to !== from && reach[to] === 1) return { t: "move", from, to };
    }
  }
  throw new Error("no legal move");
}

async function playApiGame(
  request: APIRequestContext,
  playerId: string,
): Promise<void> {
  const startRes = await request.post("/api/games/start", {
    data: { playerId },
  });
  expect(startRes.status(), "start").toBe(200);
  const data = (await startRes.json()) as {
    gameId: string;
    token: string;
    init: InitPacket;
  };
  let state = createGame(scriptedEntropy(data.init, []));
  for (let i = 0; i < 400 && !state.over; i++) {
    const action = anyLegalMove(state);
    const res = await request.post(`/api/games/${data.gameId}/move`, {
      data: {
        token: data.token,
        moveCount: state.moveCount,
        from: action.from,
        to: action.to,
        boardHash: boardHash(state),
      },
    });
    expect(res.status(), `move ${i}`).toBe(200);
    const body = (await res.json()) as { packet: SpawnPacket };
    const r = applyAction(
      state,
      action,
      scriptedEntropy(data.init, [body.packet]),
    );
    if (!r.ok) throw new Error(r.error);
    state = r.state;
  }
  expect(state.over, "game reaches game over").toBe(true);
  const finishRes = await request.post(`/api/games/${data.gameId}/finish`, {
    data: {
      token: data.token,
      name: "Smoke",
      durationMs: state.moveCount * 1000,
    },
  });
  expect(finishRes.status(), "finish").toBe(200);
}

test("two concurrent ranked API games survive the pooler", async ({
  request,
}) => {
  // connection_limit=1 misconfiguration or pooler exhaustion shows up here
  // as 5xx or timeouts on interleaved moves.
  await Promise.all([
    playApiGame(request, "00000000-0000-4000-8000-00000000510e"),
    playApiGame(request, "00000000-0000-4000-8000-00000000510f"),
  ]);
});

test("leaderboard renders and leaks nothing private", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(
    page.getByText("refereed by the server", { exact: false }),
  ).toBeVisible({ timeout: 20_000 });
  const source = await page.content();
  expect(source).not.toContain("playerId");
  expect(source).not.toContain("ipHash");

  // If any row exists (the API journey above usually guarantees it), its
  // replay must open and render a board.
  const replayLinks = page.getByText("Replay", { exact: true });
  if ((await replayLinks.count()) > 0) {
    await replayLinks.first().click();
    await expect(page.locator('[data-testid="replay-board"]')).toBeVisible({
      timeout: 20_000,
    });
  }
});
