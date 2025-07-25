import React, { useCallback } from "react";
import type { Cell } from "../../game/types";

interface BoardProps {
  board: Cell[][];
  onCellClick: (x: number, y: number) => void;
  children?: React.ReactNode;
  movingBall?: { color: string; path: [number, number][] } | null;
  poppingBalls?: Set<string>;
  hoveredCell?: { x: number; y: number } | null;
  pathTrail?: [number, number][] | null;
  notReachable?: boolean;
  onCellHover?: (x: number, y: number) => void;
  onCellLeave?: () => void;
}

const Board: React.FC<BoardProps> = ({
  board,
  onCellClick,
  children,
  movingBall,
  poppingBalls,
  hoveredCell,
  pathTrail,
  notReachable,
  onCellHover,
  onCellLeave,
}) => {


  // Convert pathTrail to a Set for fast lookup
  const pathSet = pathTrail
    ? new Set(pathTrail.map(([x, y]) => `${x},${y}`))
    : new Set();

  // Calculate incoming ball size (50% of cell width)
  const incomingBallSize = "w-[28px] h-[28px]";

  // Check if any animation is in progress
  const isAnimationInProgress =
    movingBall || (poppingBalls && poppingBalls.size > 0);

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
      className={`relative grid bg-game-bg-board p-board-padding rounded-xl shadow-lg mx-auto w-fit h-fit box-content gap-gap ${
        isAnimationInProgress ? "pointer-events-none" : ""
      }`}
      style={{
        gridTemplateColumns: `repeat(${board[0].length}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${board.length}, minmax(0, 1fr))`,
      }}
    >
      {board.flat().map((cell) => {
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

        // Determine cell background and border classes
        let cellBgClass = "bg-game-bg-cell-empty";
        let borderClass = "border-game-border-default";

        if (cell.active) {
          cellBgClass = "bg-game-bg-cell-active";
          borderClass = "border-game-border-accent";
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
            className={`rounded-lg flex items-center justify-center transition-colors duration-200 box-border relative border-2 ${
              isAnimationInProgress ? "cursor-default" : "cursor-pointer"
            } ${cellBgClass} ${borderClass} w-cell h-cell`}
            onClick={() => handleCellClick(cell.x, cell.y)}
            onMouseEnter={() => handleCellHover(cell.x, cell.y)}
            onMouseLeave={handleCellLeave}
            role="button"
            tabIndex={isAnimationInProgress ? -1 : 0}
          >
            {cell.ball && !hideBall && (
              <span
                className={`block rounded-full border-2 border-game-border-ball ${
                  cell.active
                    ? "shadow-[0_0_16px_4px_theme(colors.game.shadow.glow),0_0_0_4px_theme(colors.game.shadow.glow)] border-game-border-accent"
                    : "shadow-[0_1px_4px_theme(colors.game.shadow.ball)]"
                } ${popping ? "z-20 animate-pop-ball" : "animate-move-ball"} bg-ball-${cell.ball.color} w-ball h-ball`}
                title={cell.ball.color}
              />
            )}
            {!cell.ball && cell.incomingBall && (
              <span
                className={`block rounded-full border border-game-border-preview shadow-sm opacity-50 bg-ball-${cell.incomingBall.color} ${incomingBallSize}`}
                title={`Preview: ${cell.incomingBall.color}`}
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
