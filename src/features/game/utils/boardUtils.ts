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

/**
 * Update a single cell on the board
 * Returns a new board with the updated cell
 */
export function updateCell(
  board: Cell[][],
  x: number,
  y: number,
  updates: Partial<Cell>,
): Cell[][] {
  const newBoard = cloneBoard(board);
  const row = newBoard[y];
  if (row) {
    const cell = row[x];
    if (cell) {
      row[x] = { ...cell, ...updates };
    }
  }
  return newBoard;
}

/**
 * Update multiple cells on the board
 * Returns a new board with all updated cells
 */
export function updateCells(
  board: Cell[][],
  updates: { x: number; y: number; updates: Partial<Cell> }[],
): Cell[][] {
  const newBoard = cloneBoard(board);
  updates.forEach(({ x, y, updates: cellUpdates }) => {
    const row = newBoard[y];
    if (row) {
      const cell = row[x];
      if (cell) {
        row[x] = { ...cell, ...cellUpdates };
      }
    }
  });
  return newBoard;
}
