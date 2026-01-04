import { BOARD_SIZE } from "../../config";
import type { Cell } from "../../types";

/**
 * Find a path between two points on the board
 */
export function findPath(
  board: Cell[][],
  from: { x: number; y: number },
  to: { x: number; y: number },
): [number, number][] | null {
  if (from.x === to.x && from.y === to.y) return null;
  const visited = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(false),
  );
  const prev: (null | [number, number])[][] = Array.from(
    { length: BOARD_SIZE },
    () => Array(BOARD_SIZE).fill(null),
  );
  const queue: [number, number][] = [[from.x, from.y]];
  visited[from.y][from.x] = true;
  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const [x, y] = current;
    for (const [dx, dy] of directions) {
      const nx = x + dx,
        ny = y + dy;
      if (
        nx >= 0 &&
        nx < BOARD_SIZE &&
        ny >= 0 &&
        ny < BOARD_SIZE &&
        !visited[ny][nx] &&
        !board[ny][nx].ball
      ) {
        visited[ny][nx] = true;
        prev[ny][nx] = [x, y];
        if (nx === to.x && ny === to.y) {
          // Reconstruct path
          const path: [number, number][] = [];
          let cx = nx,
            cy = ny;
          while (!(cx === from.x && cy === from.y)) {
            path.push([cx, cy]);
            const prevCell = prev[cy]?.[cx];
            if (!prevCell) break;
            [cx, cy] = prevCell;
          }
          path.push([from.x, from.y]);
          path.reverse();
          return path;
        }
        queue.push([nx, ny]);
      }
    }
  }
  return null;
}

/**
 * Find all unreachable cells from a given starting position
 */
export function findUnreachableCells(
  board: Cell[][],
  from: { x: number; y: number },
): [number, number][] {
  const visited = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(false),
  );
  const queue: [number, number][] = [[from.x, from.y]];
  visited[from.y][from.x] = true;
  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  // BFS to find all reachable cells
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const [x, y] = current;
    for (const [dx, dy] of directions) {
      const nx = x + dx,
        ny = y + dy;
      if (
        nx >= 0 &&
        nx < BOARD_SIZE &&
        ny >= 0 &&
        ny < BOARD_SIZE &&
        !visited[ny][nx] &&
        !board[ny][nx].ball
      ) {
        visited[ny][nx] = true;
        queue.push([nx, ny]);
      }
    }
  }

  // Return all unreachable cells (empty cells that weren't visited)
  const unreachableCells: [number, number][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!board[y][x].ball && !visited[y][x]) {
        unreachableCells.push([x, y]);
      }
    }
  }

  return unreachableCells;
}
