import { useState, useCallback, useRef } from "react";
import type { BallColor, SpawnedBall } from "../types";
import { ANIMATION_DURATIONS } from "../config";

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

interface AnimationPhase {
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
  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>({
    type: "idle",
  });
  // Track active floating scores by key (x,y,score) to prevent duplicates synchronously
  const activeFloatingScoresRef = useRef<Set<string>>(new Set());

  const startPoppingAnimation = useCallback((balls: Set<string>) => {
    setPoppingBalls(balls);
    setCurrentPhase({
      type: "popping",
      data: { poppingBalls: balls },
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
      data: { spawningBalls: balls },
    });
  }, []);

  const stopSpawningAnimation = useCallback(() => {
    setSpawningBalls([]);
    setCurrentPhase({ type: "idle" });
  }, []);

  const addFloatingScore = useCallback(
    (score: number, x: number, y: number) => {
      // Create a unique key for this floating score
      const key = `${x},${y},${score}`;

      // Check synchronously if this exact floating score is already active
      if (activeFloatingScoresRef.current.has(key)) {
        // Duplicate - don't add
        return;
      }

      // Mark as active immediately (synchronously)
      activeFloatingScoresRef.current.add(key);

      const now = Date.now();
      const id = `${now}-${Math.random()}`;
      const newFloatingScore: FloatingScore = {
        id,
        score,
        x,
        y,
        timestamp: now,
      };

      setFloatingScores((prev) => [...prev, newFloatingScore]);

      // Remove the floating score after animation completes
      setTimeout(() => {
        setFloatingScores((current) => current.filter((fs) => fs.id !== id));
        // Remove from active set
        activeFloatingScoresRef.current.delete(key);
      }, ANIMATION_DURATIONS.FLOATING_SCORE);
    },
    [],
  );

  const addGrowingBall = useCallback(
    (x: number, y: number, color: BallColor, isTransitioning: boolean) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newGrowingBall: GrowingBall = {
        id,
        x,
        y,
        color,
        isTransitioning,
        timestamp: Date.now(),
      };

      setGrowingBalls((prev) => [...prev, newGrowingBall]);

      // Remove the growing ball after animation completes
      setTimeout(() => {
        setGrowingBalls((prev) => prev.filter((gb) => gb.id !== id));
      }, ANIMATION_DURATIONS.GROW_BALL);
    },
    [],
  );

  const addSpawningBalls = useCallback((balls: SpawnedBall[]) => {
    // Add unique IDs to the balls for reliable removal
    const ballsWithIds = balls.map((ball) => ({
      ...ball,
      id: `${Date.now()}-${Math.random()}-${ball.x}-${ball.y}-${ball.color}`,
    }));

    setSpawningBalls((prev) => [...prev, ...ballsWithIds]);

    // Remove the spawning balls after animation completes
    setTimeout(() => {
      setSpawningBalls((prev) =>
        prev.filter((sb) => !ballsWithIds.some((ball) => ball.id === sb.id)),
      );
    }, ANIMATION_DURATIONS.GROW_BALL);
  }, []);

  const resetAnimationState = useCallback(() => {
    setMovingBall(null);
    setMovingStep(0);
    setPoppingBalls(new Set());
    setFloatingScores([]);
    setGrowingBalls([]);
    setSpawningBalls([]);
    setCurrentPhase({ type: "idle" });
    activeFloatingScoresRef.current.clear();
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
    startPoppingAnimation,
    stopPoppingAnimation,
    startSpawningAnimation,
    stopSpawningAnimation,
    resetAnimationState,
  };
};
