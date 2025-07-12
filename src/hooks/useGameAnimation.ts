import { useState, useCallback } from "react";
import type { BallColor } from "../game/types";

export const useGameAnimation = () => {
  const [movingBall, setMovingBall] = useState<null | {
    color: BallColor;
    path: [number, number][];
  }>(null);
  const [movingStep, setMovingStep] = useState(0);
  const [poppingBalls, setPoppingBalls] = useState<Set<string>>(new Set());

  const startMoveAnimation = useCallback(
    (ball: BallColor, path: [number, number][]) => {
      setMovingBall({ color: ball, path });
      setMovingStep(0);
    },
    [],
  );

  const stopMoveAnimation = useCallback(() => {
    setMovingBall(null);
    setMovingStep(0);
  }, []);

  return {
    movingBall,
    setMovingBall,
    movingStep,
    setMovingStep,
    poppingBalls,
    setPoppingBalls,
    startMoveAnimation,
    stopMoveAnimation,
  };
};
