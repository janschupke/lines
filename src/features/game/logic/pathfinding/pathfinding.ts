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
  const fromVisitedRow = visited[from.y];
  if (fromVisitedRow) {
    fromVisitedRow[from.x] = true;
  }
  const directions: [number, number][] = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const [x, y] = current;
    for (const direction of directions) {
      const [dx, dy] = direction;
      const nx = x + dx,
        ny = y + dy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
        const visitedRow = visited[ny];
        const boardRow = board[ny];
        if (!visitedRow || !boardRow) continue;
        const visitedCell = visitedRow[nx];
        const boardCell = boardRow[nx];
        if (visitedCell === undefined || !boardCell) continue;
        if (!visitedCell && !boardCell.ball) {
          visitedRow[nx] = true;
          const prevRow = prev[ny];
          if (prevRow) {
            prevRow[nx] = [x, y];
          }
          if (nx === to.x && ny === to.y) {
            // Reconstruct path backwards from destination to source
            const path: [number, number][] = [];
            let cx = nx,
              cy = ny;
            const maxIterations = BOARD_SIZE * BOARD_SIZE; // Safety limit
            let iterations = 0;

            // Build path backwards until we reach the start
            while (iterations < maxIterations) {
              path.push([cx, cy]);

              // If we've reached the start, we're done
              if (cx === from.x && cy === from.y) {
                path.reverse();
                return path;
              }

              // Get the previous cell in the path
              const prevRow = prev[cy];
              if (!prevRow) {
                // Path chain broken - return null
                return null;
              }
              const prevCell = prevRow[cx];
              if (!prevCell) {
                // Reached a cell with no previous (should be the start)
                // If we're not at the start, path is broken
                if (cx !== from.x || cy !== from.y) {
                  return null;
                }
                path.reverse();
                return path;
              }

              // Move to previous cell
              [cx, cy] = prevCell;
              iterations++;
            }

            // Safety: exceeded max iterations - path reconstruction failed
            return null;
          }
          queue.push([nx, ny]);
        }
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
  const fromVisitedRow = visited[from.y];
  if (fromVisitedRow) {
    fromVisitedRow[from.x] = true;
  }
  const directions: [number, number][] = [
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
    for (const direction of directions) {
      const [dx, dy] = direction;
      const nx = x + dx,
        ny = y + dy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
        const visitedRow = visited[ny];
        const boardRow = board[ny];
        if (!visitedRow || !boardRow) continue;
        const visitedCell = visitedRow[nx];
        const boardCell = boardRow[nx];
        if (visitedCell === undefined || !boardCell) continue;
        if (!visitedCell && !boardCell.ball) {
          visitedRow[nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
  }

  // Return all unreachable cells (empty cells that weren't visited)
  const unreachableCells: [number, number][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row = board[y];
    const visitedRow = visited[y];
    if (!row || !visitedRow) continue;
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = row[x];
      const visitedCell = visitedRow[x];
      if (!cell || visitedCell === undefined) continue;
      if (!cell.ball && !visitedCell) {
        unreachableCells.push([x, y]);
      }
    }
  }

  return unreachableCells;
}
