import type { Cell } from "../types";

/**
 * Validates if a move is possible
 */
export function validateMove(
  board: Cell[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): boolean {
  // Check if source has a ball
  if (!board[fromY][fromX].ball) return false;

  // Check if target is empty
  if (board[toY][toX].ball) return false;

  // Check if it's the same cell
  if (fromX === toX && fromY === toY) return false;

  return true;
}
