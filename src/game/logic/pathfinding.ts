import { BOARD_SIZE } from "../config";
import type { Cell } from "../types";

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
    const [x, y] = queue.shift()!;
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
            [cx, cy] = prev[cy][cx]!;
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
