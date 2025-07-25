import { useState, useEffect, useCallback } from "react";

const HIGH_SCORE_KEY = "lines-game-high-score";

export const useHighScore = () => {
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Load high score from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HIGH_SCORE_KEY);
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

  // Check if current score is a new high score and update if needed
  const checkAndUpdateHighScore = useCallback((currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      setIsNewHighScore(true);
      
      // Save to localStorage
      try {
        localStorage.setItem(HIGH_SCORE_KEY, currentScore.toString());
      } catch (error) {
        console.warn("Failed to save high score to localStorage:", error);
      }
      
      return true;
    }
    return false;
  }, [highScore]);

  // Reset new high score flag
  const resetNewHighScoreFlag = useCallback(() => {
    setIsNewHighScore(false);
  }, []);

  return {
    highScore,
    isNewHighScore,
    checkAndUpdateHighScore,
    resetNewHighScoreFlag,
  };
}; 
