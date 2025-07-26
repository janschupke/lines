import { useState, useCallback } from "react";
import type { BallColor } from "../game/types";

export interface FloatingScore {
  id: string;
  score: number;
  x: number;
  y: number;
  timestamp: number;
}

export const useGameAnimation = () => {
  const [movingBall, setMovingBall] = useState<null | {
    color: BallColor;
    path: [number, number][];
  }>(null);
  const [movingStep, setMovingStep] = useState(0);
  const [poppingBalls, setPoppingBalls] = useState<Set<string>>(new Set());
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

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

  const addFloatingScore = useCallback((score: number, x: number, y: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newFloatingScore: FloatingScore = {
      id,
      score,
      x,
      y,
      timestamp: Date.now(),
    };
    
    setFloatingScores(prev => [...prev, newFloatingScore]);
    
    // Remove the floating score after animation completes
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(fs => fs.id !== id));
    }, 1000);
  }, []);

  return {
    movingBall,
    setMovingBall,
    movingStep,
    setMovingStep,
    poppingBalls,
    setPoppingBalls,
    floatingScores,
    addFloatingScore,
    startMoveAnimation,
    stopMoveAnimation,
  };
};
