import React from 'react';
import Board from './Board';
import GameEndDialog from './GameEndDialog';
import GameHeader from './GameHeader';
import MovingBall from './MovingBall';
import { COLOR_MAP, type BallColor } from '../../utils/constants';
import { CELL_SIZE, GAP } from '../../utils/boardConstants';
import { BALL_SIZE } from '../../utils/constants';
import { useGameState } from '../../game/state';
import { formatTime } from '../../utils/formatters';
import type { Cell } from '../../game/types';

const OFFSET = (CELL_SIZE - BALL_SIZE) / 2;

// Helper to get the pixel position of a cell in the board
const getCellPosition = (x: number, y: number) => ({
  left: x * (CELL_SIZE + GAP) + OFFSET,
  top: y * (CELL_SIZE + GAP) + OFFSET,
});

interface GameProps {
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
  initialBoard?: Cell[][];
  initialNextBalls?: BallColor[];
}

const Game: React.FC<GameProps> = ({ 
  showGuide, 
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
      <MovingBall color={COLOR_MAP[movingBall.color]} left={left} top={top} />
    );
  }

  return (
    <div className="mx-auto mt-8 p-6 border border-game-border-default rounded-xl max-w-xl w-full bg-game-bg-secondary text-game-text-primary shadow-lg">
      <GameHeader
        score={score}
        currentHighScore={currentHighScore}
        nextBalls={nextBalls}
        onNewGame={startNewGame}
      />
      
      <div className="mt-6">
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
      
      <div className="mt-6 text-center">
        <div className="text-5xl font-black text-game-text-accent drop-shadow-lg">Much Balls...</div>
        <div className="mt-4 text-2xl text-game-text-success font-bold drop-shadow-lg">
          {formatTime(timer)}
        </div>
      </div>
      
      {showGuide && (
        <div className="mt-8 p-6 bg-game-bg-secondary bg-opacity-90 rounded-xl text-game-text-primary min-w-[320px] shadow-2xl">
          <h3 className="text-xl font-bold mb-4 text-game-text-accent">How to Play</h3>
          <div className="text-sm space-y-2">
            <p>• Click on a ball to select it</p>
            <p>• Click on an empty cell to move the ball</p>
            <p>• Form lines of 5+ balls to clear them</p>
            <p>• Longer lines = more points!</p>
            <p>• Game ends when board is full</p>
          </div>
          <div className="mt-4">
            <h4 className="font-bold text-game-text-accent mb-2">Scoring:</h4>
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
          <div className="mt-3 text-base text-game-text-accent font-semibold">
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
      
      <div className="w-full max-w-xl flex justify-center items-center mt-4 text-lg text-game-text-accent tracking-wide">
        <span>Lines Game</span>
      </div>
    </div>
  );
};

export default Game; 
