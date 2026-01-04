import type { Cell } from "../types";

/**
 * Board utility functions
 * Provides common operations for board manipulation
 */

/**
 * Clone a board (deep copy)
 */
export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}
