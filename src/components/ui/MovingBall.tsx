import React from "react";
import { getBallColor, getGameSizing } from "../../utils/helpers";

interface MovingBallProps {
  color: string;
  left: number;
  top: number;
}

const MovingBall: React.FC<MovingBallProps> = ({ color, left, top }) => {
  const sizing = getGameSizing();
  
  return (
    <div
      className={`absolute game-ball ${sizing.ballSizeClass} z-game-dialog animate-float`}
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
