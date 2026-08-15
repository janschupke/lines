import {
  BALLS_PER_TURN,
  COLOR_COUNT,
  INITIAL_BALLS,
  MIN_LINE_LENGTH,
} from "./config";
import { allCellsAscending } from "./board";
import { detectLines } from "./lines";
import type { Cursor } from "./rng";
import { nextBelow } from "./rng";
import type {
  CellIndex,
  ColorId,
  InitPacket,
  PlacedBall,
  SpawnPacket,
} from "./types";

/** Exactly 1 draw. */
const drawColor = (c: Cursor): ColorId =>
  (nextBelow(c, COLOR_COUNT) + 1) as ColorId;

/** Exactly 1 draw, from an eligibility list built ascending by ColorId. */
const drawColorFrom = (c: Cursor, eligible: readonly ColorId[]): ColorId =>
  eligible[nextBelow(c, eligible.length)]!;

/** Exactly 1 draw. Swap-remove keeps the free list draw-stable. */
const drawCell = (c: Cursor, free: CellIndex[]): CellIndex => {
  const k = nextBelow(c, free.length);
  const cell = free[k]!;
  free[k] = free[free.length - 1]!;
  free.pop();
  return cell;
};

/**
 * The keyed initial deal; cursor starts at streamPos 0. Exactly
 * 2*INITIAL_BALLS + 2*BALLS_PER_TURN = 16 draws, always — the R7 colour cap
 * is applied at draw time, never by resampling.
 */
export function keyedInit(c: Cursor): InitPacket {
  const balls: PlacedBall[] = [];
  const ghosts: PlacedBall[] = [];
  const free = allCellsAscending();
  const counts = new Uint8Array(COLOR_COUNT + 1);

  for (let k = 0; k < INITIAL_BALLS; k++) {
    // R7: colours that already reached MIN_LINE_LENGTH - 1 are ineligible.
    const eligible: ColorId[] = [];
    for (let col = 1; col <= COLOR_COUNT; col++) {
      if (counts[col]! < MIN_LINE_LENGTH - 1) eligible.push(col as ColorId);
    }
    const color = drawColorFrom(c, eligible); // 1 draw
    counts[color]!++;
    balls.push({ c: drawCell(c, free), color }); // 1 draw
  }

  // R7 safety net — must never fire; throws in every environment.
  const board = new Uint8Array(81);
  for (const b of balls) board[b.c] = b.color;
  if (detectLines(board).length > 0) {
    throw new Error("initial deal produced a line — R7 violated");
  }

  for (let k = 0; k < BALLS_PER_TURN && free.length > 0; k++) {
    const color = drawColor(c); // 1 draw
    ghosts.push({ c: drawCell(c, free), color }); // 1 draw
  }
  return { balls, ghosts };
}

export interface SpawnRequest {
  /** Free cells (no ball, no ghost), ascending, after line resolution. */
  readonly free: readonly CellIndex[];
  /** Set iff a ghost was stepped on this move. */
  readonly relocateColor: ColorId | null;
  /** Ghosts to ADD so the board ends at min(BALLS_PER_TURN, cells free of balls). */
  readonly ghostCount: number;
}

/**
 * The keyed spawn: 1 draw for the relocation cell (0 if none pending or no
 * free cell), then 2 per ghost — colour first, then cell, interleaved per
 * ball so running out of space mid-loop still leaves an exact draw count.
 */
export function keyedSpawn(c: Cursor, req: SpawnRequest): SpawnPacket {
  const free = req.free.slice();
  let relocate: { to: CellIndex } | undefined;
  if (req.relocateColor !== null && free.length > 0) {
    relocate = { to: drawCell(c, free) }; // 1 draw
  }
  const ghosts: PlacedBall[] = [];
  for (let k = 0; k < req.ghostCount && free.length > 0; k++) {
    const color = drawColor(c); // 1 draw
    ghosts.push({ c: drawCell(c, free), color }); // 1 draw
  }
  return relocate ? { relocate, ghosts } : { ghosts };
}
