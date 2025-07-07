import React, { useState } from 'react';
import Board from './Board';
import InfoPanel from './InfoPanel';
import StatusBar from './StatusBar';

// Types for the game
export type BallColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan' | 'black';

export interface Ball {
  color: BallColor;
}

export interface Cell {
  x: number;
  y: number;
  ball: Ball | null;
  active: boolean;
}

const BOARD_SIZE = 9; // Default size from Java code

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => ({
      x,
      y,
      ball: null,
      active: false,
    }))
  );
}

const Game: React.FC = () => {
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard());
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('Game in progress');

  // Placeholder: handle cell click
  const handleCellClick = (x: number, y: number) => {
    setStatus(`Clicked cell (${x}, ${y})`);
    // Game logic will go here
  };

  // Placeholder: start new game
  const startNewGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setStatus('New game started');
  };

  return (
    <div className="game-container">
      <InfoPanel score={score} onNewGame={startNewGame} />
      <Board board={board} onCellClick={handleCellClick} />
      <StatusBar status={status} />
    </div>
  );
};

export default Game; 