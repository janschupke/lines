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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1000] backdrop-blur-sm">
      <div className="game-dialog p-6 max-w-md w-11/12 text-center">
        <h2
          className={`m-0 mb-4 text-2xl font-bold ${currentGameBeatHighScore ? "game-title" : "text-game-text-primary"}`}
        >
          {currentGameBeatHighScore ? "🎉 New High Score! 🎉" : "Game Over"}
        </h2>
        <div className="game-score text-3xl my-4">
          Score: {score}
        </div>
        {currentGameBeatHighScore && (
          <div className="game-highlight my-4">
            🏆 NEW RECORD! 🏆
          </div>
        )}
        
        {/* Game Statistics */}
        <div className="game-panel p-4 my-4">
          <h3 className="game-title text-lg mb-3 text-center">
            Game Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-game-text-secondary">
              <span className="font-medium">Turns:</span> {statistics.turnsCount}
            </div>
            <div className="text-game-text-secondary">
              <span className="font-medium">Duration:</span> {Math.floor(statistics.gameDuration / 60)}:{(statistics.gameDuration % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-game-text-secondary">
              <span className="font-medium">Lines Popped:</span> {statistics.linesPopped}
            </div>
            <div className="text-game-text-secondary">
              <span className="font-medium">Balls Cleared:</span> {statistics.individualBallsPopped}
            </div>
            <div className="text-game-text-secondary">
              <span className="font-medium">Longest Line:</span> {statistics.longestLinePopped}
            </div>
            <div className="text-game-text-secondary">
              <span className="font-medium">Avg Score/Turn:</span> {Math.round(statistics.averageScorePerTurn)}
            </div>
            {statistics.linesPopped > 0 && (
              <>
                <div className="text-game-text-secondary">
                  <span className="font-medium">Lines/Turn:</span> {(statistics.linesPopped / Math.max(statistics.turnsCount, 1)).toFixed(1)}
                </div>
                <div className="text-game-text-secondary">
                  <span className="font-medium">Balls/Turn:</span> {(statistics.individualBallsPopped / Math.max(statistics.turnsCount, 1)).toFixed(1)}
                </div>
              </>
            )}
          </div>
        </div>
        
        <p className="text-game-text-secondary my-4 text-base">
          {currentGameBeatHighScore
            ? "Congratulations! You've set a new personal best!"
            : "Great game! Try again to beat your high score."}
        </p>
        <div className="flex gap-3 justify-center mt-5">
          <button
            className="game-button game-button-accent py-2 px-5"
            onClick={onNewGame}
          >
            New Game
          </button>
          <button
            className="game-button game-button-primary py-2 px-5"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameEndDialog;
