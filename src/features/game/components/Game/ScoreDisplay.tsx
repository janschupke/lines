import React from "react";

interface ScoreDisplayProps {
  score: number;
  highScore: number;
  /** Bumps on every score effect; a key change re-runs the flash animation. */
  scoreFlashId: number;
  highScoreBeaten: boolean;
}

/**
 * Score Display Component
 * Shows current score and high score with flash animations
 */
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  highScore,
  scoreFlashId,
  highScoreBeaten,
}) => {
  return (
    <div className="flex flex-col items-end flex-1" aria-live="polite">
      <div className="flex items-center gap-2">
        <span className="game-score text-base">High Score:</span>
        <span
          key={highScoreBeaten ? `hs-${scoreFlashId}` : "hs"}
          className={`text-game-text-primary font-bold text-xl ${
            highScoreBeaten && scoreFlashId > 0 ? "score-flash" : ""
          }`}
          data-testid="high-score-value"
        >
          {highScore}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="game-score text-base">Current Score:</span>
        <span
          key={`s-${scoreFlashId}`}
          className={`text-game-text-primary font-bold text-xl ${
            scoreFlashId > 0 ? "score-flash" : ""
          }`}
          data-testid="score-value"
        >
          {score}
        </span>
      </div>
    </div>
  );
};

export default React.memo(ScoreDisplay);
