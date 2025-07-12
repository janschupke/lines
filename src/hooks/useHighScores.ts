import { useState, useCallback, useRef } from 'react';
import HighScoreManager from '../utils/highScoreManager';

export const useHighScores = () => {
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const highScoreManager = useRef(new HighScoreManager());

  const checkForNewHighScore = useCallback((
    score: number, 
    time: number, 
    playerName?: string, 
    statistics?: {
      turnsCount?: number;
      ballsCleared?: number;
      linesPopped?: number;
      longestLinePopped?: number;
      individualBallsPopped?: number;
    }
  ): boolean => {
    if (highScoreManager.current.isNewHighScore(score)) {
      const success = highScoreManager.current.addHighScore(score, time, playerName, statistics);
      if (success) {
        setCurrentHighScore(highScoreManager.current.getCurrentHighScore());
        setIsNewHighScore(true);
        return true;
      }
    }
    return false;
  }, []);

  return {
    currentHighScore,
    isNewHighScore,
    checkForNewHighScore,
    getHighScores: () => highScoreManager.current.getHighScores(),
  };
}; 
