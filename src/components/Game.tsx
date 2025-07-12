import React, { useState, useEffect, useRef, useMemo } from 'react';
import Board from './Board';
import GameEndDialog from './GameEndDialog';
import GameHeader from './ui/GameHeader';
import MovingBall from './ui/MovingBall';
import { 
  BOARD_SIZE, 
  BALLS_PER_TURN, 
  BALL_SIZE, 
  ANIMATION_DURATIONS,
  COLOR_MAP,
  type BallColor
} from '../utils/constants';
import { CELL_SIZE, GAP } from '../utils/boardConstants';
import { 
  type Cell, 
  getRandomNextBalls,
  createEmptyBoard,
  placePreviewBalls,
  recalculateIncomingPositions,
  isBoardFull,
  findLine,
  findPath,
  getRandomEmptyCells
} from '../utils/gameLogic';
import { formatTime } from '../utils/formatters';
import HighScoreManager from '../utils/highScoreManager';


const OFFSET = (CELL_SIZE - BALL_SIZE) / 2;

// Helper to get the pixel position of a cell in the board
const getCellPosition = (x: number, y: number) => ({
  left: x * (CELL_SIZE + GAP) + OFFSET,
  top: y * (CELL_SIZE + GAP) + OFFSET,
});



interface GameProps {
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
  showHighScores: boolean;
  setShowHighScores: (v: boolean) => void;
  initialBoard?: Cell[][];
  initialNextBalls?: BallColor[];
}

