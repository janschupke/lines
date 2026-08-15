import { describe, it, expect, beforeEach } from "vitest";
import {
  KEY_GAME,
  KEY_HIGHSCORE,
  KEY_NET_HISTORY,
  loadGame,
  loadHighScores,
  saveHighScore,
  saveCasualGame,
  saveRankedGame,
  clearGame,
  getPlayerId,
  loadNetHistory,
  pushNetOutcome,
  resetPersistenceAvailability,
} from "./persistence";
import {
  createGame,
  applyAction,
  keyedEntropy,
  encodeMoves,
  boardHash,
  freeOfBalls,
} from "@/engine";
import type { GameAction, SpawnPacket, InitPacket } from "@/engine";

const fixedKey = (n: number) => {
  const k = new Uint8Array(32);
  for (let i = 0; i < 32; i++) k[i] = (n + i * 13) & 0xff;
  return k;
};

/** Play n legal moves and return everything a save needs. */
function playCasual(n: number, seed = 1) {
  const key = fixedKey(seed);
  const entropy = keyedEntropy(key);
  let state = createGame(entropy);
  const moves: GameAction[] = [];
  const packets: SpawnPacket[] = [];
  const init: InitPacket = {
    balls: collect(state.balls),
    ghosts: collect(state.ghosts),
  };
  for (let i = 0; i < n && !state.over; i++) {
    const from = state.balls.findIndex((b) => b !== 0);
    const to = freeOfBalls(state.balls).find((c) => {
      const r = applyAction(
        state,
        { t: "move", from, to: c },
        {
          init: () => ({ balls: [], ghosts: [] }),
          spawn: () => ({ ghosts: [] }),
        },
      );
      return r.ok;
    })!;
    const r = applyAction(state, { t: "move", from, to }, entropy);
    if (!r.ok) throw new Error(r.error);
    moves.push({ t: "move", from, to });
    packets.push(r.packet);
    state = r.state;
  }
  return { key, state, moves, packets, init };
}

function collect(arr: Uint8Array) {
  const out = [];
  for (let i = 0; i < 81; i++) {
    if (arr[i] !== 0) out.push({ c: i, color: arr[i] as 1 });
  }
  return out;
}

beforeEach(() => {
  localStorage.clear();
  resetPersistenceAvailability();
});

