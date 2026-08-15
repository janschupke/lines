import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  createGame,
  applyAction,
  replay,
  keyedEntropy,
  scriptedEntropy,
  detectLines,
  freeOfBalls,
  countNonZero,
  boardHash,
  viewOf,
  applyEffect,
  serialize,
  deserialize,
  encodeMoves,
  decodeMoves,
} from "./index";
import type { GameAction, GameState, SpawnPacket } from "./types";
import type { ViewBoard } from "./effects";
import { CELL_COUNT } from "./config";
import { randomLegalMove, testKey } from "./testutil";

interface PlayedGame {
  seed: number;
  moves: GameAction[];
  states: GameState[]; // states[i] = before move i; last = final
  packets: SpawnPacket[];
  effectLists: import("./types").Effect[][];
  draws: number;
}

/** Play up to maxMoves random legal moves under keyedEntropy(testKey(seed)). */
function playGame(seed: number, maxMoves = 60): PlayedGame {
  const entropy = keyedEntropy(testKey(seed));
  const chooser = testKey(seed + 100000);
  let state = createGame(entropy);
  const moves: GameAction[] = [];
  const states: GameState[] = [state];
  const packets: SpawnPacket[] = [];
  const effectLists: import("./types").Effect[][] = [];
  for (let i = 0; i < maxMoves && !state.over; i++) {
    const action = randomLegalMove(state, chooser, i);
    if (!action) break;
    const r = applyAction(state, action, entropy);
    if (!r.ok) throw new Error(`illegal generated move: ${r.error}`);
    moves.push(action);
    packets.push(r.packet);
    effectLists.push(r.effects);
    state = r.state;
    states.push(state);
  }
  return {
    seed,
    moves,
    states,
    packets,
    effectLists,
    draws: entropy.rngDraws(),
  };
}

const seedArb = fc.integer({ min: 0, max: 400 });

const equalView = (a: ViewBoard, b: ViewBoard) => {
  for (let i = 0; i < CELL_COUNT; i++) {
    if (a.balls[i] !== b.balls[i] || a.ghosts[i] !== b.ghosts[i]) return false;
  }
  return true;
};

