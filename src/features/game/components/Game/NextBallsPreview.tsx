import React from "react";
import type { BallColor } from "../../types";
import { getBallColor } from "@shared/utils/helpers";

interface NextBallsPreviewProps {
  nextBalls: BallColor[];
}

/**
 * Next Balls Preview Component
 * Displays the upcoming balls that will be placed
 */
const NextBallsPreview: React.FC<NextBallsPreviewProps> = ({
  nextBalls,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-game-text-secondary text-sm">Next:</span>
      <div className="flex gap-1">
        {nextBalls.map((color, index) => (
          <div
            key={index}
            className="w-6 h-6 rounded-full border-2 border-game-border"
            style={{ backgroundColor: getBallColor(color) }}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(NextBallsPreview);
