import { BOARD_SIZE, BALLS_PER_TURN } from "../../config";
import type { Cell, BallColor, ConversionResult } from "../../types";
import { getRandomNextBalls } from "../balls/ballGeneration";
import { LineDetectionEngine } from "../lines/lineDetectionEngine";
import { coordToKey } from "@shared/utils/coordinates";
import { cloneBoard } from "../../utils/boardUtils";

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
  exclude = new Set<string>(),
): [number, number][] {
  const emptyCells: [number, number][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const key = coordToKey({ x, y });
      if (!board[y][x].ball && !exclude.has(key)) {
        emptyCells.push([x, y]);
      }
    }
  }
  // Sort by position for deterministic selection (prevents blinking on re-renders)
  emptyCells.sort(([x1, y1], [x2, y2]) => {
    if (y1 !== y2) return y1 - y2;
    return x1 - x2;
  });
  return emptyCells.slice(0, count);
}

/**
 * Place real balls on the board
 */
export function placeRealBalls(
  board: Cell[][],
  colors: BallColor[],
  exclude = new Set<string>(),
): Cell[][] {
  const newBoard = cloneBoard(board);
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
  exclude = new Set<string>(),
): Cell[][] {
  const newBoard = cloneBoard(board);
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
  const newBoard = cloneBoard(board);

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
 * Handles incoming ball conversion and new ball placement
 * According to SPAWN.md:
 * - If ball steps on preview cell: recalculate that preview to new position
 * - If ball steps on preview cell AND gets popped: DON'T recalculate, spawn in original position
 */
export function handleIncomingBallConversion(
  board: Cell[][],
  steppedOnIncomingBall?: BallColor,
  _wasSteppedOnBallPopped = false,
): ConversionResult {
  // Convert incoming balls to real balls
  const boardWithRealBalls = cloneBoard(board);
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (boardWithRealBalls[y][x].incomingBall) {
        boardWithRealBalls[y][x].ball = boardWithRealBalls[y][x].incomingBall;
        boardWithRealBalls[y][x].incomingBall = null;
      }
    }
  }

  // Check if board is full after conversion
  if (isBoardFull(boardWithRealBalls)) {
    return {
      newBoard: boardWithRealBalls,
      nextBalls: getRandomNextBalls(BALLS_PER_TURN),
      gameOver: true,
    };
  }

  // Generate next preview balls and handle stepped-on ball if present
  let workingBoard = boardWithRealBalls;
  const spawnedPositions: [number, number][] = [];

  // If a ball was stepped on, place it as a real ball in a new position
  if (steppedOnIncomingBall) {
    // Note: Both cases (popped or not) need to place the stepped-on ball
    // as a real ball since the move handler cleared it from the destination
    workingBoard = placeRealBalls(workingBoard, [steppedOnIncomingBall]);

    // Track the position where the stepped-on ball was placed
    const steppedOnPosition = findBallPosition(
      workingBoard,
      steppedOnIncomingBall,
    );
    if (steppedOnPosition) {
      spawnedPositions.push(steppedOnPosition);
    }
  }

  // Generate and place next preview balls
  const nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN);
  const afterBalls = placePreviewBalls(workingBoard, nextPreviewBalls);

  // Track positions of all balls that were converted from incoming to real
  // (including the stepped-on ball if present, and all other incoming balls)
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      // Track balls that were incoming and are now real
      if (board[y][x].incomingBall && afterBalls[y][x].ball) {
        spawnedPositions.push([x, y]);
      }
      // Also track any new balls that appeared (for normal case)
      else if (
        afterBalls[y][x].ball &&
        !board[y][x].ball &&
        !board[y][x].incomingBall
      ) {
        spawnedPositions.push([x, y]);
      }
    }
  }

  // Check for lines formed by spawned balls
  const lineDetectionEngine = new LineDetectionEngine();
  const lineResult = lineDetectionEngine.detectLinesAtPositions(
    afterBalls,
    spawnedPositions,
  );

  if (lineResult) {
    // Remove balls from board
    const boardAfterRemoval = cloneBoard(afterBalls);
    for (const [x, y] of lineResult.ballsToRemove) {
      boardAfterRemoval[y][x].ball = null;
    }

    // Lines were formed by spawning - return the board after line removal
    return {
      newBoard: boardAfterRemoval,
      nextBalls: nextPreviewBalls,
      gameOver: isBoardFull(boardAfterRemoval),
      linesFormed: true,
      ballsRemoved: lineResult.ballsToRemove,
      pointsEarned: lineResult.score,
      lines: lineResult.lines, // Include lines for statistics
    };
  }

  return {
    newBoard: afterBalls,
    nextBalls: nextPreviewBalls,
    gameOver: isBoardFull(afterBalls),
  };
}

/**
 * Helper function to find the position of a ball with a specific color
 */
function findBallPosition(
  board: Cell[][],
  color: BallColor,
): [number, number] | null {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x].ball?.color === color) {
        return [x, y];
      }
    }
  }
  return null;
}