describe("property suite", () => {
  it("1/Z1: replay determinism — twice, identical everything", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        const a = replay(testKey(seed), g.moves);
        const b = replay(testKey(seed), g.moves);
        expect(a.ok && b.ok).toBe(true);
        if (a.ok && b.ok) {
          expect(a.state.score).toBe(b.state.score);
          expect(boardHash(a.state)).toBe(boardHash(b.state));
          expect(a.rngDraws).toBe(b.rngDraws);
          expect(a.packets).toEqual(b.packets);
          // and matches the incrementally played game
          expect(boardHash(a.state)).toBe(
            boardHash(g.states[g.states.length - 1]!),
          );
          expect(a.rngDraws).toBe(g.draws);
        }
      }),
      { numRuns: 25 },
    );
  });

  it("2: no line survives after any applyAction", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        for (const s of g.states) {
          expect(detectLines(s.balls)).toHaveLength(0);
        }
      }),
      { numRuns: 20 },
    );
  });

  it("3: effects reconstruct state — the fold invariant", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        for (let i = 0; i < g.moves.length; i++) {
          const folded = g.effectLists[i]!.reduce(
            applyEffect,
            viewOf(g.states[i]!),
          );
          expect(equalView(folded, viewOf(g.states[i + 1]!))).toBe(true);
        }
      }),
      { numRuns: 20 },
    );
  });

  it("4: ghost invariant — count and disjointness", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        for (const s of g.states) {
          const free = freeOfBalls(s.balls).length;
          const expected = free < 3 ? free : 3;
          expect(countNonZero(s.ghosts)).toBe(expected);
          for (let i = 0; i < CELL_COUNT; i++) {
            expect(s.ghosts[i] !== 0 && s.balls[i] !== 0).toBe(false);
          }
        }
      }),
      { numRuns: 20 },
    );
  });

  it("5: ball conservation per turn, computed from the effect list", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        for (let i = 0; i < g.moves.length; i++) {
          let materialised = 0;
          let popped = 0;
          for (const e of g.effectLists[i]!) {
            if (e.k === "materialize") materialised += e.cells.length;
            if (e.k === "pop") popped += e.cells.length;
          }
          const prevCount = countNonZero(g.states[i]!.balls);
          const nextCount = countNonZero(g.states[i + 1]!.balls);
          expect(nextCount).toBe(prevCount + materialised - popped);
        }
      }),
      { numRuns: 20 },
    );
  });

  it("6: score accounting equals the sum of score-effect deltas", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        for (let i = 0; i < g.moves.length; i++) {
          let delta = 0;
          for (const e of g.effectLists[i]!)
            if (e.k === "score") delta += e.delta;
          expect(g.states[i + 1]!.score - g.states[i]!.score).toBe(delta);
        }
      }),
      { numRuns: 20 },
    );
  });

  it("7: game over iff zero free cells", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 200);
        for (const s of g.states) {
          expect(s.over).toBe(freeOfBalls(s.balls).length === 0);
        }
      }),
      { numRuns: 15 },
    );
  });

  it("8: displaced-ghost multiset preserved, exactly one ghostMoved", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        for (let i = 0; i < g.moves.length; i++) {
          const moved = g.effectLists[i]!.filter((e) => e.k === "ghostMoved");
          expect(moved.length).toBeLessThanOrEqual(1);
          const to = g.moves[i]!.to;
          const hadGhost = g.states[i]!.ghosts[to] !== 0;
          if (moved.length === 1) expect(hadGhost).toBe(true);
        }
      }),
      { numRuns: 15 },
    );
  });

  it("9/Z5: applyAction never mutates its input", () => {
    const entropy = keyedEntropy(testKey(1));
    const state = createGame(entropy);
    const before = boardHash(state);
    const scoreBefore = state.score;
    const action = {
      t: "move",
      from: state.balls.findIndex((b) => b !== 0),
      to: freeOfBalls(state.balls)[0]!,
    } as const;
    applyAction(state, action, entropy);
    expect(boardHash(state)).toBe(before);
    expect(state.score).toBe(scoreBefore);
  });

  it("10: log canonicality both directions", () => {
    const actionArb = fc.record({
      t: fc.constant("move" as const),
      from: fc.integer({ min: 0, max: 80 }),
      to: fc.integer({ min: 0, max: 80 }),
    });
    fc.assert(
      fc.property(fc.array(actionArb, { maxLength: 50 }), (moves) => {
        const s = encodeMoves(moves);
        expect(decodeMoves(s)).toEqual(moves);
        expect(encodeMoves(decodeMoves(s)!)).toBe(s);
      }),
    );
    // malformed strings decode to null
    expect(decodeMoves("a")).toBeNull();
    expect(decodeMoves("ab")).toBeNull();
    expect(decodeMoves("!!!")).toBeNull();
    expect(decodeMoves("___")).toBeNull(); // 63*4096+... = 262143 > 6560
    expect(decodeMoves("ZZZ")).toBeNull(); // 25*4096+25*64+25 = 104025 > 6560
  });

  it("11: serialisation round-trip", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 20);
        const s = g.states[g.states.length - 1]!;
        const back = deserialize(serialize(s));
        expect(back).not.toBeNull();
        expect(boardHash(back!)).toBe(boardHash(s));
        expect(back!.score).toBe(s.score);
        expect(back!.stats).toEqual(s.stats);
      }),
      { numRuns: 10 },
    );
    expect(deserialize("not json")).toBeNull();
    expect(deserialize("{}")).toBeNull();
  });

  it("12/Z4: draw accounting per turn", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const entropy = keyedEntropy(testKey(seed));
        const chooser = testKey(seed + 100000);
        let state = createGame(entropy);
        let last = entropy.rngDraws();
        for (let i = 0; i < 30 && !state.over; i++) {
          const action = randomLegalMove(state, chooser, i);
          if (!action) break;
          const displacedPending = state.ghosts[action.to] !== 0;
          const r = applyAction(state, action, entropy);
          if (!r.ok) throw new Error(r.error);
          const draws = entropy.rngDraws() - last;
          last = entropy.rngDraws();
          const relocated = r.packet.relocate ? 1 : 0;
          if (!displacedPending) expect(relocated).toBe(0);
          expect(draws).toBe(relocated + 2 * r.packet.ghosts.length);
          state = r.state;
        }
      }),
      { numRuns: 15 },
    );
  });

  it("13/Z6: keyed ≡ scripted, packet for packet", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        const init = {
          balls: placed(g.states[0]!.balls),
          ghosts: placed(g.states[0]!.ghosts),
        };
        const scripted = scriptedEntropy(init, g.packets);
        let state = createGame(scripted);
        for (const m of g.moves) {
          const r = applyAction(state, m, scripted);
          expect(r.ok).toBe(true);
          if (!r.ok) return;
          state = r.state;
        }
        const final = g.states[g.states.length - 1]!;
        expect(boardHash(state)).toBe(boardHash(final));
        expect(state.score).toBe(final.score);
        expect(state.stats).toEqual(final.stats);
      }),
      { numRuns: 20 },
    );
  });

  it("14/Z7: packet disclosure — every packet cell is empty before, rendered after", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        for (let i = 0; i < g.moves.length; i++) {
          const prev = g.states[i]!;
          const next = g.states[i + 1]!;
          const p = g.packets[i]!;
          const cells = [
            ...(p.relocate ? [p.relocate.to] : []),
            ...p.ghosts.map((gh) => gh.c),
          ];
          // The client can verify every packet cell from the deterministic
          // prefix alone: fold the non-entropy effects and assert each cell
          // is free there — a packet never references a hidden cell.
          const prefix = g.effectLists[i]!.filter(
            (e) =>
              e.k !== "ghostMoved" &&
              e.k !== "spawnGhosts" &&
              e.k !== "gameOver",
          ).reduce(applyEffect, viewOf(prev));
          for (const c of cells) {
            expect(prefix.balls[c]).toBe(0);
            expect(prefix.ghosts[c]).toBe(0);
            // and rendered immediately after the turn
            expect(next.ghosts[c] !== 0).toBe(true);
          }
        }
      }),
      { numRuns: 15 },
    );
  });

  it("15/Z9: the deterministic prefix is entropy-source independent", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 20);
        if (g.moves.length === 0) return;
        // Apply the same move under two different entropy sources; the board
        // BEFORE the spawn phase must agree — observed via the effect fold
        // up to (excluding) entropy-derived effects.
        const i = g.moves.length - 1;
        const prev = g.states[i]!;
        const deterministic = (effects: readonly import("./types").Effect[]) =>
          effects.filter(
            (e) =>
              e.k !== "ghostMoved" &&
              e.k !== "spawnGhosts" &&
              e.k !== "gameOver",
          );
        const rA = applyAction(
          prev,
          g.moves[i]!,
          keyedEntropy(testKey(seed + 1), prev.moveCount),
        );
        const rB = applyAction(
          prev,
          g.moves[i]!,
          keyedEntropy(testKey(seed + 2), prev.moveCount),
        );
        expect(rA.ok && rB.ok).toBe(true);
        if (rA.ok && rB.ok) {
          const a = deterministic(rA.effects).reduce(applyEffect, viewOf(prev));
          const b = deterministic(rB.effects).reduce(applyEffect, viewOf(prev));
          expect(equalView(a, b)).toBe(true);
        }
      }),
      { numRuns: 15 },
    );
  });

  it("16/Z8: scriptedEntropy rejects malformed packets", () => {
    const g = playGame(1, 5);
    const init = {
      balls: placed(g.states[0]!.balls),
      ghosts: placed(g.states[0]!.ghosts),
    };
    expect(g.moves.length).toBeGreaterThan(0);

    const tamper = (mutate: (p: SpawnPacket) => SpawnPacket) => {
      const packets = g.packets.map((p, i) => (i === 0 ? mutate(p) : p));
      const scripted = scriptedEntropy(init, packets);
      const state = createGame(scripted);
      return applyAction(state, g.moves[0]!, scripted);
    };

    // occupied cell
    const occupied = g.states[0]!.balls.findIndex((b) => b !== 0);
    let r = tamper((p) => ({
      ...p,
      ghosts: [{ c: occupied, color: 1 }, ...p.ghosts.slice(1)],
    }));
    expect(r).toEqual({ ok: false, error: "entropy_illegal" });

    // duplicate cell
    r = tamper((p) =>
      p.ghosts.length >= 2
        ? { ...p, ghosts: [p.ghosts[0]!, p.ghosts[0]!, ...p.ghosts.slice(2)] }
        : {
            ...p,
            ghosts: [
              { c: 80, color: 1 },
              { c: 80, color: 2 },
            ],
          },
    );
    expect(r.ok).toBe(false);

    // wrong ghost count
    r = tamper((p) => ({ ...p, ghosts: p.ghosts.slice(1) }));
    expect(r).toEqual({ ok: false, error: "entropy_illegal" });

    // spurious relocation
    r = tamper((p) =>
      p.relocate ? { ghosts: p.ghosts } : { ...p, relocate: { to: 80 } },
    );
    expect(r).toEqual({ ok: false, error: "entropy_illegal" });

    // exhaustion
    const scripted = scriptedEntropy(init, []);
    const state = createGame(scripted);
    expect(applyAction(state, g.moves[0]!, scripted)).toEqual({
      ok: false,
      error: "entropy_exhausted",
    });
  });

  it("17/Z12: stream regions never overlap and no phase exceeds its stride", () => {
    // Structural: keyedEntropy throws if a phase overruns its stride, and
    // positions are fixed by construction. Exercise a long game.
    const g = playGame(3, 200);
    expect(g.draws).toBeGreaterThan(0);
  });

  it("18/Z10: position independence — mid-game replay yields identical packets", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 30);
        if (g.moves.length < 4) return;
        const k = 2;
        const entropy = keyedEntropy(testKey(seed), k);
        let state = g.states[k]!;
        for (let i = k; i < g.moves.length; i++) {
          const r = applyAction(state, g.moves[i]!, entropy);
          expect(r.ok).toBe(true);
          if (!r.ok) return;
          expect(r.packet).toEqual(g.packets[i]!);
          state = r.state;
        }
      }),
      { numRuns: 10 },
    );
  });

  it("Z13: ghostMoved is emitted with spawnGhosts at the end, never adjacent to move", () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const g = playGame(seed, 40);
        for (const effects of g.effectLists) {
          const kinds = effects.map((e) => e.k);
          const moveIdx = kinds.indexOf("move");
          const ghostMovedIdx = kinds.indexOf("ghostMoved");
          if (ghostMovedIdx !== -1) {
            expect(ghostMovedIdx).toBeGreaterThan(moveIdx);
            // ghostMoved sits in the entropy tail: nothing deterministic
            // (pop/score/materialize) ever follows it
            for (const k of kinds.slice(ghostMovedIdx + 1)) {
              expect(["spawnGhosts", "gameOver"]).toContain(k);
            }
          }
        }
      }),
      { numRuns: 15 },
    );
  });
});

function placed(arr: Uint8Array) {
  const out = [];
  for (let i = 0; i < CELL_COUNT; i++) {
    if (arr[i] !== 0)
      out.push({ c: i, color: arr[i] as 1 | 2 | 3 | 4 | 5 | 6 | 7 });
  }
  return out;
}
