import { useState } from "react";
import {
  getRandomNextBalls,
  createEmptyBoard,
  placeRealBalls,
  placePreviewBalls,
} from "../game/logic";
import type { Cell, BallColor } from "../game/types";
import { INITIAL_BALLS, BALLS_PER_TURN } from "../game/constants";

export const useGameBoard = (
  initialBoard?: Cell[][],
  initialNextBalls?: BallColor[],
) => {
  const [board, setBoard] = useState<Cell[][]>(() => {
    if (initialBoard && initialNextBalls) {
      return placePreviewBalls(initialBoard, initialNextBalls);
    }
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(INITIAL_BALLS);
    const boardWithRealBalls = placeRealBalls(board, initialBalls);
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    return placePreviewBalls(boardWithRealBalls, initialNext);
  });
  const [nextBalls, setNextBalls] = useState<BallColor[]>(() =>
    getRandomNextBalls(BALLS_PER_TURN),
  );

  return {
    board,
    setBoard,
    nextBalls,
    setNextBalls,
  };
};
