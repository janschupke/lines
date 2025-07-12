import React from 'react';
import { type BallColor } from '../../utils/constants';
import NextBallsPreview from './NextBallsPreview';

interface GameHeaderProps {
  score: number;
  currentHighScore: number;
  nextBalls: BallColor[];
  onNewGame: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ 
  score, 
  currentHighScore, 
  nextBalls, 
  onNewGame 
}) => {
  return (
    <div className="flex flex-row items-center justify-between">
      <button 
        onClick={onNewGame} 
        className="font-semibold text-lg px-4 py-2 rounded-lg border-none bg-[#444] text-white cursor-pointer hover:bg-[#555] transition-colors"
      >
        New Game
      </button>
      <div className="flex-1 flex justify-center items-center">
        <NextBallsPreview nextBalls={nextBalls} />
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-bold text-2xl text-[#ffe082]">Score: {score}</span>
        <span className="text-sm text-[#ccc]">Best: {currentHighScore}</span>
      </div>
    </div>
  );
};

export default GameHeader; 
