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
    <div className="info-panel">
      <span>Score: {score}</span>
      <button onClick={onNewGame} style={{ marginLeft: 16 }}>New Game</button>
      <span style={{ marginLeft: 24 }}>Next balls: </span>
      {nextBalls.map((color, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: colorMap[color],
            margin: '0 4px',
            border: '1px solid #888',
            verticalAlign: 'middle',
          }}
          title={color}
        />
      ))}
    </div>
  );
};

export default InfoPanel;
