import type { Cell, MoveResult } from "../types";

/**
 * Handles the completion of a ball move
 * This function only handles the move itself, not spawning logic
 */
export function handleMoveCompletion(
  board: Cell[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): MoveResult {
  const newBoard = board.map((row) =>
    row.map((cell) => ({ ...cell, active: false })),
  );

  // Check if we're stepping on an incoming ball
  const steppedOnIncomingBall = board[toY][toX].incomingBall?.color;

  // Move the ball
  newBoard[toY][toX].ball = board[fromY][fromX].ball;
  newBoard[fromY][fromX].ball = null;
  newBoard[toY][toX].incomingBall = null; // Clear incoming ball at destination

  return {
    newBoard,
    linesFormed: false,
    steppedOnIncomingBall, // Pass this information to the spawning logic
  };
}
