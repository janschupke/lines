import React from 'react';
import { COLOR_MAP, type BallColor } from '../../utils/constants';

interface NextBallsPreviewProps {
  nextBalls: BallColor[];
}

const NextBallsPreview: React.FC<NextBallsPreviewProps> = ({ nextBalls }) => {
  return (
    <div className="flex justify-center items-center gap-3">
      {nextBalls.map((color, i) => (
        <span
          key={i}
          className={`block w-8 h-8 rounded-full border-2 border-game-border-default text-center align-middle bg-${COLOR_MAP[color]}`}
          title={color}
        />
      ))}
    </div>
  );
};

export default NextBallsPreview; 
