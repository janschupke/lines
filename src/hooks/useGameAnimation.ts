import { useState, useCallback } from "react";
import type { BallColor } from "../game/types";

export interface FloatingScore {
  id: string;
  score: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface GrowingBall {
  id: string;
  x: number;
  y: number;
  color: BallColor;
  isTransitioning: boolean; // true if transitioning from preview to real, false if new preview
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
  const [growingBalls, setGrowingBalls] = useState<GrowingBall[]>([]);

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

  const addGrowingBall = useCallback((x: number, y: number, color: BallColor, isTransitioning: boolean) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newGrowingBall: GrowingBall = {
      id,
      x,
      y,
      color,
      isTransitioning,
      timestamp: Date.now(),
    };
    
    setGrowingBalls(prev => [...prev, newGrowingBall]);
    
    // Remove the growing ball after animation completes
    setTimeout(() => {
      setGrowingBalls(prev => prev.filter(gb => gb.id !== id));
    }, 600); // Match the CSS animation duration
  }, []);

  return {
    movingBall,
    setMovingBall,
    movingStep,
    setMovingStep,
    poppingBalls,
    setPoppingBalls,
    floatingScores,
    growingBalls,
    addFloatingScore,
    addGrowingBall,
    startMoveAnimation,
    stopMoveAnimation,
  };
};
