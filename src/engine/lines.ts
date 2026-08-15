import { BOARD_SIZE, MIN_LINE_LENGTH, scoreForLength } from "./config";
import { indexOf } from "./board";
import type { CellIndex, LineRef } from "./types";

/**
 * Axis traversals in canonical order: H, V, D-down, D-up; within an axis,
 * ascending traversal index; runs emitted by ascending start position.
 *
 * Traversal starts:
 *  - H: rows y = 0..8, start (0, y), step (1, 0)
 *  - V: columns x = 0..8, start (x, 0), step (0, 1)
 *  - D-down (1,1): t = 0..16 -> start t < 9 ? (0, 8 - t) : (t - 8, 0)
 *  - D-up   (1,-1): t = 0..16 -> start t < 9 ? (0, t) : (t - 8, 8)
 */
interface Traversal {
  x0: number;
  y0: number;
  dx: number;
  dy: number;
}

function traversals(axis: 0 | 1 | 2 | 3): Traversal[] {
  const out: Traversal[] = [];
  if (axis === 0) {
    for (let y = 0; y < BOARD_SIZE; y++)
      out.push({ x0: 0, y0: y, dx: 1, dy: 0 });
  } else if (axis === 1) {
    for (let x = 0; x < BOARD_SIZE; x++)
      out.push({ x0: x, y0: 0, dx: 0, dy: 1 });
  } else if (axis === 2) {
    for (let t = 0; t < 2 * BOARD_SIZE - 1; t++) {
      out.push(
        t < BOARD_SIZE
          ? { x0: 0, y0: BOARD_SIZE - 1 - t, dx: 1, dy: 1 }
          : { x0: t - (BOARD_SIZE - 1), y0: 0, dx: 1, dy: 1 },
      );
    }
  } else {
    for (let t = 0; t < 2 * BOARD_SIZE - 1; t++) {
      out.push(
        t < BOARD_SIZE
          ? { x0: 0, y0: t, dx: 1, dy: -1 }
          : { x0: t - (BOARD_SIZE - 1), y0: BOARD_SIZE - 1, dx: 1, dy: -1 },
      );
    }
  }
  return out;
}

/**
 * Full-board maximal-run detection. Ghosts never participate. A length-9 run
 * is one line worth 34, never overlapping 5s; bent sequences are structurally
 * impossible because a run never turns.
 */
export function detectLines(balls: Uint8Array): LineRef[] {
  const out: LineRef[] = [];
  for (const axis of [0, 1, 2, 3] as const) {
    for (const tr of traversals(axis)) {
      let runColor = 0;
      let runCells: CellIndex[] = [];
      let x = tr.x0;
      let y = tr.y0;
      const flush = () => {
        if (runColor !== 0 && runCells.length >= MIN_LINE_LENGTH) {
          out.push({
            cells: runCells,
            length: runCells.length,
            points: scoreForLength(runCells.length),
            axis,
          });
        }
      };
      while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        const color = balls[indexOf(x, y)]!;
        if (color === runColor && color !== 0) {
          runCells.push(indexOf(x, y));
        } else {
          flush();
          runColor = color;
          runCells = color === 0 ? [] : [indexOf(x, y)];
        }
        x += tr.dx;
        y += tr.dy;
      }
      flush();
    }
  }
  return out;
}

export interface ResolveRound {
  lines: LineRef[];
  cells: CellIndex[];
  points: number;
}

/**
 * R4/R6: collect every line first, union the cells, sum the points, then
 * remove once. Pure function of `balls`; never touches entropy. Round 2
 * provably never fires (removal cannot create contiguity), but the loop
 * stays as insurance — correctness comes from scanning the whole board.
 */
export function resolveLines(ballsIn: Uint8Array): {
  balls: Uint8Array;
  rounds: ResolveRound[];
} {
  let balls = ballsIn;
  const rounds: ResolveRound[] = [];
  let guard = 0;
  for (;;) {
    const lines = detectLines(balls);
    if (lines.length === 0) break;
    if (++guard > 2) throw new Error("resolveLines did not converge");
    const seen = new Set<CellIndex>();
    const cells: CellIndex[] = [];
    for (const line of lines) {
      for (const c of line.cells) {
        if (!seen.has(c)) {
          seen.add(c);
          cells.push(c);
        }
      }
    }
    cells.sort((a, b) => a - b);
    let points = 0;
    for (const line of lines) points += line.points;
    balls = balls.slice();
    for (const c of cells) balls[c] = 0;
    rounds.push({ lines, cells, points });
  }
  return { balls, rounds };
}
