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
          className="block w-8 h-8 rounded-full border-2 border-[#888] text-center align-middle"
          style={{
            background: COLOR_MAP[color],
            margin: '0 4px',
          }}
          title={color}
        />
      ))}
    </div>
  );
};

export default NextBallsPreview; 
