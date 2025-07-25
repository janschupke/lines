import React from "react";
import type { GameStatistics } from "../../game/types";

interface GameEndDialogProps {
  isOpen: boolean;
  score: number;
  isNewHighScore: boolean;
  statistics: GameStatistics;
  onNewGame: () => void;
  onClose: () => void;
}

const GameEndDialog: React.FC<GameEndDialogProps> = ({
  isOpen,
  score,
  isNewHighScore,
  statistics,
  onNewGame,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1000]">
      <div className="bg-game-bg-secondary border-2 border-game-border-default rounded-xl p-6 max-w-md w-11/12 text-center shadow-2xl">
        <h2
          className={`m-0 mb-4 text-2xl font-bold ${isNewHighScore ? "text-game-text-accent" : "text-game-text-primary"}`}
        >
          {isNewHighScore ? "🎉 New High Score! 🎉" : "Game Over"}
        </h2>
        <div className="text-3xl font-bold text-game-text-accent my-4">
          Score: {score}
        </div>
        {isNewHighScore && (
          <div className="bg-gradient-to-r from-game-button-accent to-game-button-accent-hover text-black py-2 px-4 rounded-full font-bold my-4 animate-bounce shadow-lg">
            🏆 NEW RECORD! 🏆
          </div>
        )}
        
        {/* Game Statistics */}
        <div className="bg-game-bg-primary border border-game-border-default rounded-lg p-4 my-4">
          <h3 className="text-lg font-semibold text-game-text-accent mb-3 text-center">
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
          {isNewHighScore
            ? "Congratulations! You've set a new personal best!"
            : "Great game! Try again to beat your high score."}
        </p>
        <div className="flex gap-3 justify-center mt-5">
          <button
            className="py-2 px-5 rounded-md font-semibold cursor-pointer bg-game-button-accent text-black hover:bg-game-button-accent-hover transition-colors shadow-md"
            onClick={onNewGame}
          >
            New Game
          </button>
          <button
            className="py-2 px-5 rounded-md font-semibold cursor-pointer bg-game-button-primary text-game-text-primary hover:bg-game-button-hover transition-colors shadow-md"
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
