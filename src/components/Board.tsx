import React from 'react';
import styled, { css, keyframes } from 'styled-components';
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

const BoardGrid = styled.div<{cols: number; rows: number}>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(${props => props.cols}, ${CELL_SIZE}px);
  grid-template-rows: repeat(${props => props.rows}, ${CELL_SIZE}px);
  gap: ${GAP}px;
  background: #bbb;
  padding: ${PADDING}px;
  border-radius: 12px;
  box-shadow: 0 2px 12px #0002;
  margin: 0 auto;
  box-sizing: content-box;
  width: fit-content;
  height: fit-content;
`;

const CellDiv = styled.div<{$active: boolean; $hovered?: boolean; $inPath?: boolean; $notReachable?: boolean}>`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  background: ${props =>
    props.$active ? '#ffe082' :
    props.$inPath ? '#b3d1ff' :
    props.$hovered ? '#bbb' :
    '#eee'};
  border: 2px solid
    ${props => props.$notReachable ? '#e74c3c' : props.$inPath ? '#1976d2' : '#888'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, border 0.2s;
  box-sizing: border-box;
  position: relative;
`;

const highlightGlow = css`
  box-shadow: 0 0 16px 4px #ffe082, 0 0 0 4px #ffe082;
  border: 2px solid #ffb300;
`;

const moveBall = keyframes`
  0% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const popBall = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  80% {
    transform: scale(1.3);
    opacity: 1;
  }
  100% {
    transform: scale(0.5);
    opacity: 0;
  }
`;

const BallSpan = styled.span<{color: BallColor; $active: boolean; $popping?: boolean}>`
  display: block;
  width: ${BALL_SIZE}px;
  height: ${BALL_SIZE}px;
  border-radius: 50%;
  background: ${props => colorMap[props.color]};
  border: 2px solid #555;
  box-shadow: ${props => props.$active ? '0 0 8px 2px #ffe082' : '0 1px 4px #0003'};
  animation: ${moveBall} 0.25s cubic-bezier(0.4, 0.2, 0.2, 1);
  ${props => props.$active && highlightGlow}
  ${props => props.$popping && css`
    animation: ${popBall} 0.3s cubic-bezier(0.4, 0.2, 0.2, 1);
    z-index: 2;
  `}
`;

const IncomingBallSpan = styled.span<{color: BallColor}>`
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => colorMap[props.color]};
  border: 1px solid #666;
  box-shadow: 0 1px 2px #0002;
  opacity: 0.8;
`;

const Board: React.FC<BoardProps> = ({ board, onCellClick, children, movingBall, poppingBalls, hoveredCell, pathTrail, notReachable, onCellHover, onCellLeave }) => {
  // Convert pathTrail to a Set for fast lookup
  const pathSet = pathTrail ? new Set(pathTrail.map(([x, y]) => `${x},${y}`)) : new Set();
  return (
    <BoardGrid cols={board[0].length} rows={board.length}>
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
        return (
          <CellDiv
            key={key}
            $active={cell.active}
            $hovered={isHovered}
            $inPath={inPath}
            $notReachable={showNotReachable}
            onClick={() => onCellClick(cell.x, cell.y)}
            onMouseEnter={() => onCellHover && onCellHover(cell.x, cell.y)}
            onMouseLeave={() => onCellLeave && onCellLeave()}
            role="button"
            tabIndex={0}
          >
            {cell.ball && !hideBall && (
              <BallSpan color={cell.ball.color} $active={cell.active} $popping={popping} title={cell.ball.color} />
            )}
            {!cell.ball && cell.incomingBall && (
              <IncomingBallSpan color={cell.incomingBall.color} title={`Preview: ${cell.incomingBall.color}`} />
            )}
            {/* Not reachable cross */}
            {showNotReachable && (
              <span style={{
                position: 'absolute',
                left: 8,
                top: 8,
                width: CELL_SIZE - 16,
                height: CELL_SIZE - 16,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e74c3c',
                fontSize: 28,
                fontWeight: 900,
                opacity: 0.7,
              }}>×</span>
            )}
          </CellDiv>
        );
      })}
      {children}
    </BoardGrid>
  );
};

export default Board;
