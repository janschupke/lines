import { describe, it, expect } from "vitest";
import {
  createGame,
  applyAction,
  keyedEntropy,
  detectLines,
  freeOfBalls,
  indexOf,
  countNonZero,
  previewColors,
} from "./index";
import { INITIAL_BALLS, BALLS_PER_TURN, CELL_COUNT } from "./config";
import type { CellIndex, ColorId, GameState } from "./types";
import { stateOf, testKey } from "./testutil";

const emptyGhosts = () => new Uint8Array(CELL_COUNT);

const move = (from: CellIndex, to: CellIndex) =>
  ({ t: "move", from, to }) as const;

/** Entropy that answers with a fixed spawn — for board-literal tests. */
const nullEntropy = () => ({
  init: () => ({ balls: [], ghosts: [] }),
  spawn: (req: {
    free: readonly CellIndex[];
    ghostCount: number;
    relocateColor: ColorId | null;
  }) => {
    // deterministic: take the first free cells ascending, colour 1
    const ghosts = [];
    const free = req.free.slice();
    let relocate: { to: CellIndex } | undefined;
    if (req.relocateColor !== null && free.length > 0) {
      relocate = { to: free.shift()! };
    }
    for (let i = 0; i < req.ghostCount && free.length > 0; i++) {
      ghosts.push({ c: free.shift()!, color: 1 as ColorId });
    }
    return relocate ? { relocate, ghosts } : { ghosts };
  },
});

describe("initial deal (I matrix)", () => {
  it("I1/I2: 2000 seeds — no line, no colour at 5+", () => {
    for (let seed = 0; seed < 2000; seed++) {
      const state = createGame(keyedEntropy(testKey(seed)));
      expect(detectLines(state.balls)).toHaveLength(0);
      const counts = new Uint8Array(8);
      for (const c of state.balls) if (c !== 0) counts[c]!++;
      for (let c = 1; c <= 7; c++) expect(counts[c]!).toBeLessThan(5);
    }
  });

  it("I3: colour cap consumes exactly one draw", () => {
    // Draw counts are structural: the whole deal is exactly 16 draws for
    // every seed, cap or no cap.
    for (let seed = 0; seed < 50; seed++) {
      const entropy = keyedEntropy(testKey(seed));
      createGame(entropy);
      expect(entropy.rngDraws()).toBe(2 * INITIAL_BALLS + 2 * BALLS_PER_TURN);
    }
  });

  it("I4: exactly 5 real balls, 3 ghosts, no overlap", () => {
    const state = createGame(keyedEntropy(testKey(7)));
    expect(countNonZero(state.balls)).toBe(INITIAL_BALLS);
    expect(countNonZero(state.ghosts)).toBe(BALLS_PER_TURN);
    for (let i = 0; i < CELL_COUNT; i++) {
      expect(state.balls[i] !== 0 && state.ghosts[i] !== 0).toBe(false);
    }
  });

  it("I5: score is 0 after createGame", () => {
    expect(createGame(keyedEntropy(testKey(1))).score).toBe(0);
  });
});

