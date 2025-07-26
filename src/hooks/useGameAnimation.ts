import { useState, useCallback } from "react";
import type { BallColor, SpawnedBall } from "../game/types";

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

export interface AnimationPhase {
  type: "idle" | "moving" | "popping" | "spawning" | "converting";
  data?: {
    movingBall?: { color: BallColor; path: [number, number][] };
    poppingBalls?: Set<string>;
    spawningBalls?: SpawnedBall[];
  };
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
  const [spawningBalls, setSpawningBalls] = useState<SpawnedBall[]>([]);
  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>({ type: "idle" });

  const startMoveAnimation = useCallback(
    (ball: BallColor, path: [number, number][]) => {
      setMovingBall({ color: ball, path });
      setMovingStep(0);
      setCurrentPhase({ 
        type: "moving", 
        data: { movingBall: { color: ball, path } } 
      });
    },
    [],
  );

  const stopMoveAnimation = useCallback(() => {
    setMovingBall(null);
    setMovingStep(0);
    setCurrentPhase({ type: "idle" });
  }, []);

  const startPoppingAnimation = useCallback((balls: Set<string>) => {
    setPoppingBalls(balls);
    setCurrentPhase({ 
      type: "popping", 
      data: { poppingBalls: balls } 
    });
  }, []);

  const stopPoppingAnimation = useCallback(() => {
    setPoppingBalls(new Set());
    setCurrentPhase({ type: "idle" });
  }, []);

  const startSpawningAnimation = useCallback((balls: SpawnedBall[]) => {
    setSpawningBalls(balls);
    setCurrentPhase({ 
      type: "spawning", 
      data: { spawningBalls: balls } 
    });
  }, []);

  const stopSpawningAnimation = useCallback(() => {
    setSpawningBalls([]);
    setCurrentPhase({ type: "idle" });
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

  const addSpawningBalls = useCallback((balls: SpawnedBall[]) => {
    setSpawningBalls(prev => [...prev, ...balls]);
    
    // Remove the spawning balls after animation completes
    setTimeout(() => {
      setSpawningBalls(prev => prev.filter(sb => 
        !balls.some(ball => ball.x === sb.x && ball.y === sb.y && ball.color === sb.color)
      ));
    }, 600);
  }, []);

  const resetAnimationState = useCallback(() => {
    setMovingBall(null);
    setMovingStep(0);
    setPoppingBalls(new Set());
    setFloatingScores([]);
    setGrowingBalls([]);
    setSpawningBalls([]);
    setCurrentPhase({ type: "idle" });
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
    spawningBalls,
    currentPhase,
    addFloatingScore,
    addGrowingBall,
    addSpawningBalls,
    startMoveAnimation,
    stopMoveAnimation,
    startPoppingAnimation,
    stopPoppingAnimation,
    startSpawningAnimation,
    stopSpawningAnimation,
    resetAnimationState,
  };
};
