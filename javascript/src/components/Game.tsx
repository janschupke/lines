import React from 'react';
import Board from './Board';
import InfoPanel from './InfoPanel';
import StatusBar from './StatusBar';

const Game: React.FC = () => {
  // Game state and logic will go here

  return (
    <div className="game-container">
      <InfoPanel />
      <Board />
      <StatusBar />
    </div>
  );
};

export default Game; 