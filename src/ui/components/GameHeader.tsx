import React from 'react';
import NextBallsPreview from './NextBallsPreview';
import { type BallColor } from '../../game/constants';

interface GameHeaderProps {
  score: number;
  currentHighScore: number;
  nextBalls: BallColor[];
  onNewGame: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ score, currentHighScore, nextBalls, onNewGame }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <div className="text-2xl font-bold text-game-text-accent">Score: {score}</div>
          <div className="text-sm text-game-text-secondary">High Score: {currentHighScore}</div>
        </div>
        
        <button
          onClick={onNewGame}
          className="bg-game-button-primary hover:bg-game-button-hover text-game-text-primary font-semibold px-4 py-2 rounded-lg border border-game-border-default cursor-pointer transition-colors"
        >
          New Game
        </button>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm text-game-text-secondary font-semibold">Next Balls:</div>
        <NextBallsPreview nextBalls={nextBalls} />
      </div>
    </div>
  );
};

export default GameHeader; 