const Game: React.FC<GameProps> = ({ 
  showGuide, 
  showHighScores, 
  initialBoard, 
  initialNextBalls 
}) => {
  const [board, setBoard] = useState<Cell[][]>(() => {
    if (initialBoard && initialNextBalls) {
      return placePreviewBalls(initialBoard, initialNextBalls);
    }
    // Start with empty board, add 3 real balls, then add 3 incoming preview balls
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(BALLS_PER_TURN);
    const boardWithRealBalls = placePreviewBalls(board, initialBalls);
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    return placePreviewBalls(boardWithRealBalls, initialNext);
  });
  
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<{x: number, y: number} | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [nextBalls, setNextBalls] = useState<BallColor[]>(() => getRandomNextBalls(BALLS_PER_TURN));
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [movingBall, setMovingBall] = useState<null | {color: BallColor; path: [number, number][]}>(null);
  const [movingStep, setMovingStep] = useState(0);
  const animationRef = useRef<number | null>(null);
  
  // High score state
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  
  const [poppingBalls, setPoppingBalls] = useState<Set<string>>(new Set());
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);
  const [pathTrail, setPathTrail] = useState<[number, number][] | null>(null);
  const [notReachable, setNotReachable] = useState<boolean>(false);

  const highScoreManager = useMemo(() => new HighScoreManager(), []);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Initialize high scores
  useEffect(() => {
    const loadHighScores = () => {
      const currentHigh = highScoreManager.getCurrentHighScore();
      setCurrentHighScore(currentHigh);
    };

    loadHighScores();
  }, [highScoreManager]);

  // Stop timer on game over
  useEffect(() => {
    if (gameOver) setTimerActive(false);
  }, [gameOver]);

  // Check for new high score
  const checkForNewHighScore = (currentScore: number): boolean => {
    if (highScoreManager.isNewHighScore(currentScore)) {
      const success = highScoreManager.addHighScore(currentScore, timer);
      if (success) {
        setCurrentHighScore(highScoreManager.getCurrentHighScore());
        setIsNewHighScore(true);
        return true;
      }
    }
    return false;
  };

  // Handle cell click: select or move
  const handleCellClick = (x: number, y: number) => {
    if (gameOver || movingBall) return;
    const cell = board[y][x];
    if (cell.ball) {
      setSelected({ x, y });
      setBoard(prev => prev.map((row, yy) => row.map((c, xx) => ({ ...c, active: xx === x && yy === y }))));
    } else if (selected) {
      const path = findPath(board, selected, { x, y });
      if (path && path.length > 1) {
        // Start animation
        setMovingBall({ color: board[selected.y][selected.x].ball!.color, path });
        setMovingStep(0);
        setPathTrail(null);
        setNotReachable(false);

      }
    }
  };

  // Handle cell hover
  const handleCellHover = (x: number, y: number) => {
    setHoveredCell({ x, y });
    if (selected && !(selected.x === x && selected.y === y)) {
      const path = findPath(board, selected, { x, y });
      if (path && path.length > 1) {
        setPathTrail(path);
        setNotReachable(false);
      } else {
        setPathTrail(null);
        setNotReachable(true);
      }
    } else {
      setPathTrail(null);
      setNotReachable(false);
    }
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
    setPathTrail(null);
    setNotReachable(false);
  };

  // Animate the moving ball
  useEffect(() => {
    if (!movingBall) return;
    if (movingStep < movingBall.path.length - 1) {
      animationRef.current = setTimeout(() => setMovingStep(s => s + 1), ANIMATION_DURATIONS.MOVE_BALL);
    } else if (movingStep === movingBall.path.length - 1) {
      // Animation done, update board
      const [fromX, fromY] = movingBall.path[0];
      const [toX, toY] = movingBall.path[movingBall.path.length - 1];
      const newBoard = board.map(row => row.map(cell => ({ ...cell, active: false })));
      newBoard[toY][toX].ball = board[fromY][fromX].ball;
      newBoard[fromY][fromX].ball = null;
      // Explicitly clear incomingBall for the destination cell
      newBoard[toY][toX].incomingBall = null;
      
      // If we moved to a position that had a preview ball, recalculate incoming positions
      if (board[toY][toX].incomingBall) {
        if (isBoardFull(newBoard)) {
          // Board is full: clear all incoming balls, preserve the moved ball, and end game
          const clearedBoard = newBoard.map(row => row.map(cell => ({ ...cell, incomingBall: null })));
          setBoard(clearedBoard);
          setGameOver(true);
          setShowGameEndDialog(true);
        } else {
          // Not full: recalculate incoming positions as usual
          const recalculatedBoard = recalculateIncomingPositions(newBoard, nextBalls);
          setBoard(recalculatedBoard);
        }
      } else {
        setBoard(newBoard);
      }
      
      setSelected(null);
      setMovingBall(null);
      setMovingStep(0);
      // Start timer after first move
      if (!timerActive && timer === 0) {
        setTimerActive(true);
      }
      // Check for lines
      const movedColor = newBoard[toY][toX].ball?.color;
      const allLines: Set<string> = new Set();
      const ballsToRemove: [number, number][] = [];
      let lines: [number, number][][] = [];
      
      if (movedColor) {
        lines = findLine(newBoard, toX, toY, movedColor);
        lines.forEach(line => {
          line.forEach(([x, y]) => {
            allLines.add(`${x},${y}`);
            ballsToRemove.push([x, y]);
          });
        });
      }
      
      if (ballsToRemove.length > 0) {
        // Update line stats

        
        // Remove balls and update score
        const newBoard = board.map(row => row.map(cell => ({ ...cell })));
        ballsToRemove.forEach(([x, y]) => {
          newBoard[y][x].ball = null;
        });
        
        const pointsEarned = ballsToRemove.length;
        setScore(s => s + pointsEarned);
        
        // Set popping animation
        setPoppingBalls(new Set(ballsToRemove.map(([x, y]) => `${x},${y}`)));
        
        // Check for new high score
        const newScore = score + pointsEarned;
        checkForNewHighScore(newScore);
        
        // Clear popping balls after animation
        setTimeout(() => {
          setPoppingBalls(new Set());
          
          // Check if board is full after removing balls
          if (isBoardFull(newBoard)) {
            // Ensure the moved ball is present and all incomingBall are cleared
            const clearedBoard = newBoard.map(row => row.map(cell => ({ ...cell, incomingBall: null })));
            setBoard(clearedBoard);
            setGameOver(true);
            setShowGameEndDialog(true);
          }
          setNextBalls(getRandomNextBalls(BALLS_PER_TURN));
        }, ANIMATION_DURATIONS.POP_BALL);
      } else {
        // Only spawn as many balls as there are empty cells
        const emptyCount = getRandomEmptyCells(newBoard, BOARD_SIZE * BOARD_SIZE).length;
        if (emptyCount === 0) {
          // Board is full after move: clear all incoming balls, do not convert them, and end game
          const clearedBoard = newBoard.map(row => row.map(cell => ({ ...cell, incomingBall: null })));
          setBoard(clearedBoard);
          setGameOver(true);
          setShowGameEndDialog(true);
          return;
        }
        // Only convert incoming balls if there is at least one empty cell
        const ballsToAdd = Math.min(BALLS_PER_TURN, emptyCount);
        const boardWithRealBalls = newBoard.map(row => row.map(cell => ({
          ...cell,
          ball: cell.incomingBall ? cell.incomingBall : cell.ball,
          incomingBall: null
        })));
        // Generate next preview balls ONCE
        const nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN);
        // Add new preview balls for next turn, but only if there is space
        const afterBalls = ballsToAdd > 0 ? placePreviewBalls(boardWithRealBalls, nextPreviewBalls.slice(0, ballsToAdd)) : boardWithRealBalls;
        setBoard(afterBalls);
        setNextBalls(nextPreviewBalls);
        if (isBoardFull(afterBalls)) {
          setGameOver(true);
          setShowGameEndDialog(true);
        }
      }
    }
    return () => { if (animationRef.current) clearTimeout(animationRef.current); };
  }, [movingBall, movingStep]);

  // Start new game with 3 real balls and 3 incoming preview balls
  const startNewGame = () => {
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(BALLS_PER_TURN);
    const boardWithRealBalls = placePreviewBalls(board, initialBalls);
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    const boardWithPreview = placePreviewBalls(boardWithRealBalls, initialNext);
    setBoard(boardWithPreview);
    setScore(0);
    setSelected(null);
    setGameOver(false);
    setIsNewHighScore(false);
    setShowGameEndDialog(false);
    setNextBalls(initialNext);
    setTimer(0);
    setTimerActive(false);

  };

  // Game end dialog handlers
  const handleNewGameFromDialog = () => {
    setShowGameEndDialog(false);
    startNewGame();
  };

  const handleCloseDialog = () => {
    setShowGameEndDialog(false);
  };

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
