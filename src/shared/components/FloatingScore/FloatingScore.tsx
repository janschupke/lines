import React from "react";
import { getGameSizing } from "@shared/utils/helpers";
import type { FloatingScore } from "@features/game/hooks/useGameAnimation";

interface FloatingScoreProps {
  floatingScore: FloatingScore;
}

const FloatingScoreComponent: React.FC<FloatingScoreProps> = ({
  floatingScore,
}) => {
  const sizing = getGameSizing();
  const { left, top } = sizing.getCellPosition(
    floatingScore.x,
    floatingScore.y,
  );

  return (
    <div
      className="absolute pointer-events-none z-50 animate-float-score"
      style={{
        left: left + sizing.cellSize / 2,
        top: top + sizing.cellSize / 2,
        transform: "translate(-50%, -50%)",
      }}
    >
      <span className="text-game-text-success font-bold text-4xl drop-shadow-lg">
        +{floatingScore.score}
      </span>
    </div>
  );
};

export default FloatingScoreComponent;
