import React from "react";
import type { CellIndex, ColorName } from "@/engine";
import { getBallColor } from "@/shared/utils";

interface BoardCellProps {
  index: CellIndex;
  ball: ColorName | null;
  ghost: ColorName | null;
  isSelected: boolean;
  isHovered: boolean;
  isInPath: boolean;
  isNotReachable: boolean;
  isPopping: boolean;
  growing: "new" | "transition" | null;
  /** Set when the moving-ball overlay is at this cell. */
  movingColor: ColorName | null;
  /** Set on the move's source cell while the ball travels. */
  hideBall: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}

/**
 * Individual Board Cell Component. The class logic is kept verbatim from the
 * pre-engine implementation — only the inputs changed.
 */
export const BoardCell: React.FC<BoardCellProps> = ({
  index,
  ball,
  ghost,
  isSelected,
  isHovered,
  isInPath,
  isNotReachable,
  isPopping,
  growing,
  movingColor,
  hideBall,
  onClick,
  onHover,
  onLeave,
}) => {
  const showMovingBall = movingColor !== null;

  // Determine cell background and border classes
  let cellBgClass = "bg-game-bg-cell-empty";
  let borderClass = "border-game-border-default";

  if (isSelected) {
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
    cellBgClass,
    borderClass,
  ]
    .filter(Boolean)
    .join(" ");

  // Assertion hooks: tests read state from data-* attributes, never from
  // Tailwind class strings.
  const dataState = isPopping
    ? "popping"
    : isSelected
      ? "selected"
      : isInPath
        ? "path"
        : isNotReachable
          ? "unreachable"
          : undefined;

  const contents = ball
    ? `${ball} ball`
    : ghost
      ? `incoming ${ghost} ball`
      : "empty";

  return (
    <div
      className={cellClasses}
      data-cell={index}
      data-ball={ball && !hideBall ? ball : undefined}
      data-ghost={!ball && ghost ? ghost : undefined}
      data-state={dataState}
      style={{
        gridColumn: `${(index % 9) + 1}`,
        gridRow: `${((index / 9) | 0) + 1}`,
      }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Cell ${(index % 9) + 1}, ${((index / 9) | 0) + 1}: ${contents}`}
    >
      {/* Show moving ball if this cell is the current position, but only if not popping */}
      {showMovingBall && !isPopping && (
        <span
          className="game-ball ball-main animate-move-ball"
          style={{ backgroundColor: getBallColor(movingColor) }}
        />
      )}

      {/* Show regular ball - prioritize showing ball at destination if it should be popped */}
      {ball && !hideBall && (!showMovingBall || isPopping) && (
        <span
          className={`game-ball ${isSelected ? "game-ball-active" : ""} ${
            growing === "transition"
              ? "grow-ball-transition"
              : isPopping
                ? "z-20 animate-pop-ball"
                : ""
          } ball-main`}
          style={{ backgroundColor: getBallColor(ball) }}
        />
      )}

      {/* Preview Ball (incoming) - hide when moving ball is at this cell */}
      {!ball && ghost && !showMovingBall && (
        <span
          className={`game-ball rounded-full border border-game-border-preview shadow-sm opacity-50 ${
            growing === "new" ? "grow-ball-new" : ""
          } ball-ghost`}
          style={{ backgroundColor: getBallColor(ghost) }}
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
