import React from 'react';
import Board from './Board';
import GameEndDialog from '../ui/GameEndDialog';
import MovingBall from '../ui/MovingBall';
import MobileControls from './MobileControls';
import { useGameState } from '../../game/state';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { formatTime } from '../../utils/formatters';
import { getGameSpacing } from '../../utils/helpers';
import type { Cell } from '../../game/types';
import type { BallColor } from '../../game/constants';

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
  const { isMobile } = useMobileOptimization();
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
    <div className={`flex flex-col items-center ${isMobile ? 'space-y-4 px-2' : 'space-y-6'}`}>
      {/* Top Controls */}
      <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'} items-center`}>
        <button
          onClick={startNewGame}
          className={`bg-game-button-primary hover:bg-game-button-hover text-game-text-primary font-semibold rounded-lg border border-game-border-default cursor-pointer transition-colors ${
            isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
          }`}
        >
          New Game
        </button>
        
        <button
          onClick={() => setShowGuide(!showGuide)}
          className={`font-semibold rounded-lg border border-game-border-default cursor-pointer transition-colors ${
            showGuide 
              ? 'bg-game-button-accent text-black hover:bg-game-button-accent-hover' 
              : 'bg-game-button-primary text-game-text-primary hover:bg-game-button-hover'
          } ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-base'}`}
        >
          {showGuide ? 'Hide Guide' : 'Show Guide'}
        </button>
      </div>

      {/* Game Info Row - Score, Incoming Balls, High Score */}
      <div className={`flex items-center justify-between w-full ${isMobile ? 'max-w-full px-2' : 'max-w-2xl'}`}>
        {/* Current Score */}
        <div className="text-center">
          <div className={`font-bold text-game-text-accent ${isMobile ? 'text-lg' : 'text-2xl'}`}>Score</div>
          <div className={`text-game-text-primary ${isMobile ? 'text-lg' : 'text-xl'}`} data-testid="score-value">{score}</div>
        </div>

        {/* Incoming Balls Panel */}
        <div className="flex flex-col items-center">
          <div className={`text-game-text-secondary font-semibold mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>Next Balls</div>
          <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'}`}>
            {nextBalls.map((color, index) => (
              <div
                key={index}
                className={`rounded-full bg-ball-${color} border-2 border-game-border-ball shadow-sm ${
                  isMobile ? 'w-4 h-4' : 'w-6 h-6'
                }`}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* High Score */}
        <div className="text-center">
          <div className={`font-bold text-game-text-accent ${isMobile ? 'text-lg' : 'text-2xl'}`}>High Score</div>
          <div className={`text-game-text-primary ${isMobile ? 'text-lg' : 'text-xl'}`} data-testid="high-score-value">{currentHighScore}</div>
        </div>
      </div>

      {/* Game Board */}
      <div className={`bg-game-bg-board border border-game-border-default rounded-xl shadow-lg ${
        isMobile ? 'p-2' : 'p-4'
      }`}>
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
        <div className={`font-bold text-game-text-success ${
          isMobile ? 'text-xl' : 'text-2xl'
        }`}>
          {formatTime(timer)}
        </div>
      </div>

      {/* Guide Panel */}
      {showGuide && (
        <div className={`w-full bg-game-bg-secondary border border-game-border-default rounded-xl shadow-lg ${
          isMobile ? 'max-w-full px-4 py-4' : 'max-w-2xl p-6'
        }`}>
          <h3 className={`font-bold mb-4 text-game-text-accent text-center ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>How to Play</h3>
          <div className={`space-y-2 text-game-text-secondary ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
            <p>• {isMobile ? 'Tap' : 'Click'} on a ball to select it</p>
            <p>• {isMobile ? 'Tap' : 'Click'} on an empty cell to move the ball</p>
            <p>• Form lines of 5+ balls to clear them</p>
            <p>• <strong>Only your moves trigger line removal and scoring</strong></p>
            <p>• Automatic ball placement won't clear lines</p>
            <p>• Longer lines = more points!</p>
            <p>• Game ends when board is full</p>
          </div>
          <div className="mt-4">
            <h4 className={`font-bold text-game-text-accent mb-2 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>Scoring:</h4>
            <table className={`w-full ${
              isMobile ? 'text-xs' : 'text-xs'
            }`}>
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
          <div className={`mt-3 text-game-text-accent font-semibold text-center ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
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
      
      <MobileControls
        onNewGame={startNewGame}
        showGuide={showGuide}
        onToggleGuide={() => setShowGuide(!showGuide)}
      />
    </div>
  );
};

export default Game; 
