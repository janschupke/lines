import React from "react";
import type { BallColor } from "../../game/constants";

interface NextBallsPreviewProps {
  nextBalls: BallColor[];
}

const NextBallsPreview: React.FC<NextBallsPreviewProps> = ({ nextBalls }) => {
  return (
    <div className="flex justify-center items-center gap-3">
      {nextBalls.map((color, i) => (
        <span
          key={i}
          className={`block w-ball h-ball rounded-full border-2 border-game-border-default text-center align-middle bg-ball-${color}`}
          title={color}
        />
      ))}
    </div>
  );
};

export default NextBallsPreview;
