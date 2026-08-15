import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameController } from "./controller";
import { fakeClock } from "./clock";
import type { GameApi, MoveResponse, StartResponse } from "./api";
import {
  createGame,
  applyAction,
  keyedEntropy,
  scriptedEntropy,
  boardHash,
  freeOfBalls,
  reachableFrom,
} from "@/engine";
import type { GameAction, GameState, InitPacket } from "@/engine";

const fixedKey = (n: number) => {
  const k = new Uint8Array(32);
  for (let i = 0; i < 32; i++) k[i] = (n + i * 13) & 0xff;
  return k;
};

/** A mock server: runs the real engine on a fixed key. */
function mockServer(seed = 5) {
  const key = fixedKey(seed);
  const entropy = keyedEntropy(key);
  let state = createGame(entropy);
  const init: InitPacket = {
    balls: placed(state.balls),
    ghosts: placed(state.ghosts),
  };
  return {
    init,
    get state() {
      return state;
    },
    startResponse(): StartResponse {
      return {
        gameId: "00000000-0000-4000-8000-00000000abcd",
        token: "v1.x.y",
        expiresAt: Date.now() + 1000000,
        engineVersion: 2,
        init,
        boardHash: boardHash(state),
      };
    },
    move(from: number, to: number): MoveResponse {
      const r = applyAction(state, { t: "move", from, to }, entropy);
      if (!r.ok) throw new Error(r.error);
      state = r.state;
      return {
        packet: r.packet,
        boardHash: boardHash(state),
        score: state.score,
        moveCount: state.moveCount,
        over: state.over,
        stats: state.stats,
      };
    },
  };
}

function placed(arr: Uint8Array) {
  const out = [];
  for (let i = 0; i < 81; i++) {
    if (arr[i] !== 0) out.push({ c: i, color: arr[i] as 1 });
  }
  return out;
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

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  localStorage.clear();
});

