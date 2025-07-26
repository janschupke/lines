import React, { useState } from "react";
import Board from "./Board";
import GameEndDialog from "../ui/GameEndDialog";
import Guide from "../ui/Guide";
import MovingBall from "../ui/MovingBall";

import { useGameState } from "../../game/state";
import { useHighScore } from "../../hooks/useHighScore";
import { useKeyboard } from "../../hooks/useKeyboard";
import { formatTime } from "../../utils/formatters";
import { getGameSpacing, getBallColor } from "../../utils/helpers";
import type { Cell, BallColor } from "../../game/types";

// Helper to get the pixel position of a cell in the board
const getCellPosition = (x: number, y: number) => {
  // Get dynamic values from CSS custom properties
  const { cellSize, gapSize, ballSize, boardPadding } = getGameSpacing();
  // Account for ball border (border-2 = 2px on each side = 4px total)
  const actualBallSize = ballSize + 4;
  const OFFSET = (cellSize - actualBallSize) / 2;

  return {
    left: boardPadding + x * (cellSize + gapSize) + OFFSET,
    top: boardPadding + y * (cellSize + gapSize) + OFFSET,
  };
};

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
  const { highScore, currentGameBeatHighScore, checkAndUpdateHighScore, resetNewHighScoreFlag, resetCurrentGameHighScoreFlag } = useHighScore();

  // State for fade animations
  const [isGuideClosing, setIsGuideClosing] = useState(false);

  const {
    board,
    score,
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
  } = gameState;

  const {
    startNewGame,
    handleCellClick,
    handleCellHover,
    handleCellLeave,
    handleNewGameFromDialog,
    handleCloseDialog,
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
    const { left, top } = getCellPosition(mx, my);
    movingBallEl = (
      <MovingBall color={movingBall.color} left={left} top={top} />
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Single-line Top Panel */}
      <div className="flex items-center w-full relative mb-6" style={{ maxWidth: "600px" }}>
        <div className="flex gap-2 flex-1">
          <button
            onClick={startNewGame}
            className="game-button game-button-primary px-4 py-2"
          >
            New
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`game-button px-4 py-2 ${
              showGuide
                ? "game-button-accent"
                : "game-button-primary"
            }`}
          >
            Guide
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
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Right: Score and High Score stacked */}
        <div className="flex flex-col items-end flex-1">
          <div className="flex items-center gap-2">
            <span className="game-score text-base">
              Score:
            </span>
            <span
              className="text-game-text-primary font-bold text-xl"
              data-testid="score-value"
            >
              {score}
            </span>
          </div>
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
            >
              {movingBallEl}
            </Board>

            {/* Guide Overlay - exactly same size as board */}
            {(showGuide || isGuideClosing) && (
              <div 
                className={`absolute inset-0 bg-slate-800 bg-opacity-95 rounded-xl z-50 p-4 overflow-auto scrollbar-hide ${
                  isGuideClosing ? 'animate-in fade-out duration-300' : 'animate-in fade-in duration-300'
                }`}
                onClick={handleGuideClose}
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
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="text-center mt-4" style={{ maxWidth: "600px" }}>
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
