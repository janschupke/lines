import { BOARD_SIZE, MIN_LINE_LENGTH } from "../config";
import { calculateLineScore } from "./scoring";
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
    pointsEarned: calculateLineScore(ballsToRemove.length),
  };
}

/**
 * Checks for lines and handles ball removal for multiple positions
 * Used when spawning balls that might trigger multiple lines simultaneously
 */
export function handleMultiPositionLineDetection(
  board: Cell[][],
  positions: [number, number][],
): MoveResult | null {
  const allLines: [number, number][][] = [];
  const ballsToRemoveSet = new Set<string>();

  // Check for lines at each position
  for (const [x, y] of positions) {
    const ball = board[y][x].ball;
    if (!ball) continue;

    const lines = findLine(board, x, y, ball.color);
    lines.forEach((line) => {
      // Check if this line is already covered by previous positions
      const lineKey = line
        .map(([lx, ly]) => `${lx},${ly}`)
        .sort()
        .join("|");
      const existingLine = allLines.find((existingLine) => {
        const existingKey = existingLine
          .map(([lx, ly]) => `${lx},${ly}`)
          .sort()
          .join("|");
        return existingKey === lineKey;
      });

      if (!existingLine) {
        allLines.push(line);
        line.forEach(([lx, ly]) => {
          ballsToRemoveSet.add(`${lx},${ly}`);
        });
      }
    });
  }

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
    pointsEarned: calculateLineScore(ballsToRemove.length),
  };
}

/**
 * Calculate the center position of a line
 */
export function calculateLineCenter(line: [number, number][]): {
  x: number;
  y: number;
} {
  if (line.length === 0) return { x: 0, y: 0 };

  const sumX = line.reduce((sum, [x]) => sum + x, 0);
  const sumY = line.reduce((sum, [, y]) => sum + y, 0);

  return {
    x: Math.round(sumX / line.length),
    y: Math.round(sumY / line.length),
  };
}