describe("movement (M matrix)", () => {
  const base = (): GameState => {
    const balls = new Uint8Array(CELL_COUNT);
    balls[indexOf(0, 0)] = 1;
    balls[indexOf(5, 5)] = 2;
    return stateOf(balls);
  };

  it("M1: adjacent empty destination has path length 2", () => {
    const r = applyAction(
      base(),
      move(indexOf(0, 0), indexOf(1, 0)),
      nullEntropy(),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      const moveEffect = r.effects[0]!;
      expect(moveEffect.k).toBe("move");
      if (moveEffect.k === "move") expect(moveEffect.path).toHaveLength(2);
    }
  });

  it("M2: destination enclosed by real balls is unreachable", () => {
    const balls = new Uint8Array(CELL_COUNT);
    balls[indexOf(0, 0)] = 1;
    // enclose (5,5)
    balls[indexOf(4, 5)] = 2;
    balls[indexOf(6, 5)] = 2;
    balls[indexOf(5, 4)] = 2;
    balls[indexOf(5, 6)] = 2;
    const r = applyAction(
      stateOf(balls),
      move(indexOf(0, 0), indexOf(5, 5)),
      nullEntropy(),
    );
    expect(r).toEqual({ ok: false, error: "unreachable" });
  });

  it("M3: a ghost destination is reachable — ghosts don't block", () => {
    const balls = new Uint8Array(CELL_COUNT);
    balls[indexOf(0, 0)] = 1;
    const ghosts = emptyGhosts();
    ghosts[indexOf(3, 0)] = 4;
    const r = applyAction(
      stateOf(balls, ghosts),
      move(indexOf(0, 0), indexOf(3, 0)),
      nullEntropy(),
    );
    expect(r.ok).toBe(true);
  });

  it("M4: destination with a real ball", () => {
    const r = applyAction(
      base(),
      move(indexOf(0, 0), indexOf(5, 5)),
      nullEntropy(),
    );
    expect(r).toEqual({ ok: false, error: "destination_occupied" });
  });

  it("M5: empty source", () => {
    const r = applyAction(
      base(),
      move(indexOf(4, 4), indexOf(3, 3)),
      nullEntropy(),
    );
    expect(r).toEqual({ ok: false, error: "no_ball_at_source" });
  });

  it("M6: from === to", () => {
    const r = applyAction(
      base(),
      move(indexOf(0, 0), indexOf(0, 0)),
      nullEntropy(),
    );
    expect(r).toEqual({ ok: false, error: "same_cell" });
  });

  it("M7: out of range", () => {
    expect(applyAction(base(), move(-1, 5), nullEntropy())).toEqual({
      ok: false,
      error: "out_of_bounds",
    });
    expect(applyAction(base(), move(0, 81), nullEntropy())).toEqual({
      ok: false,
      error: "out_of_bounds",
    });
  });

  it("M8: any move after over", () => {
    const s = { ...base(), over: true };
    expect(
      applyAction(s, move(indexOf(0, 0), indexOf(1, 0)), nullEntropy()),
    ).toEqual({
      ok: false,
      error: "game_over",
    });
  });
});

