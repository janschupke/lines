import React from 'react';
import { BALL_SIZE, ANIMATION_DURATIONS } from '../../utils/constants';

interface MovingBallProps {
  color: string;
  left: number;
  top: number;
}

const MovingBall: React.FC<MovingBallProps> = ({ color, left, top }) => (
  <div
    className="absolute rounded-full border-2 border-game-border-ball z-10 pointer-events-none shadow-[0_0_8px_2px_theme(colors.game.shadow.glow)]"
    style={{
      width: BALL_SIZE,
      height: BALL_SIZE,
      background: color,
      left,
      top,
      transition: `left ${ANIMATION_DURATIONS.MOVE_BALL}ms linear, top ${ANIMATION_DURATIONS.MOVE_BALL}ms linear`,
    }}
  />
);

export default MovingBall; 
