import { BOARD_SIZE, BALLS_PER_TURN } from "../config";
import type { Cell, BallColor, ConversionResult } from "../types";
import { getRandomNextBalls } from "./ballGeneration";
import { handleMultiPositionLineDetection } from "./lineDetection";

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
  const spawnedPositions: [number, number][] = [];

  if (steppedOnIncomingBall) {
    // When stepping on an incoming ball:
    // 1. RECALCULATE the stepped-on ball to a NEW position as a REAL BALL
    // 2. Convert all existing incoming balls to real balls
    // 3. THEN generate 3 new preview balls for the next turn
    
    // STEP 1: RECALCULATE the stepped-on ball to a new position as a REAL BALL
    const boardWithSteppedOnBall = placeRealBalls(boardWithRealBalls, [steppedOnIncomingBall]);
    
    // Track the position where the stepped-on ball was placed
    const steppedOnPosition = findBallPosition(boardWithSteppedOnBall, steppedOnIncomingBall);
    if (steppedOnPosition) {
      spawnedPositions.push(steppedOnPosition);
    }
    
    // STEP 2: Generate 3 new preview balls for the next turn
    nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN);
    afterBalls = placePreviewBalls(boardWithSteppedOnBall, nextPreviewBalls);
  } else {
    // Normal case: generate 3 new balls
    nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN);
    afterBalls = placePreviewBalls(boardWithRealBalls, nextPreviewBalls);
    
    // Track positions of all spawned balls (converted from incoming balls)
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (afterBalls[y][x].ball && !board[y][x].ball) {
          spawnedPositions.push([x, y]);
        }
      }
    }
  }
  
  // Also track positions of incoming balls that were converted to real balls
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x].incomingBall && afterBalls[y][x].ball) {
        spawnedPositions.push([x, y]);
      }
    }
  }

  // Check for lines formed by spawned balls
  const lineResult = handleMultiPositionLineDetection(afterBalls, spawnedPositions);
  
  if (lineResult) {
    // Lines were formed by spawning - return the board after line removal
    return {
      newBoard: lineResult.newBoard,
      nextBalls: nextPreviewBalls,
      gameOver: isBoardFull(lineResult.newBoard),
      linesFormed: true,
      ballsRemoved: lineResult.ballsRemoved,
      pointsEarned: lineResult.pointsEarned,
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
function findBallPosition(board: Cell[][], color: BallColor): [number, number] | null {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x].ball?.color === color) {
        return [x, y];
      }
    }
  }
  return null;
} 
