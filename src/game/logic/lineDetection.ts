import { BOARD_SIZE, MIN_LINE_LENGTH } from "../config";
import type { Cell, BallColor, Direction, MoveResult } from "../types";

const DIRECTIONS: Direction[] = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal up-right
];

/**
 * Find all lines that pass through a given position
 */
export function findLine(
  board: Cell[][],
  x: number,
  y: number,
  color: BallColor,
): [number, number][][] {
  const lines: [number, number][][] = [];
  for (const [dx, dy] of DIRECTIONS) {
    const line: [number, number][] = [[x, y]];
    // Forward
    let nx = x + dx,
      ny = y + dy;
    while (
      nx >= 0 &&
      nx < BOARD_SIZE &&
      ny >= 0 &&
      ny < BOARD_SIZE &&
      board[ny][nx].ball &&
      board[ny][nx].ball!.color === color
    ) {
      line.push([nx, ny]);
      nx += dx;
      ny += dy;
    }
    // Backward
    nx = x - dx;
    ny = y - dy;
    while (
      nx >= 0 &&
      nx < BOARD_SIZE &&
      ny >= 0 &&
      ny < BOARD_SIZE &&
      board[ny][nx].ball &&
      board[ny][nx].ball!.color === color
    ) {
      line.unshift([nx, ny]);
      nx -= dx;
      ny -= dy;
    }
    if (line.length >= MIN_LINE_LENGTH) {
      lines.push(line);
    }
  }
  return lines;
}

/**
 * Checks for lines and handles ball removal
 */
export function handleLineDetection(
  board: Cell[][],
  toX: number,
  toY: number,
): MoveResult | null {
  const movedColor = board[toY][toX].ball?.color;
  if (!movedColor) return null;

  const lines: [number, number][][] = findLine(board, toX, toY, movedColor);
  const ballsToRemoveSet = new Set<string>();

  lines.forEach((line: [number, number][]) => {
    line.forEach(([x, y]: [number, number]) => {
      ballsToRemoveSet.add(`${x},${y}`);
    });
  });

  if (ballsToRemoveSet.size === 0) return null;

  // Convert set back to array
  const ballsToRemove: [number, number][] = Array.from(ballsToRemoveSet).map(
    (key) => {
      const [x, y] = key.split(",").map(Number);
      return [x, y];
    },
  );

  // Remove balls
  const boardAfterRemoval = board.map((row) =>
    row.map((cell) => ({ ...cell })),
  );
  ballsToRemove.forEach(([x, y]) => {
    boardAfterRemoval[y][x].ball = null;
  });

  return {
    newBoard: boardAfterRemoval,
    linesFormed: true,
    ballsRemoved: ballsToRemove,
    pointsEarned: ballsToRemove.length,
  };
} 