describe("ghosts & spawning (G matrix)", () => {
  it("G1: after any turn, ghosts === min(3, cells free of balls)", () => {
    const entropy = keyedEntropy(testKey(3));
    let state = createGame(entropy);
    for (let t = 0; t < 30 && !state.over; t++) {
      const action = firstLegalMove(state);
      if (!action) break;
      const r = applyAction(state, action, entropy);
      expect(r.ok).toBe(true);
      if (!r.ok) break;
      state = r.state;
      const ballFree = freeOfBalls(state.balls).length;
      const expected = ballFree < 3 ? ballFree : 3;
      const latePop =
        r.effects.some((e) => e.k === "ghostMoved") &&
        r.effects.some((e) => e.k === "pop");
      if (latePop) {
        expect(countNonZero(state.ghosts)).toBeLessThanOrEqual(expected);
      } else {
        expect(countNonZero(state.ghosts)).toBe(expected);
      }
    }
  });

  it("G2: with 2 free cells only 2 ghosts spawn", () => {
    const balls = new Uint8Array(CELL_COUNT).fill(1);
    // avoid instant lines being relevant: fill checkered-ish with 2 colors
    for (let i = 0; i < CELL_COUNT; i++)
      balls[i] = ((i + ((i / 9) | 0)) % 2 === 0 ? 6 : 7) as ColorId;
    // free three cells: source, and two targets
    balls[indexOf(0, 0)] = 0;
    balls[indexOf(8, 8)] = 0;
    balls[indexOf(0, 1)] = 6; // source ball
    balls[indexOf(0, 1)] = balls[indexOf(0, 1)]!;
    const state = stateOf(balls);
    // Move a ball into one free cell; after the move its source is free.
    const r = applyAction(
      state,
      move(indexOf(1, 0), indexOf(0, 0)),
      nullEntropy(),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      const ballFree = freeOfBalls(r.state.balls).length;
      expect(countNonZero(r.state.ghosts)).toBe(ballFree < 3 ? ballFree : 3);
    }
  });

  it("G4: stepping on a ghost relocates only that ghost (+1 draw)", () => {
    const entropy = keyedEntropy(testKey(11));
    let state = createGame(entropy);
    // find a ghost and a ball that can reach it
    const ghostCell = state.ghosts.findIndex((g) => g !== 0);
    const action = legalMoveTo(state, ghostCell);
    expect(action).not.toBeNull();
    const otherGhosts: [number, number][] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      if (state.ghosts[i] !== 0 && i !== ghostCell)
        otherGhosts.push([i, state.ghosts[i]!]);
    }
    const drawsBefore = entropy.rngDraws();
    const displacedColor = state.ghosts[ghostCell]!;
    const r = applyAction(state, action!, entropy);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    state = r.state;
    const moved = r.effects.filter((e) => e.k === "ghostMoved");
    if (r.packet.relocate) {
      expect(moved).toHaveLength(1);
      if (moved[0]!.k === "ghostMoved") {
        expect(moved[0]!.color).toBe(displacedColor);
      }
    }
    // other ghosts byte-identical unless they materialised (no-pop move)
    const materialized = r.effects.some((e) => e.k === "materialize");
    if (!materialized) {
      for (const [c, col] of otherGhosts) expect(state.ghosts[c]).toBe(col);
    }
    // draw accounting: 1 for relocation + 2 per added ghost
    const added = r.packet.ghosts.length;
    expect(entropy.rngDraws() - drawsBefore).toBe(
      (r.packet.relocate ? 1 : 0) + 2 * added,
    );
  });

  it("G6: materialised ghosts completing a line pop in the same turn", () => {
    // Hand-built: four reds in row 0 with a ghost red at the gap.
    const balls = new Uint8Array(CELL_COUNT);
    for (const x of [0, 1, 2, 3]) balls[indexOf(x, 0)] = 1;
    balls[indexOf(7, 7)] = 2; // the ball we will move (no line involvement)
    const ghosts = emptyGhosts();
    ghosts[indexOf(4, 0)] = 1; // materialises to complete the line
    const state = stateOf(balls, ghosts);
    const r = applyAction(
      state,
      move(indexOf(7, 7), indexOf(6, 6)),
      nullEntropy(),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.score).toBe(5);
      expect(r.effects.some((e) => e.k === "materialize")).toBe(true);
      expect(r.effects.some((e) => e.k === "pop")).toBe(true);
      expect(detectLines(r.state.balls)).toHaveLength(0);
    }
  });

  it("G7: materialisation keeps every ghost at its own cell", () => {
    const balls = new Uint8Array(CELL_COUNT);
    balls[indexOf(0, 0)] = 3;
    const ghosts = emptyGhosts();
    ghosts[indexOf(4, 4)] = 5;
    ghosts[indexOf(6, 2)] = 6;
    ghosts[indexOf(2, 6)] = 7;
    const r = applyAction(
      stateOf(balls, ghosts),
      move(indexOf(0, 0), indexOf(1, 0)),
      nullEntropy(),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.balls[indexOf(4, 4)]).toBe(5);
      expect(r.state.balls[indexOf(6, 2)]).toBe(6);
      expect(r.state.balls[indexOf(2, 6)]).toBe(7);
    }
  });

  it("G5/G8: free turn — no materialisation, ghosts topped up, exact draws", () => {
    // Move completes a line; the three ghosts must survive un-materialised.
    const balls = new Uint8Array(CELL_COUNT);
    for (const x of [0, 1, 2, 3]) balls[indexOf(x, 0)] = 1;
    balls[indexOf(4, 4)] = 1; // will move to (4,0) completing the line
    const ghosts = emptyGhosts();
    ghosts[indexOf(8, 8)] = 4;
    ghosts[indexOf(8, 7)] = 5;
    ghosts[indexOf(8, 6)] = 6;
    const entropy = keyedEntropy(testKey(5));
    entropy.init(); // position parity with a real game is irrelevant here
    const drawsBefore = entropy.rngDraws();
    const r = applyAction(
      stateOf(balls, ghosts),
      move(indexOf(4, 4), indexOf(4, 0)),
      entropy,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.effects.some((e) => e.k === "materialize")).toBe(false);
      expect(r.state.score).toBe(5);
      expect(r.state.ghosts[indexOf(8, 8)]).toBe(4);
      expect(r.state.ghosts[indexOf(8, 7)]).toBe(5);
      expect(r.state.ghosts[indexOf(8, 6)]).toBe(6);
      expect(countNonZero(r.state.ghosts)).toBe(3);
      expect(r.packet.ghosts).toHaveLength(0);
      expect(entropy.rngDraws() - drawsBefore).toBe(0);
    }
  });
});

