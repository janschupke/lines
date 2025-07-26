import React, { useState } from "react";
import Board from "./Board";
import Guide from "../ui/Guide";
import GameEndDialog from "../ui/GameEndDialog";
import MovingBall from "../ui/MovingBall";
import FloatingScore from "../ui/FloatingScore";
import { useGameState } from "../../game/state";
import { useKeyboard } from "../../hooks/useKeyboard";
import { getGameSizing, getBallColor } from "../../utils/helpers";
import { formatTime } from "../../utils/formatters";
import type { Cell, BallColor } from "../../game/types";

interface GameProps {
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
  initialBoard?: Cell[][];
  initialNextBalls?: BallColor[];
}

const Game: React.FC<GameProps> = ({
  showGuide,
  setShowGuide,
  initialBoard,
  initialNextBalls,
}) => {
  const [gameState, gameActions] = useGameState(initialBoard, initialNextBalls);

  // State for fade animations
  const [isGuideClosing, setIsGuideClosing] = useState(false);

  const {
    board,
    score,
    highScore,
    currentGameBeatHighScore,
    selected,
    gameOver,
    nextBalls,
    timer,
    movingBall,
    movingStep,
    poppingBalls,
    hoveredCell,
    pathTrail,
    notReachable,
    showGameEndDialog,
    floatingScores,
  } = gameState;

  const {
    startNewGame,
    handleCellClick,
    handleCellHover,
    handleCellLeave,
    handleNewGameFromDialog,
    handleCloseDialog,
    checkAndUpdateHighScore,
    resetNewHighScoreFlag,
    resetCurrentGameHighScoreFlag,
  } = gameActions;

  // Handle guide close with fade out animation
  const handleGuideClose = () => {
    setIsGuideClosing(true);
    setTimeout(() => {
      setShowGuide(false);
      setIsGuideClosing(false);
    }, 300); // Match the animation duration
  };

  // Keyboard event handling
  useKeyboard({
    onKeyG: () => {
      if (showGuide) {
        handleGuideClose();
      } else {
        setShowGuide(true);
      }
    },
    onKeyN: () => startNewGame(),
    onKeyEscape: () => {
      if (showGuide) {
        handleGuideClose();
      }
      if (showGameEndDialog) {
        handleCloseDialog();
      }
    },
  });

  // Check for new high score after every score increase
  React.useEffect(() => {
    if (score > 0) {
      checkAndUpdateHighScore(score);
    }
  }, [score, checkAndUpdateHighScore]);

  // Reset high score flags when starting new game
  React.useEffect(() => {
    if (!gameOver) {
      resetNewHighScoreFlag();
      resetCurrentGameHighScoreFlag();
    }
  }, [gameOver, resetNewHighScoreFlag, resetCurrentGameHighScoreFlag]);

  // Render the moving ball absolutely above the board
  let movingBallEl = null;
  if (movingBall && movingStep < movingBall.path.length) {
    const [mx, my] = movingBall.path[movingStep];
    const { left, top } = getGameSizing().getCellPosition(mx, my);
    movingBallEl = (
      <MovingBall color={movingBall.color} left={left} top={top} />
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Single-line Top Panel */}
      <div className="flex items-center w-full relative mb-4" style={{ maxWidth: "600px" }}>
        <div className="flex gap-2 flex-1">
          <button
            onClick={startNewGame}
            className="game-button game-button-primary p-3 rounded-lg hover:bg-opacity-80 transition-colors"
            data-testid="new-game-button"
            title="New Game"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`game-button p-3 rounded-lg hover:bg-opacity-80 transition-colors ${
              showGuide
                ? "game-button-accent"
                : "game-button-primary"
            }`}
            title="Game Guide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {/* Center: Next Balls - absolutely centered */}
        <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
          <div className="text-game-text-secondary font-semibold mb-2 text-sm">
            Next Balls
          </div>
          <div className="flex gap-2">
            {nextBalls.map((color, index) => (
              <div
                key={index}
                className={`game-ball w-6 h-6`}
                style={{ backgroundColor: getBallColor(color) }}
              />
            ))}
          </div>
        </div>

        {/* Right: Score and High Score stacked */}
        <div className="flex flex-col items-end flex-1">
          <div className="flex items-center gap-2">
            <span className="game-score text-base">
              High Score:
            </span>
            <span
              className="text-game-text-primary font-bold text-xl"
              data-testid="high-score-value"
            >
              {highScore}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="game-score text-base">
              Current Score:
            </span>
            <span
              className="text-game-text-primary font-bold text-xl"
              data-testid="score-value"
            >
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Game Board Container with Overlays */}
      <div className="relative" style={{ maxWidth: "600px" }}>
        <div className="game-panel p-4">
          <div className="relative">
            <Board
              board={board}
              onCellClick={handleCellClick}
              movingBall={movingBall}
              poppingBalls={poppingBalls}
              hoveredCell={hoveredCell}
              pathTrail={pathTrail}
              notReachable={notReachable}
              onCellHover={handleCellHover}
              onCellLeave={handleCellLeave}
              selected={selected}
            >
              {movingBallEl}
            </Board>

            {/* Guide Overlay - exactly same size as board */}
            {(showGuide || isGuideClosing) && (
              <div 
                className={`absolute inset-0 bg-slate-800 bg-opacity-95 rounded-xl z-50 p-4 overflow-auto scrollbar-hide ${
                  isGuideClosing ? 'animate-in fade-out duration-300' : 'animate-in fade-in duration-300'
                }`}
              >
                <Guide onClose={handleGuideClose} />
              </div>
            )}

            {/* Game End Dialog Overlay - exactly same size as board */}
            {gameOver && (
              <GameEndDialog
                isOpen={showGameEndDialog}
                score={score}
                currentGameBeatHighScore={currentGameBeatHighScore}
                statistics={gameState.statistics}
                onNewGame={handleNewGameFromDialog}
                onClose={handleCloseDialog}
              />
            )}

            {/* Floating Score Animations */}
            {floatingScores?.map((floatingScore) => (
              <FloatingScore
                key={floatingScore.id}
                floatingScore={floatingScore}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Timer */}
      {/* Single-line Top Panel */}
      <div className="flex justify-between w-full relative mt-4" style={{ maxWidth: "600px" }}>
        <div>
        <a
          href="https://github.com/janschupke/lines"
          target="_blank"
          rel="noopener noreferrer"
          className="text-game-text-secondary hover:text-game-text-primary transition-colors duration-300"
          title="View on GitHub"
        >
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        </a>
        </div>
        <div className={`font-bold text-2xl ${
          gameState.timerActive 
            ? "text-game-text-success" 
            : "text-game-text-secondary"
        }`}>
          {formatTime(timer)}
        </div>
      </div>
    </div>
  );
};

export default Game;
