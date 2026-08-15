import React from "react";
import type { FloatingScore } from "@/features/game/hooks/useGameAnimation";

interface FloatingScoreProps {
  floatingScore: FloatingScore;
}

// Positioned as a percentage of the board, so it needs no pixel math and
// works at every viewport. (x + 0.5) / 9 is the cell's centre.
const FloatingScoreComponent: React.FC<FloatingScoreProps> = ({
  floatingScore,
}) => {
  return (
    <div
      className="absolute pointer-events-none z-50 animate-float-score"
      style={{
        left: `${(((floatingScore.x + 0.5) / 9) * 100).toFixed(3)}%`,
        top: `${(((floatingScore.y + 0.5) / 9) * 100).toFixed(3)}%`,
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