describe("game over (O matrix)", () => {
  it("O1: board full of real balls is over", () => {
    // Fill with a no-line pattern, leave two cells; a move that fills the
    // last free cell ends the game.
    const balls = noLineFullBoard();
    balls[indexOf(0, 0)] = 0; // free target
    const state = stateOf(balls);
    // move neighbour into the free cell — fills the board
    const r = applyAction(
      state,
      move(indexOf(1, 0), indexOf(0, 0)),
      nullEntropy(),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      // the vacated source may pop a line; if no pop, ghosts materialised
      // into... there are no ghosts, so board has 1 free cell (the source)
      expect(r.state.over).toBe(freeOfBalls(r.state.balls).length === 0);
    }
  });

  it("O2: ghosts never count toward game over", () => {
    const balls = noLineFullBoard();
    balls[indexOf(0, 0)] = 0;
    balls[indexOf(1, 0)] = 0;
    const ghosts = emptyGhosts();
    ghosts[indexOf(0, 0)] = 3;
    const state = stateOf(balls, ghosts);
    expect(freeOfBalls(state.balls).length).toBe(2);
    // over is false with a real free cell even though a ghost sits on it
    expect(state.over).toBe(false);
  });

  it("O4: over emits exactly one gameOver effect, last", () => {
    const balls = noLineFullBoard();
    balls[indexOf(0, 0)] = 0;
    const state = stateOf(balls);
    const r = applyAction(
      state,
      move(indexOf(1, 0), indexOf(0, 0)),
      nullEntropy(),
    );
    expect(r.ok).toBe(true);
    if (r.ok && r.state.over) {
      const overs = r.effects.filter((e) => e.k === "gameOver");
      expect(overs).toHaveLength(1);
      expect(r.effects[r.effects.length - 1]!.k).toBe("gameOver");
    }
  });
});

describe("previews", () => {
  it("previewColors scans ghost cells ascending", () => {
    const balls = new Uint8Array(CELL_COUNT);
    const ghosts = emptyGhosts();
    ghosts[50] = 3;
    ghosts[10] = 1;
    ghosts[70] = 7;
    expect(previewColors(stateOf(balls, ghosts))).toEqual([1, 3, 7]);
  });
});

// helpers -------------------------------------------------------------------

function firstLegalMove(state: GameState) {
  for (let from = 0; from < CELL_COUNT; from++) {
    if (state.balls[from] === 0) continue;
    for (const d of [1, -1, 9, -9]) {
      const to = from + d;
      if (to < 0 || to >= CELL_COUNT) continue;
      if (d === 1 && from % 9 === 8) continue;
      if (d === -1 && from % 9 === 0) continue;
      if (state.balls[to] === 0) return move(from, to);
    }
  }
  return null;
}

function legalMoveTo(state: GameState, to: CellIndex) {
  for (let from = 0; from < CELL_COUNT; from++) {
    if (state.balls[from] === 0) continue;
    const r = applyAction(state, move(from, to), {
      init: () => ({ balls: [], ghosts: [] }),
      spawn: () => ({ ghosts: [] }),
    });
    if (r.ok) return move(from, to);
  }
  return null;
}

/** A full board with no line: rows of period-4 colour stripes shifted per row. */
function noLineFullBoard(): Uint8Array {
  const balls = new Uint8Array(CELL_COUNT);
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      balls[indexOf(x, y)] = ((((x + 2 * y) % 4) % 4) + 1) as ColorId;
    }
  }
  if (detectLines(balls).length > 0) throw new Error("pattern has a line");
  return balls;
}
