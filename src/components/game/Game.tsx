import React from "react";
import Board from "./Board";
import GameEndDialog from "../ui/GameEndDialog";
import MovingBall from "../ui/MovingBall";

import { useGameState } from "../../game/state";

import { useHighScore } from "../../hooks/useHighScore";
import { formatTime } from "../../utils/formatters";
import { getGameSpacing, getBallColor } from "../../utils/helpers";
import type { Cell } from "../../game/types";
import type { BallColor } from "../../game/constants";

// Helper to get the pixel position of a cell in the board
const getCellPosition = (x: number, y: number) => {
  // Get dynamic values from CSS custom properties
  const { cellSize, gapSize, ballSize, boardPadding } = getGameSpacing();
  
  // Calculate the offset to center the ball in the cell
  const OFFSET = (cellSize - ballSize) / 2;

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

      {/* Game Board */}
      <div
        className="game-panel p-4"
        style={{ maxWidth: "600px" }}
      >
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

      {/* Guide Panel */}
      {showGuide && (
        <div
          className="game-panel w-full p-6"
          style={{ maxWidth: "600px" }}
        >
          <h3 className="game-title mb-4 text-center text-xl">
            How to Play
          </h3>
          <div className="space-y-2 text-game-text-secondary text-sm">
            <p>• Click on a ball to select it</p>
            <p>
              • Click on an empty cell to move the ball
            </p>
            <p>• Form lines of 5+ balls to clear them</p>
            <p>
              •{" "}
              <strong>Only your moves trigger line removal and scoring</strong>
            </p>
            <p>• Automatic ball placement won't clear lines</p>
            <p>• Longer lines = more points!</p>
            <p>• Game ends when board is full</p>
          </div>
          <div className="mt-4">
            <h4 className="game-title mb-2 text-sm">
              Scoring:
            </h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="text-game-text-accent">
                  <td>5 balls:</td>
                  <td>5 points</td>
                </tr>
                <tr className="text-game-text-secondary">
                  <td>6 balls:</td>
                  <td>8 points</td>
                </tr>
                <tr className="text-game-text-secondary">
                  <td>7 balls:</td>
                  <td>13 points</td>
                </tr>
                <tr className="text-game-text-secondary">
                  <td>8 balls:</td>
                  <td>21 points</td>
                </tr>
                <tr className="text-game-text-secondary">
                  <td>9 balls:</td>
                  <td>34 points</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-game-text-accent font-semibold text-center text-sm">
            Good luck!
          </div>
        </div>
      )}

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
  );
};

export default Game;
