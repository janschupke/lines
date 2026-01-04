import React from "react";
import { formatTime } from "@shared/utils/formatters";
import type { BallColor } from "../../types";
import { getBallColor } from "@shared/utils/helpers";

interface GameHeaderProps {
  score: number;
  highScore: number;
  scoreFlash: boolean;
  highScoreFlash: boolean;
  timer: number;
  nextBalls: BallColor[];
  onNewGame: () => void;
}

/**
 * Game Header Component
 * Displays score, high score, timer, next balls preview, and new game button
 */
export const GameHeader: React.FC<GameHeaderProps> = ({
  score,
  highScore,
  scoreFlash,
  highScoreFlash,
  timer,
  nextBalls,
  onNewGame,
}) => {
  return (
    <div className="flex justify-between w-full relative mb-4">
      {/* Score Section */}
      <div className="flex flex-col">
        <div
          className={`text-2xl font-bold ${
            scoreFlash ? "animate-pulse text-yellow-400" : "text-game-text-primary"
          }`}
        >
          Score: {score}
        </div>
        <div
          className={`text-lg ${
            highScoreFlash
              ? "animate-pulse text-yellow-400"
              : "text-game-text-secondary"
          }`}
        >
          High: {highScore}
        </div>
      </div>

      {/* Next Balls Preview */}
      <div className="flex items-center gap-2">
        <span className="text-game-text-secondary text-sm">Next:</span>
        <div className="flex gap-1">
          {nextBalls.map((color, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full border-2 border-game-border"
              style={{ backgroundColor: getBallColor(color) }}
            />
          ))}
        </div>
      </div>

      {/* New Game Button */}
      <button
        onClick={onNewGame}
        className="px-4 py-2 bg-game-button-primary text-game-button-text rounded-lg hover:bg-game-button-hover transition-colors"
      >
        New Game
      </button>

      {/* Timer */}
      <div className="absolute right-0 top-0 text-game-text-secondary text-sm">
        {formatTime(timer)}
      </div>
    </div>
  );
};

export default React.memo(GameHeader);
