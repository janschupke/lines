import React from 'react';

interface MovingBallProps {
  color: string;
  left: number;
  top: number;
}

const MovingBall: React.FC<MovingBallProps> = ({ color, left, top }) => {
  return (
    <div
      className={`absolute rounded-full border-2 border-game-border-ball shadow-[0_1px_4px_theme(colors.game.shadow.ball)] bg-${color} z-10`}
      style={{
        width: 40,
        height: 40,
        left,
        top,
        pointerEvents: 'none',
      }}
    />
  );
};

export default MovingBall; 
