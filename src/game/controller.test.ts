import { describe, it, expect, beforeEach } from "vitest";
import { GameController } from "./controller";
import { instantClock } from "./clock";
import { countNonZero, freeOfBalls } from "@/engine";

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
});
