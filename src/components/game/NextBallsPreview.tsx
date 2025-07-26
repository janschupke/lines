import React from "react";
import type { BallColor } from "../../game/types";
import { getBallColor, getGameSizing } from "../../utils/helpers";

interface NextBallsPreviewProps {
  nextBalls: BallColor[];
}

const NextBallsPreview: React.FC<NextBallsPreviewProps> = ({ nextBalls }) => {
  const sizing = getGameSizing();
  
  return (
    <div className="flex justify-center items-center gap-3">
      {nextBalls.map((color, i) => (
        <span
          key={i}
          className={`block ${sizing.ballSizeClass} rounded-full border-2 border-game-border-default text-center align-middle`}
          style={{ backgroundColor: getBallColor(color) }}
        />
      ))}
    </div>
  );
};

export default NextBallsPreview;
