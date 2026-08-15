import { BOARD_SIZE, CELL_COUNT } from "./config";
import type { CellIndex } from "./types";

/**
 * BFS over 4-neighbours through cells with balls[i] === 0. Ghosts do not
 * block. Neighbour order is fixed and documented: up, right, down, left
 * (index deltas -9, +1, +9, -1), so the returned path is deterministic.
 */
export function findPath(
  balls: Uint8Array,
  from: CellIndex,
  to: CellIndex,
): readonly CellIndex[] | null {
  if (from === to) return [from];
  const prev = new Int16Array(CELL_COUNT).fill(-2); // -2 unvisited, -1 origin
  const queue = new Int16Array(CELL_COUNT);
  let head = 0;
  let tail = 0;
  queue[tail++] = from;
  prev[from] = -1;
  while (head < tail) {
    const cur = queue[head++]!;
    const x = cur % BOARD_SIZE;
    const y = (cur / BOARD_SIZE) | 0;
    // up, right, down, left
    const neighbours = [
      y > 0 ? cur - BOARD_SIZE : -1,
      x < BOARD_SIZE - 1 ? cur + 1 : -1,
      y < BOARD_SIZE - 1 ? cur + BOARD_SIZE : -1,
      x > 0 ? cur - 1 : -1,
    ];
    for (const n of neighbours) {
      if (n < 0 || prev[n] !== -2) continue;
      if (n === to) {
        const path: CellIndex[] = [to, cur];
        let p = cur;
        while (prev[p] !== -1) {
          p = prev[p]!;
          path.push(p);
        }
        path.reverse();
        return path;
      }
      if (balls[n] !== 0) continue;
      prev[n] = cur;
      queue[tail++] = n;
    }
  }
  return null;
}

/**
 * One BFS from `origin` through empty cells; result[i] === 1 iff reachable.
 * Consumed by the UI for the "unreachable" shading.
 */
export function reachableFrom(
  balls: Uint8Array,
  origin: CellIndex,
): Uint8Array {
  const out = new Uint8Array(CELL_COUNT);
  const queue = new Int16Array(CELL_COUNT);
  let head = 0;
  let tail = 0;
  queue[tail++] = origin;
  out[origin] = 1;
  while (head < tail) {
    const cur = queue[head++]!;
    const x = cur % BOARD_SIZE;
    const y = (cur / BOARD_SIZE) | 0;
    const neighbours = [
      y > 0 ? cur - BOARD_SIZE : -1,
      x < BOARD_SIZE - 1 ? cur + 1 : -1,
      y < BOARD_SIZE - 1 ? cur + BOARD_SIZE : -1,
      x > 0 ? cur - 1 : -1,
    ];
    for (const n of neighbours) {
      if (n < 0 || out[n] === 1) continue;
      out[n] = 1;
      if (balls[n] === 0) queue[tail++] = n;
    }
  }
  return out;
}
