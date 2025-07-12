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
        className="font-semibold text-lg px-4 py-2 rounded-lg border-none bg-game-button-primary text-game-text-primary cursor-pointer hover:bg-game-button-hover transition-colors"
      >
        New Game
      </button>
      <div className="flex-1 flex justify-center items-center">
        <NextBallsPreview nextBalls={nextBalls} />
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-bold text-2xl text-game-text-accent">Score: {score}</span>
        <span className="text-sm text-game-text-secondary">Best: {currentHighScore}</span>
      </div>
    </div>
  );
};

export default GameHeader; 
