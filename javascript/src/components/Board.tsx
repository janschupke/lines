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

const CellDiv = styled.div<{active: boolean}>`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  background: ${props => props.active ? '#ffe082' : '#eee'};
  border: 2px solid #888;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  box-sizing: border-box;
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

const BallSpan = styled.span<{color: BallColor; active: boolean}>`
  display: block;
  width: ${BALL_SIZE}px;
  height: ${BALL_SIZE}px;
  border-radius: 50%;
  background: ${props => colorMap[props.color]};
  border: 2px solid #555;
  box-shadow: ${props => props.active ? '0 0 8px 2px #ffe082' : '0 1px 4px #0003'};
  animation: ${moveBall} 0.25s cubic-bezier(0.4, 0.2, 0.2, 1);
  ${props => props.active && highlightGlow}
`;

const Board: React.FC<BoardProps> = ({ board, onCellClick, children, movingBall }) => {
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
        return (
          <CellDiv
            key={`${cell.x},${cell.y}`}
            active={cell.active}
            onClick={() => onCellClick(cell.x, cell.y)}
          >
            {cell.ball && !hideBall && (
              <BallSpan color={cell.ball.color} active={cell.active} title={cell.ball.color} />
            )}
          </CellDiv>
        );
      })}
      {children}
    </BoardGrid>
  );
};

export default Board;
