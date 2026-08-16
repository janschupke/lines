import "dotenv/config";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { POST as start } from "../../app/api/games/start/route";
import { POST as move } from "../../app/api/games/[id]/move/route";
import { GET as state } from "../../app/api/games/[id]/state/route";
import { POST as finish } from "../../app/api/games/[id]/finish/route";
import { prisma } from "./db";
import {
  createGame,
  applyAction,
  scriptedEntropy,
  boardHash,
  keyedEntropy,
  freeOfBalls,
  reachableFrom,
  ENGINE_VERSION,
} from "@/engine";
import type { GameAction, GameState, InitPacket, SpawnPacket } from "@/engine";
import { signToken } from "./token";

const hasDb = !!process.env["DATABASE_URL"];
const PLAYER = "00000000-0000-4000-8000-000000000042";

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://t/api", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const params = (id: string) => ({ params: Promise.resolve({ id }) });

interface StartedGame {
  gameId: string;
  token: string;
  init: InitPacket;
  state: GameState;
  packets: SpawnPacket[];
  moves: GameAction[];
}

async function startGame(playerId = PLAYER): Promise<StartedGame> {
  const res = await start(req({ playerId }));
  expect(res.status).toBe(200);
  const data = await res.json();
  const scripted = scriptedEntropy(data.init, []);
  const mirror = createGame(scripted);
  return {
    gameId: data.gameId,
    token: data.token,
    init: data.init,
    state: mirror,
    packets: [],
    moves: [],
  };
}

/** One move through the real handler, mirrored locally via scriptedEntropy. */
async function playMove(
  game: StartedGame,
  action: GameAction,
): Promise<Response> {
  const res = await move(
    req({
      token: game.token,
      moveCount: game.state.moveCount,
      from: action.from,
      to: action.to,
      boardHash: boardHash(game.state),
    }),
    params(game.gameId),
  );
  if (res.status !== 200) return res;
  const data = await res.clone().json();
  const scripted = scriptedEntropy(game.init, [data.packet]);
  const local = applyAction(game.state, action, scripted);
  expect(local.ok).toBe(true);
  if (local.ok) {
    // client-side divergence check: an engine bug, not a cheat
    expect(boardHash(local.state)).toBe(data.boardHash);
    game.state = local.state;
    game.packets.push(data.packet);
    game.moves.push(action);
  }
  return res;
}

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

/** Drives /start -> n x /move -> over, so tests read as games. */
async function playGame(maxMoves = 400): Promise<StartedGame> {
  const game = await startGame();
  for (let i = 0; i < maxMoves && !game.state.over; i++) {
    const res = await playMove(game, anyLegalMove(game.state));
    expect(res.status).toBe(200);
  }
  expect(game.state.over).toBe(true);
  return game;
}

const seedScoreRows = async (n: number, base = 100) => {
  for (let i = 0; i < n; i++) {
    await prisma.score.create({
      data: {
        gameId: `00000000-0000-4000-8000-9${String(i).padStart(11, "0")}`,
        playerId: PLAYER,
        name: `Seed${i}`,
        score: base + i,
        durationMs: 60_000,
        moveCount: 50,
        linesPopped: 3,
        longestLine: 5,
        ballsCleared: 15,
        keyVersion: 1,
        moves: "",
        engineVersion: ENGINE_VERSION,
        boardHash: "00000000",
        ipHash: "0".repeat(64),
      },
    });
  }
};

