import React from "react";
import type { Cell } from "../../types";
import type { GrowingBall } from "../../hooks/useGameAnimation";
import { getBallColor, getGameSizing } from "@shared/utils";

interface BoardCellProps {
  cell: Cell;
  isSelected: boolean;
  isHovered: boolean;
  isInPath: boolean;
  isNotReachable: boolean;
  isPopping: boolean;
  growingBalls: GrowingBall[];
  movingBall?: { color: string; path: [number, number][] } | null;
  movingStep?: number;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}

/**
 * Individual Board Cell Component
 * Renders a single cell with ball, preview ball, and interaction states
 */
export const BoardCell: React.FC<BoardCellProps> = ({
  cell,
  isSelected,
  isHovered,
  isInPath,
  isNotReachable,
  isPopping,
  growingBalls,
  movingBall,
  movingStep = 0,
  onClick,
  onHover,
  onLeave,
}) => {
  const sizing = getGameSizing();
  const growingBall = growingBalls.find(
    (gb) => gb.x === cell.x && gb.y === cell.y,
  );

  // Check if this cell should show the moving ball
  let showMovingBall = false;
  let movingBallColor: string | null = null;
  if (movingBall && movingBall.path && movingBall.path.length > 0) {
    if (movingStep >= 0 && movingStep < movingBall.path.length) {
      const [mx, my] = movingBall.path[movingStep];
      if (cell.x === mx && cell.y === my) {
        showMovingBall = true;
        movingBallColor = movingBall.color;
      }
    }
  }

  // Hide the ball in the source cell if a ball is moving
  const hideBall =
    movingBall &&
    movingBall.path &&
    movingBall.path.length > 0 &&
    cell.x === movingBall.path[0][0] &&
    cell.y === movingBall.path[0][1];

  // Determine cell background and border classes
  let cellBgClass = "bg-game-bg-cell-empty";
  let borderClass = "border-game-border-default";

  if (cell.active || isSelected) {
    cellBgClass = "bg-game-bg-cell-hover";
  } else if (isInPath) {
    cellBgClass = "bg-game-bg-cell-path";
    borderClass = "border-game-border-path";
  } else if (isHovered) {
    cellBgClass = "bg-game-bg-cell-hover";
  } else if (isNotReachable) {
    cellBgClass = "bg-game-bg-cell-unreachable";
  }

  if (isNotReachable && isHovered) {
    borderClass = "border-game-border-error";
  }

  const cellClasses = [
    "game-cell relative flex items-center justify-center",
    sizing.cellSizeClass,
    cellBgClass,
    borderClass,
    isPopping ? "animate-pop" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cellClasses}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      role="button"
      tabIndex={0}
      aria-label={`Cell at position ${cell.x}, ${cell.y}`}
    >
      {/* Show moving ball if this cell is the current position, but only if not popping */}
      {showMovingBall && movingBallColor && !isPopping && (
        <span
          className={`game-ball animate-move-ball ${sizing.ballSizeClass}`}
          style={{ backgroundColor: getBallColor(movingBallColor) }}
        />
      )}

      {/* Show regular ball - prioritize showing ball at destination if it should be popped */}
      {/* If isPopping, always show the regular ball (even if moving ball was active) */}
      {cell.ball && !hideBall && (!showMovingBall || isPopping) && (
        <span
          className={`game-ball ${
            cell.active || isSelected ? "game-ball-active" : ""
          } ${
            growingBall && growingBall.isTransitioning
              ? "grow-ball-transition"
              : isPopping
                ? "z-20 animate-pop-ball"
                : ""
          } ${sizing.ballSizeClass}`}
          style={{ backgroundColor: getBallColor(cell.ball.color) }}
        />
      )}

      {/* Preview Ball (incoming) */}
      {!cell.ball && cell.incomingBall && (
        <span
          className={`game-ball rounded-full border border-game-border-preview shadow-sm opacity-50 ${
            growingBall && !growingBall.isTransitioning ? "grow-ball-new" : ""
          } ${sizing.incomingBallSizeClass}`}
          style={{
            backgroundColor: getBallColor(cell.incomingBall.color),
          }}
        />
      )}

      {/* Not reachable cross */}
      {isNotReachable && isHovered && (
        <span className="absolute inset-0 flex items-center justify-center text-game-text-error text-4xl font-black opacity-80 pointer-events-none">
          ×
        </span>
      )}
    </div>
  );
};

export default React.memo(BoardCell);
