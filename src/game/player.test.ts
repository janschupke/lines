import { describe, it, expect, vi } from "vitest";
import { EffectPlayer } from "./player";
import { fakeClock } from "./clock";
import type { Timings } from "./timings";
import type { Effect } from "@/engine";

const timings: Timings = {
  movingStep: 100,
  popBall: 300,
  growBall: 600,
  floatingScore: 1000,
};

const effects: Effect[] = [
  { k: "move", color: 1, path: [0, 1, 2, 3] }, // 3 steps -> 300ms
  { k: "pop", cells: [3, 4, 5, 6, 7], lines: [], round: 0 }, // 300ms
  { k: "score", delta: 5, total: 5, at: 5 }, // 0ms, non-blocking
  { k: "spawnGhosts", cells: [{ c: 10, color: 2 }] }, // 600ms
];

describe("EffectPlayer under a fake clock — the exact timeline of a turn", () => {
  it("plays move steps, pop, score and spawn at the right instants", () => {
    const clock = fakeClock();
    const folded: string[] = [];
    const player = new EffectPlayer(clock, timings, {
      fold: (e) => folded.push(e.k),
      onChange: () => {},
    });
    const done = vi.fn();
    player.play(effects, done);

    // t=0: the ball is at step 0 of its path
    expect(player.overlay.moving).toEqual({
      color: 1,
      path: [0, 1, 2, 3],
      step: 0,
    });
    expect(player.busy).toBe(true);

    clock.advance(100); // t=100: step 1
    expect(player.overlay.moving?.step).toBe(1);

    clock.advance(200); // t=300: move done -> folded; pop showing
    expect(folded).toContain("move");
    expect(player.overlay.moving).toBeNull();
    expect(player.overlay.popping.size).toBe(5);

    clock.advance(300); // t=600: pop folded; score fired non-blocking; grow showing
    expect(folded).toContain("pop");
    expect(folded).toContain("score");
    expect(player.overlay.floating).toHaveLength(1);
    expect(player.overlay.scoreFlashId).toBe(1);
    expect(player.overlay.growing.get(10)).toBe("new");

    clock.advance(600); // t=1200: spawn folded; timeline done
    expect(folded).toEqual(["move", "pop", "score", "spawnGhosts"]);
    expect(done).toHaveBeenCalledTimes(1);
    expect(player.busy).toBe(false);
    // floating score persists independently of the queue...
    expect(player.overlay.floating).toHaveLength(1);
    clock.advance(400); // ...until floatingScore ms after it fired (t=1600)
    expect(player.overlay.floating).toHaveLength(0);
  });

  it("plays ghostMoved and spawnGhosts concurrently in one grow window", () => {
    const clock = fakeClock();
    const folded: string[] = [];
    const player = new EffectPlayer(clock, timings, {
      fold: (e) => folded.push(e.k),
      onChange: () => {},
    });
    const done = vi.fn();
    player.play(
      [
        { k: "ghostMoved", from: 4, to: 20, color: 3 },
        { k: "spawnGhosts", cells: [{ c: 30, color: 1 }] },
      ],
      done,
    );
    expect(player.overlay.growing.get(20)).toBe("new");
    expect(player.overlay.growing.get(30)).toBe("new");
    clock.advance(600);
    expect(done).toHaveBeenCalledTimes(1);
    expect(folded).toEqual(["ghostMoved", "spawnGhosts"]);
  });

  it("cancel stops timers and clears overlays", () => {
    const clock = fakeClock();
    const player = new EffectPlayer(clock, timings, {
      fold: () => {},
      onChange: () => {},
    });
    const done = vi.fn();
    player.play(effects, done);
    clock.advance(150);
    player.cancel();
    clock.advance(5000);
    expect(done).not.toHaveBeenCalled();
    expect(player.overlay.moving).toBeNull();
    expect(player.busy).toBe(false);
  });

  it("speed 0 folds the entire timeline synchronously", () => {
    const clock = fakeClock();
    const folded: string[] = [];
    const player = new EffectPlayer(clock, timings, {
      fold: (e) => folded.push(e.k),
      onChange: () => {},
    });
    player.setSpeed(0);
    const done = vi.fn();
    player.play(effects, done);
    // no clock advance at all
    expect(done).toHaveBeenCalledTimes(1);
    expect(folded).toEqual(["move", "pop", "score", "spawnGhosts"]);
  });
});
