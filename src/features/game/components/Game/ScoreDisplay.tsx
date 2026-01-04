import React from "react";

interface ScoreDisplayProps {
  score: number;
  highScore: number;
  scoreFlash: boolean;
  highScoreFlash: boolean;
}

/**
 * Score Display Component
 * Shows current score and high score with flash animations
 */
export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  highScore,
  scoreFlash,
  highScoreFlash,
}) => {
  return (
    <div className="flex flex-col items-end flex-1">
      <div className="flex items-center gap-2">
        <span className="game-score text-base">High Score:</span>
        <span
          className={`text-game-text-primary font-bold text-xl ${highScoreFlash ? "score-flash" : ""}`}
          data-testid="high-score-value"
        >
          {highScore}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="game-score text-base">Current Score:</span>
        <span
          className={`text-game-text-primary font-bold text-xl ${scoreFlash ? "score-flash" : ""}`}
          data-testid="score-value"
        >
          {score}
        </span>
      </div>
    </div>
  );
};

export default React.memo(ScoreDisplay);
