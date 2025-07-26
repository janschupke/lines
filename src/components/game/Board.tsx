import React, { useCallback } from "react";
import type { Cell } from "../../game/types";
import type { GrowingBall } from "../../hooks/useGameAnimation";
import { getBallColor, getGameSizing } from "../../utils/helpers";

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
  // Get unified sizing
  const sizing = getGameSizing();

  // Convert pathTrail to a Set for fast lookup
  const pathSet = pathTrail
    ? new Set(pathTrail.map(([x, y]) => `${x},${y}`))
    : new Set();

  // Check if any animation is in progress
  const isAnimationInProgress =
    movingBall ||
    (poppingBalls && poppingBalls.size > 0) ||
    (growingBalls && growingBalls.length > 0);

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
      {board.flat().map((cell) => {
        // Check if this cell should show the moving ball
        let showMovingBall = false;
        let movingBallColor: string | null = null;
        
        if (movingBall && movingBall.path && movingBall.path.length > 0) {
          // Show the ball at the current step position
          if (movingStep >= 0 && movingStep < movingBall.path.length) {
            const [mx, my] = movingBall.path[movingStep];
            if (cell.x === mx && cell.y === my) {
              showMovingBall = true;
              movingBallColor = movingBall.color;
            }
          }
        }

        // Hide the ball in the source cell if a ball is moving
        let hideBall = false;
        if (movingBall && movingBall.path && movingBall.path.length > 0) {
          const [fromX, fromY] = movingBall.path[0];
          if (cell.x === fromX && cell.y === fromY) {
            hideBall = true;
          }
        }
        
        const key = `${cell.x},${cell.y}`;
        const popping = poppingBalls && poppingBalls.has(key);
        const isHovered = !!(
          hoveredCell &&
          hoveredCell.x === cell.x &&
          hoveredCell.y === cell.y
        );
        const inPath = !!pathSet.has(key);
        const showNotReachable = isHovered && !!notReachable && !cell.ball;
        const isSelected =
          selected && selected.x === cell.x && selected.y === cell.y;

        // Determine cell background and border classes
        let cellBgClass = "bg-game-bg-cell-empty";
        let borderClass = "border-game-border-default";

        if (cell.active || isSelected) {
          cellBgClass = "bg-game-bg-cell-hover";
          // No special border for selected cells
        } else if (inPath) {
          cellBgClass = "bg-game-bg-cell-path";
          borderClass = "border-game-border-path";
        } else if (isHovered) {
          cellBgClass = "bg-game-bg-cell-hover";
        }

        if (showNotReachable) {
          borderClass = "border-game-border-error";
        }

        // Disable hover effects during animations
        const shouldShowHoverEffects = !isAnimationInProgress;

        return (
          <div
            key={key}
            className={`game-cell ${
              isAnimationInProgress
                ? "cursor-default"
                : !cell.ball && !selected
                  ? "cursor-default"
                  : "cursor-pointer"
            } ${cellBgClass} ${borderClass} ${sizing.cellSizeClass}`}
            onClick={() => handleCellClick(cell.x, cell.y)}
            onMouseEnter={() => handleCellHover(cell.x, cell.y)}
            onMouseLeave={handleCellLeave}
            role="button"
          >
            {/* Show moving ball if this cell is the current position */}
            {showMovingBall && movingBallColor && (
              <span
                className={`game-ball animate-move-ball ${sizing.ballSizeClass}`}
                style={{ backgroundColor: getBallColor(movingBallColor) }}
              />
            )}
            
            {/* Show regular ball if not moving and not hidden */}
            {cell.ball && !hideBall && !showMovingBall && (
              <span
                className={`game-ball ${
                  cell.active || isSelected
                    ? "game-ball-active"
                    : "animate-move-ball"
                } ${
                  growingBalls.find(
                    (gb) =>
                      gb.x === cell.x && gb.y === cell.y && gb.isTransitioning,
                  )
                    ? "grow-ball-transition"
                    : popping
                      ? "z-20 animate-pop-ball"
                      : ""
                } ${sizing.ballSizeClass}`}
                style={{ backgroundColor: getBallColor(cell.ball.color) }}
              />
            )}
            {!cell.ball && cell.incomingBall && (
              <span
                className={`game-ball rounded-full border border-game-border-preview shadow-sm opacity-50 ${
                  growingBalls.find(
                    (gb) =>
                      gb.x === cell.x && gb.y === cell.y && !gb.isTransitioning,
                  )
                    ? "grow-ball-new"
                    : ""
                } ${sizing.incomingBallSizeClass}`}
                style={{
                  backgroundColor: getBallColor(cell.incomingBall.color),
                }}
              />
            )}
            {/* Not reachable cross */}
            {showNotReachable && shouldShowHoverEffects && (
              <span className="absolute left-2 top-2 flex items-center justify-center text-game-text-error text-2xl font-extrabold opacity-70 w-[40px] h-[40px] pointer-events-none">
                ×
              </span>
            )}
          </div>
        );
      })}
      {children}
    </div>
  );
};

export default Board;
