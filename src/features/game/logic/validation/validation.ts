import type { Cell } from "../../types";

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
  const fromRow = board[fromY];
  if (!fromRow) return false;
  const fromCell = fromRow[fromX];
  if (!fromCell || !fromCell.ball) return false;

  // Check if target is empty (can have incoming ball, but not a real ball)
  const toRow = board[toY];
  if (!toRow) return false;
  const toCell = toRow[toX];
  if (!toCell || toCell.ball) return false; // Incoming balls are OK, real balls are not

  // Check if it's the same cell
  if (fromX === toX && fromY === toY) return false;

  return true;
}
