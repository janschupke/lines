import React from 'react';
import type { Cell } from './Game';

interface BoardProps {
  board: Cell[][];
  onCellClick: (x: number, y: number) => void;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick }) => {
  return (
    <div className="board">
      {board.map((row, y) => (
        <div className="board-row" key={y}>
          {row.map((cell, x) => (
            <div
              className={`cell${cell.active ? ' active' : ''}`}
              key={x}
              onClick={() => onCellClick(x, y)}
              style={{ display: 'inline-block', width: 32, height: 32, border: '1px solid #ccc', textAlign: 'center', lineHeight: '32px', cursor: 'pointer' }}
            >
              {cell.ball ? cell.ball.color[0].toUpperCase() : ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