describe.skipIf(!hasDb)("ranked API", () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "Score", "GameSession", "SubmissionAttempt" RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("start creates exactly one session and reveals only the board", async () => {
    const game = await startGame();
    expect(await prisma.gameSession.count()).toBe(1);
    expect(game.init.balls).toHaveLength(5);
    expect(game.init.ghosts).toHaveLength(3);
  });

  it("moves advance the session and the mirror stays in sync", async () => {
    const game = await startGame();
    for (let i = 0; i < 5; i++) {
      const res = await playMove(game, anyLegalMove(game.state));
      expect(res.status).toBe(200);
    }
    const session = await prisma.gameSession.findUniqueOrThrow({
      where: { gameId: game.gameId },
    });
    expect(session.moveCount).toBe(5);
    expect(session.boardHash).toBe(boardHash(game.state));
  });

  it("rewind guard: stale count + same move is an idempotent retry", async () => {
    const game = await startGame();
    const action = anyLegalMove(game.state);
    const before = game.state;
    await playMove(game, action);
    // retry the identical request with the pre-move state
    const retry = await move(
      req({
        token: game.token,
        moveCount: before.moveCount,
        from: action.from,
        to: action.to,
        boardHash: boardHash(before),
      }),
      params(game.gameId),
    );
    expect(retry.status).toBe(200);
    const data = await retry.json();
    expect(data.packet).toEqual(game.packets[0]);
    expect(data.moveCount).toBe(1); // unchanged
  });

  it("rewind guard: stale count + different move is rejected and recorded", async () => {
    const game = await startGame();
    const before = game.state;
    await playMove(game, anyLegalMove(game.state));
    const other = anyLegalMove(game.state);
    const res = await move(
      req({
        token: game.token,
        moveCount: before.moveCount, // stale
        from: other.from,
        to: other.to,
        boardHash: boardHash(before),
      }),
      params(game.gameId),
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("state_mismatch");
    const rewinds = await prisma.submissionAttempt.count({
      where: { outcome: "rewind" },
    });
    expect(rewinds).toBe(1);
  });

  it("boardHash disagreement is a state_mismatch", async () => {
    const game = await startGame();
    const action = anyLegalMove(game.state);
    const res = await move(
      req({
        token: game.token,
        moveCount: 0,
        from: action.from,
        to: action.to,
        boardHash: "ffffffff",
      }),
      params(game.gameId),
    );
    expect(res.status).toBe(409);
  });

  it("forged and cross-game tokens are rejected", async () => {
    const game = await startGame();
    const action = anyLegalMove(game.state);
    const forged = game.token.slice(0, -4) + "AAAA";
    const res1 = await move(
      req({
        token: forged,
        moveCount: 0,
        from: action.from,
        to: action.to,
        boardHash: boardHash(game.state),
      }),
      params(game.gameId),
    );
    expect(res1.status).toBe(401);
    const other = await startGame();
    const res2 = await move(
      req({
        token: other.token,
        moveCount: 0,
        from: action.from,
        to: action.to,
        boardHash: boardHash(game.state),
      }),
      params(game.gameId),
    );
    expect(res2.status).toBe(401);
    // wrong engine version
    const wrongVersion = signToken({
      v: 1,
      gameId: game.gameId,
      issuedAt: Date.now(),
      engineVersion: ENGINE_VERSION + 1,
      keyVersion: 1,
    });
    const res3 = await move(
      req({
        token: wrongVersion,
        moveCount: 0,
        from: action.from,
        to: action.to,
        boardHash: boardHash(game.state),
      }),
      params(game.gameId),
    );
    expect(res3.status).toBe(409);
  });

  it("state returns the authoritative board and never key material", async () => {
    const game = await startGame();
    await playMove(game, anyLegalMove(game.state));
    const res = await state(
      new Request("http://t", { headers: { "x-game-token": game.token } }),
      params(game.gameId),
    );
    expect(res.status).toBe(200);
    const text = await res.clone().text();
    const data = await res.json();
    expect(data.boardHash).toBe(boardHash(game.state));
    expect(text.includes("key")).toBe(false);
  });

  it("happy path: full game -> finish -> Score row matches the audit", async () => {
    const game = await playGame();
    const res = await finish(
      req({ token: game.token, name: "Tester", durationMs: 90_000 }),
      params(game.gameId),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.qualified).toBe(true);
    const row = await prisma.score.findUniqueOrThrow({
      where: { gameId: game.gameId },
    });
    expect(row.score).toBe(game.state.score);
    expect(row.boardHash).toBe(boardHash(game.state));
    expect(row.name).toBe("Tester");
    // session deleted
    expect(await prisma.gameSession.count()).toBe(0);
    // idempotent double-finish
    const again = await finish(
      req({ token: game.token, name: "Other", durationMs: 90_000 }),
      params(game.gameId),
    );
    expect(again.status).toBe(200);
    expect((await again.json()).qualified).toBe(true);
    expect(await prisma.score.count()).toBe(1);
  });

  it("non-qualifying score: 200, no row, no name check, session deleted", async () => {
    await seedScoreRows(20, 1000); // board full, all above any real score
    const game = await playGame();
    const res = await finish(
      // an invalid name proves sanitization is not reached on this path
      req({ token: game.token, name: "🎮🎮🎮", durationMs: 90_000 }),
      params(game.gameId),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.qualified).toBe(false);
    expect(typeof data.threshold).toBe("number");
    expect(await prisma.score.count()).toBe(20);
    expect(
      await prisma.gameSession.findUnique({ where: { gameId: game.gameId } }),
    ).toBeNull();
  });

  it("insert-and-evict keeps the table at LEADERBOARD_SIZE", async () => {
    await seedScoreRows(20, 0); // scores 0..19; a real score must beat 0
    const game = await playGame();
    const res = await finish(
      req({ token: game.token, name: "Evictor", durationMs: 90_000 }),
      params(game.gameId),
    );
    const data = await res.json();
    if (data.qualified) {
      expect(await prisma.score.count()).toBe(20);
      // the lowest seeded row is gone
      const seed0 = await prisma.score.findFirst({ where: { name: "Seed0" } });
      expect(seed0).toBeNull();
    } else {
      // real score was 0 and could not beat the full board — still bounded
      expect(await prisma.score.count()).toBe(20);
    }
  });

  it("rejected names return the generic error and are capped", async () => {
    const game = await playGame();
    const res = await finish(
      req({ token: game.token, name: "admin", durationMs: 90_000 }),
      params(game.gameId),
    );
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe("rejected_name");
    // identical body for every rejected_name case
    const res2 = await finish(
      req({ token: game.token, name: "moderator", durationMs: 90_000 }),
      params(game.gameId),
    );
    expect(await res2.json()).toEqual(data);
    expect(await prisma.score.count()).toBe(0);
  });

  it("finish on an unfinished session is 422 not_finished", async () => {
    const game = await startGame();
    const res = await finish(
      req({ token: game.token, name: "Early", durationMs: 100 }),
      params(game.gameId),
    );
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe("not_finished");
  });

  it("a corrupted session fails the audit as 500 without blaming the player", async () => {
    const game = await playGame();
    await prisma.gameSession.update({
      where: { gameId: game.gameId },
      data: { score: game.state.score + 999 },
    });
    const res = await finish(
      req({ token: game.token, name: "Honest", durationMs: 90_000 }),
      params(game.gameId),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("audit_failed");
    expect(await prisma.score.count()).toBe(0);
  });

  it("key containment: no response ever carries key material", async () => {
    const game = await startGame();
    const bodies: string[] = [];
    const startRes = await start(req({ playerId: PLAYER }));
    bodies.push(await startRes.text());
    const action = anyLegalMove(game.state);
    const moveRes = await move(
      req({
        token: game.token,
        moveCount: 0,
        from: action.from,
        to: action.to,
        boardHash: boardHash(game.state),
      }),
      params(game.gameId),
    );
    bodies.push(await moveRes.text());
    const stateRes = await state(
      new Request("http://t", { headers: { "x-game-token": game.token } }),
      params(game.gameId),
    );
    bodies.push(await stateRes.text());
    for (const body of bodies) {
      expect(body).not.toContain(process.env["ENTROPY_SECRET_V1"]!);
      expect(body).not.toContain(process.env["GAME_TOKEN_SECRET"]!);
      // "key" never appears outside keyVersion
      expect(body.replace(/keyVersion/g, "")).not.toMatch(/key/i);
    }
  });

  it("start is never blocked per player, only by the per-IP abuse cap", async () => {
    // Restarting is normal play: far more than the old per-player cap must
    // succeed. Seed the attempt window directly to reach the IP ceiling
    // rather than issuing 240 live requests.
    for (let i = 0; i < 30; i++) {
      const res = await start(req({ playerId: PLAYER }));
      expect(res.status).toBe(200);
    }
    const ipHash = (await prisma.submissionAttempt.findFirstOrThrow()).ipHash;
    await prisma.submissionAttempt.createMany({
      data: Array.from({ length: 240 }, () => ({
        outcome: "start",
        ipHash,
        playerId: PLAYER,
      })),
    });
    const res = await start(req({ playerId: PLAYER }));
    expect(res.status).toBe(429);
  });

  it("the live-session cap evicts the oldest", async () => {
    const games = [];
    for (let i = 0; i < 6; i++) games.push(await startGame());
    expect(await prisma.gameSession.count()).toBeLessThanOrEqual(5);
    const first = await prisma.gameSession.findUnique({
      where: { gameId: games[0]!.gameId },
    });
    expect(first).toBeNull();
  });

  it("keyed audit equals the scripted client path for a full game", async () => {
    // replaying the client's packets through scriptedEntropy from move 0
    // yields the same final state the server holds
    const game = await playGame(400);
    const scripted = scriptedEntropy(game.init, game.packets);
    let replayed = createGame(scripted);
    for (const m of game.moves) {
      const r = applyAction(replayed, m, scripted);
      expect(r.ok).toBe(true);
      if (r.ok) replayed = r.state;
    }
    expect(boardHash(replayed)).toBe(boardHash(game.state));
  });

  it("casual play needs no server: keyedEntropy locally, zero requests", () => {
    const key = new Uint8Array(32).fill(9);
    const entropy = keyedEntropy(key);
    let s = createGame(entropy);
    for (let i = 0; i < 5; i++) {
      const r = applyAction(s, anyLegalMove(s), entropy);
      expect(r.ok).toBe(true);
      if (r.ok) s = r.state;
    }
    // nothing to assert against the DB — that is the point
  });
});
