import React from "react";
import type { LocalHighScore } from "../../utils/configManager";

interface HighScoreDisplayProps {
  highScores: LocalHighScore[];
  currentScore?: number;
  isNewHighScore?: boolean;
  showTitle?: boolean;
  currentSessionScore?: number;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const HighScoreDisplay: React.FC<HighScoreDisplayProps> = ({
  highScores,
  currentScore,
  isNewHighScore = false,
  showTitle = true,
  currentSessionScore,
}) => {
  if (highScores.length === 0 && !currentSessionScore) {
    return (
      <div className="bg-game-bg-tertiary border border-game-border-default rounded-lg p-4 my-2 shadow-lg">
        {showTitle && (
          <h3 className="m-0 mb-3 text-game-text-accent text-base text-center font-semibold">
            High Scores
          </h3>
        )}
        <div className="text-center text-game-text-secondary">
          No high scores yet. Start playing to set your first record!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-game-bg-tertiary border border-game-border-default rounded-lg p-4 my-2 shadow-lg">
      {showTitle && (
        <h3 className="m-0 mb-3 text-game-text-accent text-base text-center font-semibold">
          High Scores
        </h3>
      )}
      {/* Show current session score if available */}
      {currentSessionScore && currentSessionScore > 0 && (
        <div className="mb-3 p-3 bg-game-bg-secondary rounded-md border-l-4 border-game-button-accent shadow-sm">
          <div className="text-game-text-accent font-bold text-sm">
            Current Session: {currentSessionScore}
          </div>
          <div className="text-game-text-secondary text-xs mt-1">
            This score will be saved when you start a new session
          </div>
        </div>
      )}
      {highScores.length > 0 && (
        <div className="flex flex-col gap-2">
          {highScores.map((score, index) => {
            const isCurrentScore =
              currentScore === score.score && isNewHighScore;
            return (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-md border-l-4 shadow-sm ${
                  isCurrentScore
                    ? "bg-game-bg-secondary border-game-button-accent animate-pulse"
                    : "bg-game-bg-tertiary border-game-border-preview"
                }`}
              >
                <div>
                  <span
                    className={
                      isCurrentScore
                        ? "font-bold text-game-text-accent"
                        : "text-game-text-primary"
                    }
                  >
                    #{index + 1} - {score.score}
                  </span>
                  <span className="text-game-text-secondary text-xs ml-2">
                    {" "}
                    - {formatDate(score.date)}
                  </span>
                </div>
                {isCurrentScore && (
                  <span className="text-game-text-accent text-xs font-bold">
                    NEW!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HighScoreDisplay;
