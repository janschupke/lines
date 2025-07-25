import React from "react";
import { getBallColor } from "../../utils/helpers";

interface MovingBallProps {
  color: string;
  left: number;
  top: number;
}

const MovingBall: React.FC<MovingBallProps> = ({ color, left, top }) => {
  return (
    <div
      className={`absolute game-ball w-ball h-ball z-game-dialog animate-float`}
      style={{
        left,
        top,
        pointerEvents: "none",
        backgroundColor: getBallColor(color)
      }}
    />
  );
};

export default MovingBall;