describe("saved game", () => {
  it("casual round trip: save -> load -> identical GameState", () => {
    const g = playCasual(3);
    saveCasualGame({
      key: g.key,
      moves: encodeMoves(g.moves),
      startedAt: 111,
      elapsedMs: 4000,
    });
    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(boardHash(loaded!.state)).toBe(boardHash(g.state));
    expect(loaded!.state.score).toBe(g.state.score);
    expect(loaded!.state.stats).toEqual(g.state.stats);
    expect(loaded!.saved.elapsedMs).toBe(4000);
  });

  it("ranked round trip via scripted packets", () => {
    const g = playCasual(3);
    saveRankedGame({
      gameId: "g1",
      token: "t1",
      init: g.init,
      moves: encodeMoves(g.moves),
      packets: g.packets,
      startedAt: 1,
      elapsedMs: 1,
    });
    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(boardHash(loaded!.state)).toBe(boardHash(g.state));
  });

  it("absent key, malformed JSON, wrong v -> null, no throw", () => {
    expect(loadGame()).toBeNull();
    localStorage.setItem(KEY_GAME, "{not json");
    expect(loadGame()).toBeNull();
    localStorage.setItem(
      KEY_GAME,
      JSON.stringify({
        v: 2,
        mode: "casual",
        key: "0".repeat(64),
        moves: "",
        startedAt: 1,
        elapsedMs: 1,
      }),
    );
    expect(loadGame()).toBeNull();
  });

  it("malformed or illegal move logs -> null", () => {
    const g = playCasual(1);
    const base = {
      v: 1,
      mode: "casual",
      key: Array.from(g.key, (b) => b.toString(16).padStart(2, "0")).join(""),
      startedAt: 1,
      elapsedMs: 1,
    };
    // out-of-alphabet char
    localStorage.setItem(KEY_GAME, JSON.stringify({ ...base, moves: "ab!" }));
    expect(loadGame()).toBeNull();
    // length not multiple of 3
    localStorage.setItem(KEY_GAME, JSON.stringify({ ...base, moves: "ab" }));
    expect(loadGame()).toBeNull();
    // decodes but illegal to replay (move from an empty cell)
    localStorage.setItem(
      KEY_GAME,
      JSON.stringify({
        ...base,
        moves: encodeMoves([
          { t: "move", from: 0, to: 1 },
          { t: "move", from: 0, to: 1 },
          { t: "move", from: 0, to: 1 },
          { t: "move", from: 0, to: 1 },
          { t: "move", from: 0, to: 1 },
        ]),
      }),
    );
    // five identical moves cannot all be legal
    expect(loadGame()).toBeNull();
  });

  it("ranked save with too few packets or a corrupt packet -> null", () => {
    const g = playCasual(3);
    saveRankedGame({
      gameId: "g1",
      token: "t1",
      init: g.init,
      moves: encodeMoves(g.moves),
      packets: g.packets.slice(0, 1), // entropy_exhausted
      startedAt: 1,
      elapsedMs: 1,
    });
    expect(loadGame()).toBeNull();
    const bad = structuredClone(g.packets) as SpawnPacket[];
    // the destination of move 0 is occupied when turn 0's spawn runs
    const occupied = g.moves[0]!.to;
    (bad[0] as { ghosts: unknown[] }).ghosts = [
      { c: occupied, color: 1 },
      ...bad[0]!.ghosts.slice(1),
    ];
    saveRankedGame({
      gameId: "g1",
      token: "t1",
      init: g.init,
      moves: encodeMoves(g.moves),
      packets: bad, // entropy_illegal
      startedAt: 1,
      elapsedMs: 1,
    });
    expect(loadGame()).toBeNull();
  });

  it("shape guards: casual never carries gameId/token; ranked never a key", () => {
    const g = playCasual(1);
    localStorage.setItem(
      KEY_GAME,
      JSON.stringify({
        v: 1,
        mode: "casual",
        key: "0".repeat(64),
        gameId: "sneaky",
        moves: "",
        startedAt: 1,
        elapsedMs: 1,
      }),
    );
    expect(loadGame()).toBeNull();
    localStorage.setItem(
      KEY_GAME,
      JSON.stringify({
        v: 1,
        mode: "ranked",
        gameId: "g",
        token: "t",
        key: "0".repeat(64),
        init: g.init,
        packets: [],
        moves: "",
        startedAt: 1,
        elapsedMs: 1,
      }),
    );
    expect(loadGame()).toBeNull();
  });

  it("KEY_GAME cleared exactly at game end semantics", () => {
    const g = playCasual(2);
    saveCasualGame({
      key: g.key,
      moves: encodeMoves(g.moves),
      startedAt: 1,
      elapsedMs: 1,
    });
    expect(localStorage.getItem(KEY_GAME)).not.toBeNull();
    clearGame();
    expect(localStorage.getItem(KEY_GAME)).toBeNull();
  });
});

describe("high score", () => {
  it("migrates the legacy bare integer once", () => {
    localStorage.setItem("lines-game-high-score", "420");
    expect(loadHighScores()).toEqual({ casual: 420, ranked: 0 });
    expect(localStorage.getItem("lines-game-high-score")).toBeNull();
    expect(JSON.parse(localStorage.getItem(KEY_HIGHSCORE)!)).toEqual({
      casual: 420,
      ranked: 0,
    });
  });

  it("non-numeric or absent legacy value is ignored without throwing", () => {
    localStorage.setItem("lines-game-high-score", "not-a-number");
    expect(loadHighScores()).toEqual({ casual: 0, ranked: 0 });
  });

  it("tracks the two boards independently", () => {
    saveHighScore("casual", 10);
    saveHighScore("ranked", 99);
    saveHighScore("casual", 5); // lower — must not overwrite
    expect(loadHighScores()).toEqual({ casual: 10, ranked: 99 });
  });

  it("survives a game clear", () => {
    saveHighScore("casual", 7);
    clearGame();
    expect(loadHighScores().casual).toBe(7);
  });
});

describe("player id / net history", () => {
  it("playerId is stable and a UUID", () => {
    const id = getPlayerId();
    expect(getPlayerId()).toBe(id);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("net history keeps at most 3 and a clean game clears it", () => {
    pushNetOutcome("dropped");
    pushNetOutcome("reconnected");
    pushNetOutcome("dropped");
    pushNetOutcome("dropped");
    expect(loadNetHistory()).toHaveLength(3);
    pushNetOutcome("clean");
    expect(loadNetHistory()).toHaveLength(0);
    expect(localStorage.getItem(KEY_NET_HISTORY)).toBeNull();
  });
});
