import { BOARD_SIZE, CELL_COUNT } from "./config";
import type { CellIndex, ColorId, GameState } from "./types";

export const xOf = (i: CellIndex): number => i % BOARD_SIZE;
export const yOf = (i: CellIndex): number => (i / BOARD_SIZE) | 0;
export const indexOf = (x: number, y: number): CellIndex => y * BOARD_SIZE + x;

export const inRange = (i: number): boolean =>
  Number.isInteger(i) && i >= 0 && i < CELL_COUNT;

export const allCellsAscending = (): CellIndex[] => {
  const out: CellIndex[] = [];
  for (let i = 0; i < CELL_COUNT; i++) out.push(i);
  return out;
};

/** Cells with no real ball, ascending. Ghost cells count as free. */
export function freeOfBalls(balls: Uint8Array): CellIndex[] {
  const out: CellIndex[] = [];
  for (let i = 0; i < CELL_COUNT; i++) if (balls[i] === 0) out.push(i);
  return out;
}

/** Cells with neither a real ball nor a ghost, ascending. */
export function freeOfBoth(balls: Uint8Array, ghosts: Uint8Array): CellIndex[] {
  const out: CellIndex[] = [];
  for (let i = 0; i < CELL_COUNT; i++) {
    if (balls[i] === 0 && ghosts[i] === 0) out.push(i);
  }
  return out;
}

export function countNonZero(arr: Uint8Array): number {
  let n = 0;
  for (const v of arr) if (v !== 0) n++;
  return n;
}

/** Ghost colours scanning ascending — the "next balls" preview derives from this. */
export function previewColors(state: GameState): ColorId[] {
  const out: ColorId[] = [];
  for (let i = 0; i < CELL_COUNT; i++) {
    if (state.ghosts[i] !== 0) out.push(state.ghosts[i] as ColorId);
  }
  return out;
}

/** FNV-1a 32 over balls|ghosts, 8 hex chars. */
export function boardHash(state: GameState): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < CELL_COUNT; i++) {
    h ^= state.balls[i]!;
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  for (let i = 0; i < CELL_COUNT; i++) {
    h ^= state.ghosts[i]!;
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** FNV-1a 32 over an arbitrary string (used for RULES_HASH). */
export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