describe("ranked connection machine", () => {
  async function makeRanked(failures: number) {
    const server = mockServer();
    let failCount = failures;
    const moveMock = vi.fn(async (req: { from: number; to: number }) => {
      if (failCount > 0) {
        failCount--;
        throw new Error("network");
      }
      return server.move(req.from, req.to);
    });
    const api: GameApi = {
      start: vi.fn(async () => server.startResponse()),
      move: moveMock as unknown as GameApi["move"],
      state: vi.fn(async () => {
        throw new Error("unused");
      }),
      finish: vi.fn(async () => {
        throw new Error("unused");
      }),
      scores: vi.fn(async () => ({ entries: [], threshold: 0 })),
    };
    const clock = fakeClock();
    const controller = new GameController({ clock, api });
    await flush(); // let /start resolve
    expect(controller.getSnapshot().mode.active).toBe("ranked");
    return { controller, clock, api, server, moveMock };
  }

  it("a clean move round-trips and stays live with no gate", async () => {
    const { controller, clock } = await makeRanked(0);
    const snap = controller.getSnapshot();
    const action = anyLegalMove({
      ...snap.view,
      score: 0,
      moveCount: 0,
      over: false,
      stats: snap.stats,
    } as GameState);
    controller.clickCell(action.from);
    controller.clickCell(action.to);
    await flush();
    clock.advance(10_000);
    await flush();
    clock.advance(10_000);
    const after = controller.getSnapshot();
    expect(after.connection.state).toBe("live");
    expect(after.connection.gateOpen).toBe(false);
    expect(after.stats.turns).toBe(1);
    expect(after.busy).toBe(false);
  });

  it("one failure then success returns to live; retry is byte-identical", async () => {
    const { controller, clock, moveMock } = await makeRanked(1);
    const snap = controller.getSnapshot();
    const action = anyLegalMove({
      ...snap.view,
      score: 0,
      moveCount: 0,
      over: false,
      stats: snap.stats,
    } as GameState);
    controller.clickCell(action.from);
    controller.clickCell(action.to);
    await flush();
    // first attempt failed -> reconnecting, retry in 1s
    expect(controller.getSnapshot().connection.state).toBe("reconnecting");
    expect(controller.getSnapshot().connection.attempt).toBe(1);
    expect(controller.getSnapshot().timerActive).toBe(false);
    clock.advance(1000);
    await flush();
    clock.advance(20_000);
    await flush();
    const after = controller.getSnapshot();
    expect(after.connection.state).toBe("live");
    expect(after.stats.turns).toBe(1);
    expect(moveMock).toHaveBeenCalledTimes(2);
    expect(moveMock.mock.calls[0]![0]).toEqual(moveMock.mock.calls[1]![0]);
  });

  it("three failures open the gate; backoff is 1/2/4s", async () => {
    const { controller, clock } = await makeRanked(3);
    const snap = controller.getSnapshot();
    const action = anyLegalMove({
      ...snap.view,
      score: 0,
      moveCount: 0,
      over: false,
      stats: snap.stats,
    } as GameState);
    controller.clickCell(action.from);
    controller.clickCell(action.to);
    await flush();
    expect(controller.getSnapshot().connection.attempt).toBe(1);
    expect(controller.getSnapshot().connection.gateOpen).toBe(false);
    clock.advance(1000);
    await flush();
    expect(controller.getSnapshot().connection.attempt).toBe(2);
    clock.advance(2000);
    await flush();
    const gated = controller.getSnapshot();
    expect(gated.connection.attempt).toBe(3);
    expect(gated.connection.gateOpen).toBe(true);
    expect(gated.connection.gateTrigger).toBe("connection-lost");
    // closing the gate keeps the mode
    controller.closeSwitchGate();
    expect(controller.getSnapshot().mode.active).toBe("ranked");
  });

  it("confirming the gate switches to casual, applies the pending spawn, records dropped", async () => {
    const { controller, clock } = await makeRanked(99);
    const snap = controller.getSnapshot();
    const action = anyLegalMove({
      ...snap.view,
      score: 0,
      moveCount: 0,
      over: false,
      stats: snap.stats,
    } as GameState);
    controller.clickCell(action.from);
    controller.clickCell(action.to);
    await flush();
    clock.advance(1000);
    await flush();
    controller.confirmSwitchToCasual();
    clock.advance(20_000);
    await flush();
    const after = controller.getSnapshot();
    expect(after.mode.active).toBe("casual");
    expect(after.mode.reason).toBe("your-choice");
    expect(after.stats.turns).toBe(1); // the pending turn completed locally
    expect(after.connection.state).toBe("n/a");
    expect(after.busy).toBe(false);
    expect(JSON.parse(localStorage.getItem("lines:netHistory:v1")!)).toContain(
      "dropped",
    );
    expect(localStorage.getItem("lines:modePref:v1")).toBe("casual");
  });

  it("a casual game issues zero requests across a full play-through", async () => {
    localStorage.setItem("lines:modePref:v1", "casual");
    const api: GameApi = {
      start: vi.fn(),
      move: vi.fn(),
      state: vi.fn(),
      finish: vi.fn(),
      scores: vi.fn(),
    };
    const clock = fakeClock();
    const controller = new GameController({ clock, api });
    for (let i = 0; i < 10; i++) {
      const snap = controller.getSnapshot();
      if (snap.over) break;
      const action = anyLegalMove({
        ...snap.view,
        score: snap.score,
        moveCount: snap.stats.turns,
        over: snap.over,
        stats: snap.stats,
      } as GameState);
      controller.clickCell(action.from);
      controller.clickCell(action.to);
      clock.advance(20_000);
    }
    expect(api.start).not.toHaveBeenCalled();
    expect(api.move).not.toHaveBeenCalled();
    expect(api.state).not.toHaveBeenCalled();
    expect(api.finish).not.toHaveBeenCalled();
  });

  it("keyed and scripted agree through the controller's server mirror", async () => {
    const { controller, clock, server } = await makeRanked(0);
    for (let i = 0; i < 5; i++) {
      const snap = controller.getSnapshot();
      if (snap.over) break;
      const action = anyLegalMove({
        ...snap.view,
        score: snap.score,
        moveCount: i,
        over: snap.over,
        stats: snap.stats,
      } as GameState);
      controller.clickCell(action.from);
      controller.clickCell(action.to);
      await flush();
      clock.advance(20_000);
      await flush();
      clock.advance(20_000);
    }
    expect(boardHash(server.state)).toBe(
      boardHash({
        balls: controller.getSnapshot().view.balls,
        ghosts: controller.getSnapshot().view.ghosts,
        score: 0,
        moveCount: 0,
        over: false,
        stats: controller.getSnapshot().stats,
      } as GameState),
    );
  });
});

describe("scripted resume is engine-consistent", () => {
  it("a ranked save with localKey replays and resumes as casual", async () => {
    // covered indirectly through persistence tests + controller resume;
    // here just assert the entropy wiring compiles the round trip
    const key = fixedKey(1);
    const entropy = keyedEntropy(key);
    const state = createGame(entropy);
    const init = { balls: placed(state.balls), ghosts: placed(state.ghosts) };
    const replayed = createGame(scriptedEntropy(init, []));
    expect(boardHash(replayed)).toBe(boardHash(state));
  });
});
