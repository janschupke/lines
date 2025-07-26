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
    if (initialBoard) {
      // If we have a saved board, use it as-is (it already contains preview balls)
      return initialBoard;
    }
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(INITIAL_BALLS);
    const boardWithRealBalls = placeRealBalls(board, initialBalls);
    return placePreviewBalls(boardWithRealBalls, nextBalls);
  });

  // Track if we're loading from a saved state
  const [isLoadedFromSavedState] = useState(() => !!initialBoard);

  // Update nextBalls and board - preserves existing incoming balls when stepping on one
  const setNextBallsAndBoard = (
    newNextBalls: BallColor[],
    baseBoard?: Cell[][],
  ) => {
    setNextBalls(newNextBalls);
    // If baseBoard is provided, use it directly (preserves existing incoming balls)
    // Otherwise, apply placePreviewBalls to replace all incoming balls
    if (baseBoard) {
      setBoard(baseBoard);
    } else if (!isLoadedFromSavedState) {
      // Only re-place preview balls if we're not loading from a saved state
      setBoard((prev) => placePreviewBalls(prev, newNextBalls));
    }
    // If we're loading from a saved state and no baseBoard is provided, don't update the board
  };

  return {
    board,
    nextBalls,
    setNextBalls: setNextBallsAndBoard,
    setBoard, // Only for initial setup or real balls, not for incoming balls
  };
};
