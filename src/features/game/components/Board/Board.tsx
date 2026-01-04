import React, { useCallback, useMemo } from "react";
import type { Cell } from "../../types";
import type { GrowingBall } from "../../hooks/useGameAnimation";
import { findUnreachableCells } from "../../logic/pathfinding";
import { BoardCell } from "./BoardCell";
import { coordToKey } from "@shared/utils/coordinates";

interface BoardProps {
  board: Cell[][];
  onCellClick: (x: number, y: number) => void;
  children?: React.ReactNode;
  movingBall?: { color: string; path: [number, number][] } | null;
  movingStep?: number;
  poppingBalls?: Set<string>;
  hoveredCell?: { x: number; y: number } | null;
  pathTrail?: [number, number][] | null;
  notReachable?: boolean;
  onCellHover?: (x: number, y: number) => void;
  onCellLeave?: () => void;
  selected?: { x: number; y: number } | null;
  growingBalls?: GrowingBall[];
}

const Board: React.FC<BoardProps> = ({
  board,
  onCellClick,
  children,
  movingBall,
  movingStep = 0,
  poppingBalls,
  hoveredCell,
  pathTrail,
  notReachable,
  onCellHover,
  onCellLeave,
  selected,
  growingBalls = [],
}) => {
  // Memoize flattened board cells for performance
  const boardCells = useMemo(() => board.flat(), [board]);

  // Convert pathTrail to a Set for fast lookup
  const pathSet = useMemo(
    () =>
      pathTrail
        ? new Set(pathTrail.map(([x, y]) => coordToKey({ x, y })))
        : new Set(),
    [pathTrail],
  );

  // Check if any animation is in progress
  const isAnimationInProgress =
    movingBall ||
    (poppingBalls && poppingBalls.size > 0) ||
    (growingBalls && growingBalls.length > 0);

  // Calculate unreachable cells when a ball is selected
  const unreachableCells = useMemo(() => {
    if (!selected || isAnimationInProgress) {
      return new Set<string>();
    }
    const unreachable = findUnreachableCells(board, selected);
    return new Set(unreachable.map(([x, y]) => coordToKey({ x, y })));
  }, [selected, board, isAnimationInProgress]);

  // Handle cell click with animation check
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (isAnimationInProgress) return;
      onCellClick(x, y);
    },
    [isAnimationInProgress, onCellClick],
  );

  // Handle cell hover with animation check
  const handleCellHover = useCallback(
    (x: number, y: number) => {
      if (isAnimationInProgress) return;
      onCellHover?.(x, y);
    },
    [isAnimationInProgress, onCellHover],
  );

  // Handle cell leave with animation check
  const handleCellLeave = useCallback(() => {
    if (isAnimationInProgress) return;
    onCellLeave?.();
  }, [isAnimationInProgress, onCellLeave]);

  return (
    <div
      className={`game-board grid p-board-padding mx-auto w-fit h-fit box-content gap-gap ${
        isAnimationInProgress ? "pointer-events-none" : ""
      }`}
      style={{
        gridTemplateColumns: `repeat(${board[0].length}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${board.length}, minmax(0, 1fr))`,
      }}
    >
      {boardCells.map((cell) => {
        const key = coordToKey(cell);
        const isHovered = !!(
          hoveredCell &&
          hoveredCell.x === cell.x &&
          hoveredCell.y === cell.y
        );
        const inPath = pathSet.has(key);
        const showNotReachable = isHovered && !!notReachable && !cell.ball;
        const isSelected =
          selected && selected.x === cell.x && selected.y === cell.y;
        const isUnreachable = unreachableCells.has(key) && !cell.ball;
        const isPopping = !!(poppingBalls && poppingBalls.has(key));

        return (
          <BoardCell
            key={key}
            cell={cell}
            isSelected={!!isSelected}
            isHovered={isHovered}
            isInPath={inPath}
            isNotReachable={!!(showNotReachable || isUnreachable)}
            isPopping={isPopping}
            growingBalls={growingBalls}
            movingBall={movingBall}
            movingStep={movingStep}
            onClick={() => handleCellClick(cell.x, cell.y)}
            onHover={() => handleCellHover(cell.x, cell.y)}
            onLeave={handleCellLeave}
          />
        );
      })}
      {children}
    </div>
  );
};

// Memoize Board to prevent re-renders when props haven't changed
export default React.memo(Board, (prevProps, nextProps) => {
  // Custom comparison function
  if (prevProps.board !== nextProps.board) return false;
  if (
    prevProps.selected?.x !== nextProps.selected?.x ||
    prevProps.selected?.y !== nextProps.selected?.y
  )
    return false;
  if (
    prevProps.hoveredCell?.x !== nextProps.hoveredCell?.x ||
    prevProps.hoveredCell?.y !== nextProps.hoveredCell?.y
  )
    return false;
  if (prevProps.pathTrail !== nextProps.pathTrail) return false;
  if (prevProps.notReachable !== nextProps.notReachable) return false;
  if (prevProps.movingBall !== nextProps.movingBall) return false;
  if (prevProps.movingStep !== nextProps.movingStep) return false;
  if (prevProps.poppingBalls !== nextProps.poppingBalls) return false;
  if (prevProps.growingBalls?.length !== nextProps.growingBalls?.length)
    return false;
  if (prevProps.onCellClick !== nextProps.onCellClick) return false;
  if (prevProps.onCellHover !== nextProps.onCellHover) return false;
  if (prevProps.onCellLeave !== nextProps.onCellLeave) return false;
  return true;
});
