import React from 'react';
import type { Cell, BallColor } from './Game';
import { colorMap } from './colorMap';

export const CELL_SIZE = 56;
export const GAP = 4;
export const PADDING = 8;
export const BALL_SIZE = 40;
export const OFFSET = (CELL_SIZE - BALL_SIZE) / 2;

interface BoardProps {
  board: Cell[][];
  onCellClick: (x: number, y: number) => void;
  children?: React.ReactNode;
  movingBall?: { color: BallColor; path: [number, number][] } | null;
  poppingBalls?: Set<string>;
  hoveredCell?: { x: number, y: number } | null;
  pathTrail?: [number, number][] | null;
  notReachable?: boolean;
  onCellHover?: (x: number, y: number) => void;
  onCellLeave?: () => void;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, children, movingBall, poppingBalls, hoveredCell, pathTrail, notReachable, onCellHover, onCellLeave }) => {
  // Convert pathTrail to a Set for fast lookup
  const pathSet = pathTrail ? new Set(pathTrail.map(([x, y]) => `${x},${y}`)) : new Set();
  return (
    <div
      className="relative grid bg-[#bbb] p-2 rounded-xl shadow-lg mx-auto"
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
        let cellBg = '#eee';
        if (cell.active) cellBg = '#ffe082';
        else if (inPath) cellBg = '#b3d1ff';
        else if (isHovered) cellBg = '#bbb';
        let borderColor = '#888';
        if (showNotReachable) borderColor = '#e74c3c';
        else if (inPath) borderColor = '#1976d2';
        return (
          <div
            key={key}
            className="rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200 box-border relative border-2"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              background: cellBg,
              borderColor: borderColor,
            }}
            onClick={() => onCellClick(cell.x, cell.y)}
            onMouseEnter={() => onCellHover && onCellHover(cell.x, cell.y)}
            onMouseLeave={() => onCellLeave && onCellLeave()}
            role="button"
            tabIndex={0}
          >
            {cell.ball && !hideBall && (
              <span
                className={`block rounded-full border-2 border-[#555] ${cell.active ? 'shadow-[0_0_16px_4px_#ffe082,0_0_0_4px_#ffe082] border-[#ffb300]' : 'shadow-[0_1px_4px_#0003]'} ${popping ? 'z-20' : ''}`}
                style={{
                  width: BALL_SIZE,
                  height: BALL_SIZE,
                  background: colorMap[cell.ball.color],
                  boxShadow: cell.active ? '0 0 8px 2px #ffe082' : '0 1px 4px #0003',
                  animation: popping ? 'popBall 0.3s cubic-bezier(0.4, 0.2, 0.2, 1)' : 'moveBall 0.25s cubic-bezier(0.4, 0.2, 0.2, 1)',
                }}
                title={cell.ball.color}
              />
            )}
            {!cell.ball && cell.incomingBall && (
              <span
                className="block w-5 h-5 rounded-full border border-[#666] shadow-sm opacity-80"
                style={{ background: colorMap[cell.incomingBall.color] }}
                title={`Preview: ${cell.incomingBall.color}`}
              />
            )}
            {/* Not reachable cross */}
            {showNotReachable && (
              <span
                className="absolute left-2 top-2 flex items-center justify-center text-[#e74c3c] text-2xl font-extrabold opacity-70"
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
      <style>{`
        @keyframes moveBall {
          0% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes popBall {
          0% { transform: scale(1); opacity: 1; }
          80% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Board;
