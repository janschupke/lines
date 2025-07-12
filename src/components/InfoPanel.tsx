import React from 'react';
import type { BallColor } from './Game';

interface InfoPanelProps {
  score: number;
  onNewGame: () => void;
  nextBalls: BallColor[];
}

const colorMap: Record<BallColor, string> = {
  red: '#e74c3c',
  green: '#27ae60',
  blue: '#2980b9',
  yellow: '#f1c40f',
  purple: '#8e44ad',
  cyan: '#1abc9c',
  black: '#222',
};

const InfoPanel: React.FC<InfoPanelProps> = ({ score, onNewGame, nextBalls }) => {
  return (
    <div className="flex items-center space-x-6 p-4 bg-[#23272f] rounded-lg shadow-lg border border-[#444]">
      <span className="text-white font-semibold text-lg">Score: {score}</span>
      <button 
        onClick={onNewGame} 
        className="px-4 py-2 rounded-lg bg-[#444] text-white hover:bg-[#555] font-semibold transition-colors shadow-md"
      >
        New Game
      </button>
      <span className="text-white font-medium">Next balls: </span>
      {nextBalls.map((color, i) => (
        <span
          key={i}
          className="inline-block w-5 h-5 rounded-full border border-[#888] align-middle ml-1 shadow-sm"
          style={{ background: colorMap[color] }}
          title={color}
        />
      ))}
    </div>
  );
};

export default InfoPanel;
