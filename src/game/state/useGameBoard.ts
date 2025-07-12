import { useState, useCallback } from 'react';
import { getRandomNextBalls, createEmptyBoard, placeRealBalls, placePreviewBalls } from '../logic';
import type { Cell, BallColor } from '../types';
import { BALLS_PER_TURN } from '../constants';

export const useGameBoard = (initialBoard?: Cell[][], initialNextBalls?: BallColor[]) => {
  const [board, setBoard] = useState<Cell[][]>(() => {
    if (initialBoard && initialNextBalls) {
      return placePreviewBalls(initialBoard, initialNextBalls);
    }
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(BALLS_PER_TURN);
    const boardWithRealBalls = placeRealBalls(board, initialBalls);
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    return placePreviewBalls(boardWithRealBalls, initialNext);
  });
  const [selected, setSelected] = useState<{x: number, y: number} | null>(null);
  const [nextBalls, setNextBalls] = useState<BallColor[]>(() => getRandomNextBalls(BALLS_PER_TURN));

  const handleCellClick = useCallback((x: number, y: number) => {
    const cell = board[y][x];
    if (cell.ball) {
      setSelected({ x, y });
      setBoard(prev => prev.map((row, yy) => row.map((c, xx) => ({
        ...c,
        active: xx === x && yy === y
      }))));
    }
    // (Moving logic is handled in orchestrator)
  }, [board]);
  const handleCellHover = useCallback(() => {}, []);
  const handleCellLeave = useCallback(() => {}, []);

  return {
    board,
    setBoard,
    selected,
    setSelected,
    nextBalls,
    setNextBalls,
    handleCellClick,
    handleCellHover,
    handleCellLeave,
  };
}; 
