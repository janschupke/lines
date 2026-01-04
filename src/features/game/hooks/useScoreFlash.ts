import { useState, useEffect } from "react";
import { ANIMATION_DURATIONS } from "../config";

/**
 * Hook for managing score flash animations
 * Handles flash animations when score or high score changes
 */
export const useScoreFlash = (
  score: number,
  highScore: number,
): {
  scoreFlash: boolean;
  highScoreFlash: boolean;
} => {
  const [scoreFlash, setScoreFlash] = useState(false);
  const [highScoreFlash, setHighScoreFlash] = useState(false);
  const [prevScore, setPrevScore] = useState(0);
  const [prevHighScore, setPrevHighScore] = useState(0);

  // Track score changes and trigger flash animation
  useEffect(() => {
    if (score !== prevScore && score > prevScore) {
      setScoreFlash(true);
      const timeout = setTimeout(() => setScoreFlash(false), ANIMATION_DURATIONS.SCORE_FLASH);
      setPrevScore(score);
      return () => clearTimeout(timeout);
    }
  }, [score, prevScore]);

  // Track high score changes and trigger flash animation
  useEffect(() => {
    if (highScore !== prevHighScore && highScore > prevHighScore) {
      setHighScoreFlash(true);
      const timeout = setTimeout(
        () => setHighScoreFlash(false),
        ANIMATION_DURATIONS.HIGH_SCORE_FLASH,
      );
      setPrevHighScore(highScore);
      return () => clearTimeout(timeout);
    }
  }, [highScore, prevHighScore]);

  return {
    scoreFlash,
    highScoreFlash,
  };
};

