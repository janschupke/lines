import React from 'react';

interface InfoPanelProps {
  score: number;
  onNewGame: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ score, onNewGame }) => {
  return (
    <div className="info-panel">
      <span>Score: {score}</span>
      <button onClick={onNewGame} style={{ marginLeft: 16 }}>New Game</button>
    </div>
  );
};

export default InfoPanel;
