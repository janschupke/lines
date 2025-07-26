import { useState, useEffect, useCallback } from "react";
import { HIGH_SCORE_STORAGE_KEY } from "../game/config";

export const useHighScore = () => {
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [currentGameBeatHighScore, setCurrentGameBeatHighScore] = useState(false);

  // Load high score from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      if (stored) {
        const score = parseInt(stored, 10);
        if (!isNaN(score)) {
          setHighScore(score);
        }
      }
    } catch (error) {
      console.warn("Failed to load high score from localStorage:", error);
    }
  }, []);

  const checkAndUpdateHighScore = useCallback((currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      setIsNewHighScore(true);
      setCurrentGameBeatHighScore(true);
      
      // Save to localStorage
      try {
        localStorage.setItem(HIGH_SCORE_STORAGE_KEY, currentScore.toString());
      } catch (error) {
        console.warn("Failed to save high score to localStorage:", error);
      }
      
      return true;
    } else if (currentScore === highScore && currentScore > 0) {
      // If score equals current high score, don't set new high score flag
      setIsNewHighScore(false);
    }
    return false;
  }, [highScore]);

  // Reset new high score flag
  const resetNewHighScoreFlag = useCallback(() => {
    setIsNewHighScore(false);
  }, []);

  // Reset current game high score flag
  const resetCurrentGameHighScoreFlag = useCallback(() => {
    setCurrentGameBeatHighScore(false);
  }, []);

  return {
    highScore,
    isNewHighScore,
    currentGameBeatHighScore,
    checkAndUpdateHighScore,
    resetNewHighScoreFlag,
    resetCurrentGameHighScoreFlag,
  };
}; 
