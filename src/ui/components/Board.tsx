import React from 'react';
import { BALL_SIZE, type BallColor } from '../../utils/constants';
import { CELL_SIZE, GAP } from '../../utils/boardConstants';
import type { Cell } from '../../game/types';

// Ball color hex values for inline styles
const BALL_COLOR_HEX: Record<BallColor, string> = {
  red: '#e74c3c',
  green: '#27ae60',
  blue: '#2980b9',
  yellow: '#f1c40f',
  purple: '#8e44ad',
  cyan: '#1abc9c',
  black: '#222',
};

interface BoardProps {
  board: Cell[][];
  onCellClick: (x: number, y: number) => void;
  children?: React.ReactNode;
  movingBall?: { color: BallColor; path: [number, number][] } | null;
  poppingBalls?: Set<string>;
  hoveredCell?: { x: number; y: number } | null;
  pathTrail?: [number, number][] | null;
  notReachable?: boolean;
  onCellHover?: (x: number, y: number) => void;
  onCellLeave?: () => void;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, children, movingBall, poppingBalls, hoveredCell, pathTrail, notReachable, onCellHover, onCellLeave }) => {
  // Convert pathTrail to a Set for fast lookup
  const pathSet = pathTrail ? new Set(pathTrail.map(([x, y]) => `${x},${y}`)) : new Set();
  
  // Calculate incoming ball size (50% of cell width)
  const incomingBallSize = CELL_SIZE * 0.5;
  
  return (
    <div
      className="relative grid bg-game-bg-board p-2 rounded-xl shadow-lg mx-auto"
      style={{
        gridTemplateColumns: `repeat(${board[0].length}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${board.length}, ${CELL_SIZE}px)`,
        gap: `${GAP}px`,
        width: 'fit-content',
        height: 'fit-content',
        boxSizing: 'content-box',
      }}
    >
      {board.flat().map((cell) => {
        // Hide the ball in the source cell if a ball is moving
        let hideBall = false;
        if (movingBall && movingBall.path && movingBall.path.length > 0) {
          const [fromX, fromY] = movingBall.path[0];
          if (cell.x === fromX && cell.y === fromY) {
            hideBall = true;
          }
        }
        const key = `${cell.x},${cell.y}`;
        const popping = poppingBalls && poppingBalls.has(key);
        const isHovered = !!(hoveredCell && hoveredCell.x === cell.x && hoveredCell.y === cell.y);
        const inPath = !!pathSet.has(key);
        const showNotReachable = isHovered && !!notReachable && !cell.ball;
        
        // Determine cell background and border classes
        let cellBgClass = 'bg-game-bg-cell-empty';
        let borderClass = 'border-game-border-default';
        
        if (cell.active) {
          cellBgClass = 'bg-game-bg-cell-active';
          borderClass = 'border-game-border-accent';
        } else if (inPath) {
          cellBgClass = 'bg-game-bg-cell-path';
          borderClass = 'border-game-border-path';
        } else if (isHovered) {
          cellBgClass = 'bg-game-bg-cell-hover';
        }
        
        if (showNotReachable) {
          borderClass = 'border-game-border-error';
        }
        
        return (
          <div
            key={key}
            className={`rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200 box-border relative border-2 ${cellBgClass} ${borderClass}`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
            onClick={() => onCellClick(cell.x, cell.y)}
            onMouseEnter={() => onCellHover && onCellHover(cell.x, cell.y)}
            onMouseLeave={() => onCellLeave && onCellLeave()}
            role="button"
            tabIndex={0}
          >
            {cell.ball && !hideBall && (
              <span
                className={`block rounded-full border-2 border-game-border-ball ${cell.active ? 'shadow-[0_0_16px_4px_theme(colors.game.shadow.glow),0_0_0_4px_theme(colors.game.shadow.glow)] border-game-border-accent' : 'shadow-[0_1px_4px_theme(colors.game.shadow.ball)]'} ${popping ? 'z-20' : ''}`}
                style={{
                  width: BALL_SIZE,
                  height: BALL_SIZE,
                  backgroundColor: BALL_COLOR_HEX[cell.ball.color],
                  animation: popping ? 'pop-ball' : 'move-ball',
                }}
                title={cell.ball.color}
              />
            )}
            {!cell.ball && cell.incomingBall && (
              <span
                className="block rounded-full border border-game-border-preview shadow-sm opacity-80"
                style={{
                  width: incomingBallSize,
                  height: incomingBallSize,
                  backgroundColor: BALL_COLOR_HEX[cell.incomingBall.color],
                }}
                title={`Preview: ${cell.incomingBall.color}`}
              />
            )}
            {/* Not reachable cross */}
            {showNotReachable && (
              <span
                className="absolute left-2 top-2 flex items-center justify-center text-game-text-error text-2xl font-extrabold opacity-70"
                style={{
                  width: CELL_SIZE - 16,
                  height: CELL_SIZE - 16,
                  pointerEvents: 'none',
                }}
              >×</span>
            )}
          </div>
        );
      })}
      {children}
    </div>
  );
};

export default Board;
