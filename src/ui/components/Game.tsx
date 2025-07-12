import React from 'react';
import Board from './Board';
import GameEndDialog from './GameEndDialog';
import MovingBall from './MovingBall';
import { useGameState } from '../../game/state';
import { formatTime } from '../../utils/formatters';
import { getGameSpacing } from '../../utils/helpers';
import type { Cell } from '../../game/types';
import type { BallColor } from '../../utils/constants';

// Helper to get the pixel position of a cell in the board
const getCellPosition = (x: number, y: number) => {
  // Get dynamic values from CSS custom properties
  const { cellSize, gapSize, ballSize, boardPadding } = getGameSpacing();
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
  initialNextBalls 
}) => {
  const [gameState, gameActions] = useGameState(initialBoard, initialNextBalls);
  
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
    currentHighScore,
    isNewHighScore,
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
    <div className="flex flex-col items-center space-y-6">
      {/* Top Controls */}
      <div className="flex gap-4 items-center">
        <button
          onClick={startNewGame}
          className="bg-game-button-primary hover:bg-game-button-hover text-game-text-primary font-semibold px-4 py-2 rounded-lg border border-game-border-default cursor-pointer transition-colors"
        >
          New Game
        </button>
        
        <button
          onClick={() => setShowGuide(!showGuide)}
          className={`font-semibold text-base px-4 py-2 rounded-lg border border-game-border-default cursor-pointer transition-colors ${
            showGuide 
              ? 'bg-game-button-accent text-black hover:bg-game-button-accent-hover' 
              : 'bg-game-button-primary text-game-text-primary hover:bg-game-button-hover'
          }`}
        >
          {showGuide ? 'Hide Guide' : 'Show Guide'}
        </button>
      </div>

      {/* Game Info Row - Score, Incoming Balls, High Score */}
      <div className="flex items-center justify-between w-full max-w-2xl">
        {/* Current Score */}
        <div className="text-center">
          <div className="text-2xl font-bold text-game-text-accent">Score</div>
          <div className="text-xl text-game-text-primary" data-testid="score-value">{score}</div>
        </div>

        {/* Incoming Balls Panel */}
        <div className="flex flex-col items-center">
          <div className="text-sm text-game-text-secondary font-semibold mb-2">Next Balls</div>
          <div className="flex gap-2">
            {nextBalls.map((color, index) => (
              <div
                key={index}
                className={`w-6 h-6 rounded-full bg-ball-${color} border-2 border-game-border-ball shadow-sm`}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* High Score */}
        <div className="text-center">
          <div className="text-2xl font-bold text-game-text-accent">High Score</div>
          <div className="text-xl text-game-text-primary" data-testid="high-score-value">{currentHighScore}</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="bg-game-bg-board border border-game-border-default rounded-xl p-4 shadow-lg">
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
      <div className="text-center">
        <div className="text-2xl font-bold text-game-text-success">
          {formatTime(timer)}
        </div>
      </div>

      {/* Guide Panel */}
      {showGuide && (
        <div className="w-full max-w-2xl bg-game-bg-secondary border border-game-border-default rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-game-text-accent text-center">How to Play</h3>
          <div className="text-sm space-y-2 text-game-text-secondary">
            <p>• Click on a ball to select it</p>
            <p>• Click on an empty cell to move the ball</p>
            <p>• Form lines of 5+ balls to clear them</p>
            <p>• Longer lines = more points!</p>
            <p>• Game ends when board is full</p>
          </div>
          <div className="mt-4">
            <h4 className="font-bold text-game-text-accent mb-2 text-sm">Scoring:</h4>
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
          <div className="mt-3 text-sm text-game-text-accent font-semibold text-center">
            Good luck!
          </div>
        </div>
      )}
      
      {gameOver && (
        <GameEndDialog
          isOpen={showGameEndDialog}
          score={score}
          isNewHighScore={isNewHighScore}
          onNewGame={handleNewGameFromDialog}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
};

export default Game; 
