import { useCallback } from "react";
import type { Cell, BallColor } from "../types";
import { findPath, validateMove } from "../logic";

export interface CellInteractionState {
  selected: { x: number; y: number } | null;
  hoveredCell: { x: number; y: number } | null;
  pathTrail: [number, number][] | null;
  notReachable: boolean;
}

export interface CellInteractionActions {
  setSelected: (selected: { x: number; y: number } | null) => void;
  setHoveredCell: (hoveredCell: { x: number; y: number } | null) => void;
  setPathTrail: (pathTrail: [number, number][] | null) => void;
  setNotReachable: (notReachable: boolean) => void;
  clearPathPreview: () => void;
}

export interface CellInteractionHandlers {
  handleCellClick: (x: number, y: number) => void;
  handleCellHover: (x: number, y: number) => void;
  handleCellLeave: () => void;
}

export const useCellInteraction = (
  board: Cell[][],
  gameOver: boolean,
  isAnimating: boolean,
  selected: { x: number; y: number } | null,
  actions: CellInteractionActions,
  onStartMove: (color: BallColor, path: [number, number][]) => void,
): CellInteractionHandlers => {
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (gameOver || isAnimating) return;
      const cell = board[y][x];
      
      if (cell.ball) {
        // Clicked on a ball - select it
        actions.setSelected({ x, y });
        actions.setPathTrail(null);
        actions.setNotReachable(false);
      } else if (selected) {
        // Clicked on empty cell with a ball selected - try to move
        // Validate move
        if (!validateMove(board, selected.x, selected.y, x, y)) {
          actions.setNotReachable(true);
          return;
        }
        // Find path
        const path = findPath(board, selected, { x, y });
        if (path && path.length > 1) {
          // Start move animation
          onStartMove(board[selected.y][selected.x].ball!.color, path);
          actions.setPathTrail(null);
          actions.setNotReachable(false);
          actions.setSelected(null);
        }
      }
      // Clicked on empty cell without a ball selected - do nothing
    },
    [gameOver, isAnimating, board, selected, actions, onStartMove],
  );

  const handleCellHover = useCallback(
    (x: number, y: number) => {
      if (gameOver || isAnimating || !selected) return;
      const cell = board[y][x];
      if (!cell.ball && selected) {
        const path = findPath(board, selected, { x, y });
        if (path && path.length > 1) {
          actions.setPathTrail(path);
          actions.setNotReachable(false);
        } else {
          actions.setPathTrail(null);
          actions.setNotReachable(true);
        }
      }
      actions.setHoveredCell({ x, y });
    },
    [gameOver, isAnimating, board, selected, actions],
  );

  const handleCellLeave = useCallback(() => {
    actions.setHoveredCell(null);
    actions.setPathTrail(null);
    actions.setNotReachable(false);
  }, [actions]);

  return {
    handleCellClick,
    handleCellHover,
    handleCellLeave,
  };
}; 
