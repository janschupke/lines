import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameController, isGameInProgress } from "./controller";
import { instantClock } from "./clock";
import {
  countNonZero,
  createGame,
  encodeMoves,
  freeOfBalls,
  keyedEntropy,
} from "@/engine";
import type { PlacedBall } from "@/engine";
import type { GameApi } from "./api";
import { saveRankedGame } from "./persistence";

const fixedKey = (n: number) => {
  const k = new Uint8Array(32);
  for (let i = 0; i < 32; i++) k[i] = (n + i * 13) & 0xff;
  return k;
};

const make = (seed = 1) =>
  new GameController({ clock: instantClock, key: fixedKey(seed) });

describe("GameController", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts a deterministic game from an injected key", () => {
    const a = make(1).getSnapshot();
    const b = make(1).getSnapshot();
    expect(Array.from(a.view.balls)).toEqual(Array.from(b.view.balls));
    expect(countNonZero(a.view.balls)).toBe(5);
    expect(countNonZero(a.view.ghosts)).toBe(3);
    expect(a.preview).toHaveLength(3);
    expect(a.score).toBe(0);
  });

  it("select, deselect, reselect", () => {
    const c = make();
    const balls = c.getSnapshot().view.balls;
    const first = balls.findIndex((b) => b !== 0);
    c.clickCell(first);
    expect(c.getSnapshot().selected).toBe(first);
    expect(c.getSnapshot().unreachable).not.toBeNull();
    c.clickCell(first);
    expect(c.getSnapshot().selected).toBeNull();
  });

  it("a legal move updates the view synchronously under the instant clock", () => {
    const c = make();
    const snap = c.getSnapshot();
    const from = snap.view.balls.findIndex((b) => b !== 0);
    const color = snap.view.balls[from]!;
    c.clickCell(from);
    const dest = freeOfBalls(snap.view.balls).find(
      (i) => c.getSnapshot().unreachable?.[i] === 1,
    )!;
    c.clickCell(dest);
    const after = c.getSnapshot();
    expect(after.view.balls[dest]).toBe(color);
    expect(after.view.balls[from]).toBe(0);
    expect(after.busy).toBe(false);
    expect(after.selected).toBeNull();
    // ghosts materialised + topped up (or a pop happened)
    expect(countNonZero(after.view.ghosts)).toBeGreaterThan(0);
  });

  it("hover shows a path trail from the selection", () => {
    const c = make();
    const snap = c.getSnapshot();
    const from = snap.view.balls.findIndex((b) => b !== 0);
    c.clickCell(from);
    const dest = freeOfBalls(snap.view.balls).find(
      (i) => c.getSnapshot().unreachable?.[i] === 1,
    )!;
    c.hoverCell(dest);
    const trail = c.getSnapshot().pathTrail;
    expect(trail).not.toBeNull();
    expect(trail![0]).toBe(from);
    expect(trail![trail!.length - 1]).toBe(dest);
    c.leaveBoard();
    expect(c.getSnapshot().pathTrail).toBeNull();
  });

  it("high score persists via localStorage", () => {
    localStorage.setItem("lines-game-high-score", "42");
    const c = make();
    expect(c.getSnapshot().highScore).toBe(42);
  });

  it("newGame resets and getSnapshot identity is stable between changes", () => {
    const c = make();
    const s1 = c.getSnapshot();
    expect(c.getSnapshot()).toBe(s1); // cached identity
    c.newGame();
    const s2 = c.getSnapshot();
    expect(s2).not.toBe(s1);
    expect(s2.score).toBe(0);
    expect(s2.over).toBe(false);
  });

  describe("isGameInProgress", () => {
    it("is false on a board nobody has touched", () => {
      expect(isGameInProgress(make().getSnapshot())).toBe(false);
    });

    it("is true once a move has been made", () => {
      const c = make();
      const snap = c.getSnapshot();
      const from = snap.view.balls.findIndex((b) => b !== 0);
      c.clickCell(from);
      const dest = freeOfBalls(snap.view.balls).find(
        (i) => c.getSnapshot().unreachable?.[i] === 1,
      )!;
      c.clickCell(dest);

      expect(c.getSnapshot().stats.turns).toBeGreaterThan(0);
      expect(isGameInProgress(c.getSnapshot())).toBe(true);
    });

    it("is false again once the game is over — there is nothing left to lose", () => {
      const finished = { ...make().getSnapshot(), over: true, score: 900 };
      expect(isGameInProgress(finished)).toBe(false);
    });

    it("counts a scoring game with no completed turns as in progress", () => {
      const scored = { ...make().getSnapshot(), over: false, score: 10 };
      expect(scored.stats.turns).toBe(0);
      expect(isGameInProgress(scored)).toBe(true);
    });
  });

  describe("without a database (rankedEnabled: false)", () => {
    const offlineApi = () => {
      const unreachable = () => Promise.reject(new Error("no server"));
      return {
        start: vi.fn(unreachable),
        move: vi.fn(unreachable),
        state: vi.fn(unreachable),
        finish: vi.fn(unreachable),
        scores: vi.fn(unreachable),
      } satisfies GameApi;
    };

    const placed = (arr: Uint8Array): PlacedBall[] =>
      Array.from(arr).flatMap((color, c) =>
        color ? [{ c, color: color as PlacedBall["color"] }] : [],
      );

    /** A valid, untouched ranked save — resumable when ranked is on. */
    const saveUntouchedRankedGame = () => {
      const initial = createGame(keyedEntropy(fixedKey(7)));
      saveRankedGame({
        gameId: "00000000-0000-4000-8000-000000000007",
        token: "t",
        init: { balls: placed(initial.balls), ghosts: placed(initial.ghosts) },
        moves: encodeMoves([]),
        packets: [],
        startedAt: Date.now(),
        elapsedMs: 0,
      });
    };

    it("starts casual without probing the server", () => {
      const api = offlineApi();
      const c = new GameController({
        clock: instantClock,
        api,
        rankedEnabled: false,
      });
      const snap = c.getSnapshot();
      expect(api.start).not.toHaveBeenCalled();
      expect(snap.rankedEnabled).toBe(false);
      expect(snap.mode.active).toBe("casual");
      expect(snap.mode.probing).toBe(false);
      expect(countNonZero(snap.view.balls)).toBe(5);
      c.destroy();
    });

    it("never shows the two-modes intro", () => {
      const off = new GameController({
        clock: instantClock,
        api: offlineApi(),
        rankedEnabled: false,
      });
      expect(off.getSnapshot().showModeIntro).toBe(false);
      off.destroy();
      const on = make();
      expect(on.getSnapshot().showModeIntro).toBe(true);
    });

    it("refuses an explicit ranked start", () => {
      const api = offlineApi();
      const c = new GameController({
        clock: instantClock,
        api,
        rankedEnabled: false,
      });
      c.startRankedGame();
      expect(api.start).not.toHaveBeenCalled();
      expect(c.getSnapshot().mode.active).toBe("casual");
      c.destroy();
    });

    it("drops a saved ranked game instead of resuming it", () => {
      // Control: with ranked on, the same save resumes and reconciles.
      saveUntouchedRankedGame();
      const onApi = offlineApi();
      const on = new GameController({ clock: instantClock, api: onApi });
      expect(on.getSnapshot().mode.active).toBe("ranked");
      expect(onApi.state).toHaveBeenCalledTimes(1);
      on.destroy();

      localStorage.clear();
      saveUntouchedRankedGame();
      const offApi = offlineApi();
      const off = new GameController({
        clock: instantClock,
        api: offApi,
        rankedEnabled: false,
      });
      expect(off.getSnapshot().mode.active).toBe("casual");
      expect(offApi.state).not.toHaveBeenCalled();
      expect(offApi.start).not.toHaveBeenCalled();
      off.destroy();
    });
  });
});
