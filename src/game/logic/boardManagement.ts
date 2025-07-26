import { BOARD_SIZE, BALLS_PER_TURN } from "../config";
import type { Cell, BallColor, ConversionResult } from "../types";
import { getRandomNextBalls } from "./ballGeneration";

/**
 * Create an empty game board
 */
export function createEmptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => ({
      x,
      y,
      ball: null,
      incomingBall: null,
      active: false,
    })),
  );
}

/**
 * Get random empty cells from the board
 */
export function getRandomEmptyCells(
  board: Cell[][],
  count: number,
  exclude: Set<string> = new Set(),
): [number, number][] {
  const emptyCells: [number, number][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const key = `${x},${y}`;
      if (!board[y][x].ball && !exclude.has(key)) {
        emptyCells.push([x, y]);
      }
    }
  }
  // Shuffle and take 'count' cells
  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
  }
  return emptyCells.slice(0, count);
}

/**
 * Place real balls on the board
 */
export function placeRealBalls(
  board: Cell[][],
  colors: BallColor[],
  exclude: Set<string> = new Set(),
): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const positions = getRandomEmptyCells(newBoard, colors.length, exclude);
  positions.forEach(([x, y], i) => {
    newBoard[y][x].ball = { color: colors[i] };
  });
  return newBoard;
}

/**
 * Place preview balls on the board
 */
export function placePreviewBalls(
  board: Cell[][],
  colors: BallColor[],
  exclude: Set<string> = new Set(),
): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const positions = getRandomEmptyCells(newBoard, colors.length, exclude);
  positions.forEach(([x, y], i) => {
    newBoard[y][x].incomingBall = { color: colors[i] };
  });
  return newBoard;
}

/**
 * Recalculate incoming ball positions
 */
export function recalculateIncomingPositions(
  board: Cell[][],
  colors: BallColor[],
): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  // Remove all incoming balls
  newBoard.forEach((row) =>
    row.forEach((cell) => {
      cell.incomingBall = null;
    }),
  );

  // Place new incoming balls
  return placePreviewBalls(newBoard, colors);
}

/**
 * Check if the board is full
 */
export function isBoardFull(board: Cell[][]): boolean {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!board[y][x].ball) return false;
    }
  }
  return true;
}

/**
 * Check if the game should end
 */
export function checkGameOver(board: Cell[][]): boolean {
  return isBoardFull(board);
}

/**
 * Handles incoming ball conversion and new ball placement
 */
export function handleIncomingBallConversion(
  board: Cell[][], 
  steppedOnIncomingBall?: BallColor
): ConversionResult {
  // Convert incoming balls to real balls
  const boardWithRealBalls = board.map((row) =>
    row.map((cell) => ({
      ...cell,
      ball: cell.incomingBall ? cell.incomingBall : cell.ball,
      incomingBall: null,
    })),
  );

  // Check if board is full after conversion
  if (isBoardFull(boardWithRealBalls)) {
    return {
      newBoard: boardWithRealBalls,
      nextBalls: getRandomNextBalls(BALLS_PER_TURN),
      gameOver: true,
    };
  }

  // Generate next preview balls
  let nextPreviewBalls: BallColor[];
  let afterBalls: Cell[][];

  if (steppedOnIncomingBall) {
    // When stepping on an incoming ball, all incoming balls get converted to real balls
    // Then we spawn 3 new incoming balls, with one being the recalculated stepped-on color
    nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN - 1); // Get 2 random colors
    nextPreviewBalls.push(steppedOnIncomingBall); // Add the recalculated color
    afterBalls = placePreviewBalls(boardWithRealBalls, nextPreviewBalls);
  } else {
    // Normal case: generate 3 new balls
    nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN);
    afterBalls = placePreviewBalls(boardWithRealBalls, nextPreviewBalls);
  }

  return {
    newBoard: afterBalls,
    nextBalls: nextPreviewBalls,
    gameOver: isBoardFull(afterBalls),
  };
} 
