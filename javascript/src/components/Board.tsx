import React from 'react';
import type { Cell, BallColor } from './Game';

interface BoardProps {
  board: Cell[][];
  onCellClick: (x: number, y: number) => void;
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

const CELL_SIZE = 56;

const Board: React.FC<BoardProps> = ({ board, onCellClick }) => {
  return (
    <div
      className="board"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${board[0].length}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${board.length}, ${CELL_SIZE}px)`,
        gap: 4,
        background: '#bbb',
        padding: 8,
        borderRadius: 12,
        boxShadow: '0 2px 12px #0002',
        margin: '0 auto',
        boxSizing: 'content-box',
      }}
    >
      {board.flat().map((cell) => (
        <div
          key={`${cell.x},${cell.y}`}
          className={`cell${cell.active ? ' active' : ''}`}
          onClick={() => onCellClick(cell.x, cell.y)}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            background: cell.active ? '#ffe082' : '#eee',
            border: '2px solid #888',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxSizing: 'border-box',
          }}
        >
          {cell.ball && (
            <span
              style={{
                display: 'block',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: colorMap[cell.ball.color],
                border: '2px solid #555',
                boxShadow: cell.active ? '0 0 8px 2px #ffe082' : '0 1px 4px #0003',
              }}
              title={cell.ball.color}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Board;
