import { CELL_COUNT } from "./config";
import type { CellIndex, ColorId, GameAction, GameState } from "./types";
import { freeOfBalls } from "./board";
import { reachableFrom } from "./path";
import { belowAt, type Key } from "./rng";

/**
 * Test helpers (imported only from *.test.ts files and scripts).
 * Board literals: R red, B blue, G green, Y yellow, U purple, P pink,
 * K black, '.' empty. Lower-case letters place ghosts.
 */
const LETTER_TO_COLOR: Record<string, ColorId> = {
  R: 1,
  B: 2,
  G: 3,
  Y: 4,
  U: 5,
  P: 6,
  K: 7,
};

export function board(literal: string): Uint8Array {
  const cells = literal.split(/\s+/).filter(Boolean);
  if (cells.length !== CELL_COUNT) {
    throw new Error(`board literal has ${cells.length} cells, wanted 81`);
  }
  const out = new Uint8Array(CELL_COUNT);
  for (let i = 0; i < CELL_COUNT; i++) {
    const ch = cells[i]!;
    if (ch === ".") continue;
    const color = LETTER_TO_COLOR[ch.toUpperCase()];
    if (!color) throw new Error(`bad board char: ${ch}`);
    out[i] = color;
  }
  return out;
}

export function stateOf(
  balls: Uint8Array,
  ghosts?: Uint8Array,
  partial?: Partial<Pick<GameState, "score" | "moveCount" | "over">>,
): GameState {
  return {
    balls,
    ghosts: ghosts ?? new Uint8Array(CELL_COUNT),
    score: partial?.score ?? 0,
    moveCount: partial?.moveCount ?? 0,
    over: partial?.over ?? false,
    stats: { turns: 0, linesPopped: 0, longestLine: 0, ballsCleared: 0 },
  };
}

export function testKey(n: number): Key {
  const k = new Uint8Array(32);
  for (let i = 0; i < 32; i++)
    k[i] = (n * 31 + i * 7 + ((n >> i % 8) & 0xff)) & 0xff;
  return k;
}

/**
 * Generate a game by repeatedly choosing a uniformly random legal move until
 * game over (or maxMoves). Uses the engine's own seekable RNG on a distinct
 * key so choices are reproducible per seed.
 */
/**
 * Like randomLegalMove, but prefers a line-completing move when one exists
 * (probed with a throwaway entropy — pops are in the deterministic prefix).
 * Used by the corpus generator so fixtures actually pin scoring.
 */
export function greedyLegalMove(
  state: GameState,
  chooserKey: Key,
  drawIndex: number,
  probe: (s: GameState, a: GameAction) => boolean,
): GameAction | null {
  const tryGreedy = belowAt(chooserKey, drawIndex * 2, 10) < 8;
  let clustered: GameAction | null = null;
  if (tryGreedy) {
    for (let from = 0; from < CELL_COUNT; from++) {
      if (state.balls[from] === 0) continue;
      const reach = reachableFrom(state.balls, from);
      for (const to of freeOfBalls(state.balls)) {
        if (to === from || reach[to] !== 1) continue;
        const a: GameAction = { t: "move", from, to };
        if (probe(state, a)) return a;
        // fall back to clustering: land next to a same-coloured ball
        if (clustered === null && hasSameColorNeighbour(state, to, from)) {
          clustered = a;
        }
      }
    }
    if (clustered) return clustered;
  }
  return randomLegalMove(state, chooserKey, drawIndex);
}

function hasSameColorNeighbour(
  state: GameState,
  to: CellIndex,
  from: CellIndex,
): boolean {
  const color = state.balls[from]!;
  const x = to % 9;
  const y = (to / 9) | 0;
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
    [-1, 0],
    [0, -1],
    [-1, -1],
    [-1, 1],
  ] as const) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx > 8 || ny < 0 || ny > 8) continue;
    const n = ny * 9 + nx;
    if (n !== from && state.balls[n] === color) return true;
  }
  return false;
}

export function randomLegalMove(
  state: GameState,
  chooserKey: Key,
  drawIndex: number,
): GameAction | null {
  const sources: CellIndex[] = [];
  for (let i = 0; i < CELL_COUNT; i++)
    if (state.balls[i] !== 0) sources.push(i);
  // Try sources in a rotated order so a blocked ball doesn't stall the walk.
  const rot = belowAt(chooserKey, drawIndex * 2, sources.length || 1);
  for (let s = 0; s < sources.length; s++) {
    const from = sources[(s + rot) % sources.length]!;
    const reach = reachableFrom(state.balls, from);
    const dests: CellIndex[] = [];
    for (const c of freeOfBalls(state.balls)) {
      if (reach[c] === 1 && c !== from) dests.push(c);
    }
    if (dests.length === 0) continue;
    const to = dests[belowAt(chooserKey, drawIndex * 2 + 1, dests.length)]!;
    return { t: "move", from, to };
  }
  return null;
}
