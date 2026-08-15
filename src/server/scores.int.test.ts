import "dotenv/config";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { GET as scores } from "../../app/api/scores/route";
import { GET as replays } from "../../app/api/replays/[id]/route";
import { POST as finish } from "../../app/api/games/[id]/finish/route";
import { prisma } from "./db";
import {
  createGame,
  applyAction,
  scriptedEntropy,
  boardHash,
  decodeMoves,
  freeOfBalls,
  reachableFrom,
} from "@/engine";
import type { GameAction, GameState } from "@/engine";
import { POST as start } from "../../app/api/games/start/route";
import { POST as move } from "../../app/api/games/[id]/move/route";

const hasDb = !!process.env["DATABASE_URL"];
const PLAYER = "00000000-0000-4000-8000-000000000077";

const req = (body: unknown) =>
  new Request("http://t/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

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

async function playFullGame() {
  const startRes = await start(req({ playerId: PLAYER }));
  const data = await startRes.json();
  let state = createGame(scriptedEntropy(data.init, []));
  for (let i = 0; i < 400 && !state.over; i++) {
    const action = anyLegalMove(state);
    const res = await move(
      req({
        token: data.token,
        moveCount: state.moveCount,
        from: action.from,
        to: action.to,
        boardHash: boardHash(state),
      }),
      params(data.gameId),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const r = applyAction(
      state,
      action,
      scriptedEntropy(data.init, [body.packet]),
    );
    if (!r.ok) throw new Error(r.error);
    state = r.state;
  }
  return { ...data, state };
}

describe.skipIf(!hasDb)("scores and replays", () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "Score", "GameSession", "SubmissionAttempt" RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("scores returns the whole table with threshold and no private fields", async () => {
    const game = await playFullGame();
    const finishRes = await finish(
      req({ token: game.token, name: "Scorer", durationMs: 60_000 }),
      params(game.gameId),
    );
    expect(finishRes.status).toBe(200);
    const res = await scores();
    const text = await res.clone().text();
    const body = await res.json();
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0].name).toBe("Scorer");
    expect(body.entries[0].rank).toBe(1);
    expect(typeof body.threshold).toBe("number");
    for (const secret of ["moves", "ipHash", "playerId", "keyVersion"]) {
      expect(text).not.toContain(secret);
    }
  });

  it("a replay reconstructs the exact submitted game and never leaks keys", async () => {
    const game = await playFullGame();
    await finish(
      req({ token: game.token, name: "Replayed", durationMs: 60_000 }),
      params(game.gameId),
    );
    const row = await prisma.score.findUniqueOrThrow({
      where: { gameId: game.gameId },
    });
    const res = await replays(new Request("http://t"), params(row.id));
    expect(res.status).toBe(200);
    const text = await res.clone().text();
    const body = await res.json();
    // replay the response's own init+packets to the final board
    const moves = decodeMoves(body.moves)!;
    const entropy = scriptedEntropy(body.init, body.packets);
    let replayed = createGame(scriptedEntropy(body.init, []));
    for (const m of moves) {
      const r = applyAction(replayed, m, entropy);
      expect(r.ok).toBe(true);
      if (r.ok) replayed = r.state;
    }
    expect(boardHash(replayed)).toBe(boardHash(game.state));
    expect(replayed.score).toBe(body.score);
    expect(text).not.toContain(process.env["ENTROPY_SECRET_V1"]!);
    // an evicted / unknown row 404s
    const missing = await replays(
      new Request("http://t"),
      params("00000000-0000-4000-8000-00000000dead"),
    );
    expect(missing.status).toBe(404);
  });
});
