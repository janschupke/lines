import React from "react";
import type { GameStatistics } from "../../game/types";

interface GameEndDialogProps {
  isOpen: boolean;
  score: number;
  currentGameBeatHighScore: boolean;
  statistics: GameStatistics;
  onNewGame: () => void;
  onClose: () => void;
}

const GameEndDialog: React.FC<GameEndDialogProps> = ({
  isOpen,
  score,
  currentGameBeatHighScore,
  statistics,
  onNewGame,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="absolute inset-0 bg-slate-800 bg-opacity-95 rounded-xl z-50 p-6 overflow-auto scrollbar-hide animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="h-full flex flex-col text-game-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-4xl font-bold text-game-text-primary`}>
            {currentGameBeatHighScore ? "🎉 New High Score! 🎉" : "Game Over"}
          </h2>
          <button
            className="text-game-text-primary text-3xl font-bold hover:scale-110 transition-transform cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto scrollbar-hide">
          {/* Main Score Display */}
          <div className="text-center mb-8">
            <div className="game-score text-6xl font-bold mb-2">{score}</div>
            <div className="text-xl text-game-text-secondary">Final Score</div>
          </div>

          {/* Game Statistics - Integrated into main dialog */}
          <div className="space-y-6 mb-8">
            {/* Key Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                <div className="text-3xl font-bold text-game-text-primary">
                  {statistics.turnsCount}
                </div>
                <div className="text-sm text-game-text-secondary">Turns</div>
              </div>
              <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                <div className="text-3xl font-bold text-game-text-primary">
                  {formatDuration(statistics.gameDuration)}
                </div>
                <div className="text-sm text-game-text-secondary">Duration</div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                <div className="text-3xl font-bold text-game-text-primary">
                  {statistics.linesPopped}
                </div>
                <div className="text-sm text-game-text-secondary">
                  Lines Popped
                </div>
              </div>
              <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                <div className="text-3xl font-bold text-game-text-primary">
                  {statistics.individualBallsPopped}
                </div>
                <div className="text-sm text-game-text-secondary">
                  Balls Cleared
                </div>
              </div>
            </div>

            {/* Advanced Stats */}
            {statistics.linesPopped > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                  <div className="text-3xl font-bold text-game-text-primary">
                    {statistics.longestLinePopped}
                  </div>
                  <div className="text-sm text-game-text-secondary">
                    Longest Line
                  </div>
                </div>
                <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                  <div className="text-3xl font-bold text-game-text-primary">
                    {Math.round(statistics.averageScorePerTurn)}
                  </div>
                  <div className="text-sm text-game-text-secondary">
                    Avg Score/Turn
                  </div>
                </div>
              </div>
            )}

            {/* Efficiency Stats */}
            {statistics.linesPopped > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                  <div className="text-3xl font-bold text-game-text-primary">
                    {(
                      statistics.linesPopped /
                      Math.max(statistics.turnsCount, 1)
                    ).toFixed(1)}
                  </div>
                  <div className="text-sm text-game-text-secondary">
                    Lines/Turn
                  </div>
                </div>
                <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                  <div className="text-3xl font-bold text-game-text-primary">
                    {(
                      statistics.individualBallsPopped /
                      Math.max(statistics.turnsCount, 1)
                    ).toFixed(1)}
                  </div>
                  <div className="text-sm text-game-text-secondary">
                    Balls/Turn
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="text-center mb-8">
            <p className="text-xl text-game-text-secondary">
              {currentGameBeatHighScore
                ? "🎉 Congratulations! You've set a new personal best! 🎉"
                : "Great game! Try again to beat your high score."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onNewGame}
              className="game-button game-button-accent px-8 py-3 text-lg font-bold"
            >
              Play Again
            </button>
            <button
              onClick={onClose}
              className="game-button game-button-primary px-8 py-3 text-lg font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameEndDialog;
