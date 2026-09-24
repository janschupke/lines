import React from "react";
import type { CellIndex } from "@/engine";

interface FloatingScoreProps {
  floating: { id: number; at: CellIndex; delta: number };
}

// Positioned as a percentage of the board, so it needs no pixel math and
// works at every viewport. (x + 0.5) / 9 is the cell's centre.
const FloatingScoreComponent: React.FC<FloatingScoreProps> = ({ floating }) => {
  const x = floating.at % 9;
  const y = (floating.at / 9) | 0;
  return (
    <div
      className="absolute pointer-events-none z-board-floating animate-float-score"
      style={{
        left: `${(((x + 0.5) / 9) * 100).toFixed(3)}%`,
        top: `${(((y + 0.5) / 9) * 100).toFixed(3)}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <span className="text-game-text-success font-bold text-4xl drop-shadow-lg">
        +{floating.delta}
      </span>
    </div>
  );
};

export default FloatingScoreComponent;
