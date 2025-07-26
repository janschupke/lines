import { BALLS_PER_TURN } from "../config";
import type { Cell, MoveResult } from "../types";
import {
  getRandomNextBalls,
} from "./ballGeneration";

/**
 * Handles the completion of a ball move
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
  
  // Debug: Check if red ball is being moved correctly
  if (board[fromY][fromX].ball?.color === 'red') {
    console.log("Moving red ball from", fromX, fromY, "to", toX, toY);
    console.log("New board state at destination:", newBoard[toY][toX]);
  }

  // If we stepped on an incoming ball, handle the conversion here
  if (steppedOnIncomingBall) {
    // Preserve other incoming balls, only convert the stepped-on one
    const boardWithPreservedIncoming = newBoard.map((row) =>
      row.map((cell) => ({
        ...cell,
        // The ball has already been moved to the destination in newBoard
        // We just need to clear the incoming ball at the destination
        incomingBall: (cell.x === toX && cell.y === toY) ? null : cell.incomingBall,
      })),
    );

    // Generate new incoming balls with the stepped-on color preserved
    const nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN - 1); // Get 2 random colors
    nextPreviewBalls.push(steppedOnIncomingBall); // Add the recalculated color

    return {
      newBoard: boardWithPreservedIncoming, // Return board before placing new incoming balls
      linesFormed: false,
      nextBalls: nextPreviewBalls,
    };
  }

  return {
    newBoard,
    linesFormed: false,
  };
} 
