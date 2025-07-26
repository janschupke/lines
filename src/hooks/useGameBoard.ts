import { useState } from "react";
import {
  getRandomNextBalls,
  createEmptyBoard,
  placeRealBalls,
  placePreviewBalls,
} from "../game/logic";
import type { Cell, BallColor } from "../game/types";
import { INITIAL_BALLS, BALLS_PER_TURN } from "../game/config";

export const useGameBoard = (
  initialBoard?: Cell[][],
  initialNextBalls?: BallColor[],
) => {
  const [nextBalls, setNextBalls] = useState<BallColor[]>(() =>
    initialNextBalls ? initialNextBalls : getRandomNextBalls(BALLS_PER_TURN),
  );
  const [board, setBoard] = useState<Cell[][]>(() => {
    if (initialBoard && initialNextBalls) {
      return placePreviewBalls(initialBoard, initialNextBalls);
    }
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(INITIAL_BALLS);
    const boardWithRealBalls = placeRealBalls(board, initialBalls);
    return placePreviewBalls(boardWithRealBalls, nextBalls);
  });

  // Update nextBalls and board - preserves existing incoming balls when stepping on one
  const setNextBallsAndBoard = (newNextBalls: BallColor[], baseBoard?: Cell[][]) => {
    setNextBalls(newNextBalls);
    // If baseBoard is provided, use it directly (preserves existing incoming balls)
    // Otherwise, apply placePreviewBalls to replace all incoming balls
    if (baseBoard) {
      setBoard(baseBoard);
    } else {
      setBoard(prev => placePreviewBalls(prev, newNextBalls));
    }
  };

  return {
    board,
    nextBalls,
    setNextBalls: setNextBallsAndBoard,
    setBoard, // Only for initial setup or real balls, not for incoming balls
  };
};
