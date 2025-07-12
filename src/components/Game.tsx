import React, { useState, useEffect, useRef, useMemo } from 'react';
import Board from './Board';
import GameEndDialog from './GameEndDialog';
import HighScoreDisplay from './HighScoreDisplay';
import GameHeader from './ui/GameHeader';
import MovingBall from './ui/MovingBall';
import { 
  BOARD_SIZE, 
  BALLS_PER_TURN, 
  BALL_SIZE, 
  calculateLineScore,
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
import type { HighScore } from '../utils/configManager';

const OFFSET = (CELL_SIZE - BALL_SIZE) / 2;

// Helper to get the pixel position of a cell in the board
const getCellPosition = (x: number, y: number) => ({
  left: x * (CELL_SIZE + GAP) + OFFSET,
  top: y * (CELL_SIZE + GAP) + OFFSET,
});

const InfoContainer: React.FC<{ 
  highScores: HighScore[]; 
  isNewHighScore: boolean; 
  currentScore?: number; 
  currentSessionScore?: number; 
  showGuide?: boolean 
}> = ({
  highScores,
  isNewHighScore,
  currentScore,
  currentSessionScore,
  showGuide = false
}) => (
  <div className="mx-auto mt-8 p-6 border border-[#222] rounded-xl max-w-xl w-full bg-[#23272f] text-[#f5f7fa] shadow-lg">
    {showGuide ? (
      <>
        <h2 className="mt-0">About</h2>
        <p>
          Lines is a puzzle game where you move colored balls on a grid to form lines of five or more of the same color. Each turn, new balls appear on the board. Try to keep the board from filling up and score as many points as possible!
        </p>
        <p>
          This is a React port of the original Java version.
        </p>
        <h2>Scoring</h2>
        <p>Score points by forming lines of the same color:</p>
        <ul>
          <li>Line of 5 balls: 5 points</li>
          <li>Line of 6 balls: 8 points</li>
          <li>Line of 7 balls: 13 points</li>
          <li>Line of 8 balls: 21 points</li>
          <li>Line of 9 balls: 34 points</li>
        </ul>
        <h2>How to Play</h2>
        <p>
          Click on a ball to select it, then click on an empty cell to move it there. 
          The ball will follow the shortest path to its destination. 
          After each move, new balls appear on the board.
        </p>
        <p>
          Form lines of 5 or more balls of the same color to score points and remove them from the board.
          The game ends when the board is full.
        </p>
      </>
    ) : (
      <HighScoreDisplay 
        highScores={highScores} 
        currentScore={isNewHighScore ? currentScore : undefined}
        isNewHighScore={isNewHighScore}
        currentSessionScore={currentSessionScore}
      />
    )}
  </div>
);

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
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  const [currentSessionScore, setCurrentSessionScore] = useState(0);
  
  const [poppingBalls, setPoppingBalls] = useState<Set<string>>(new Set());
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);
  const [pathTrail, setPathTrail] = useState<[number, number][] | null>(null);
  const [notReachable, setNotReachable] = useState<boolean>(false);
  const [totalMoves, setTotalMoves] = useState(0);
  const [lineStats, setLineStats] = useState<{ [length: number]: { count: number, points: number } }>({});

  const highScoreManager = useMemo(() => new HighScoreManager(), []);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Initialize high scores
  useEffect(() => {
    const loadHighScores = () => {
      const scores = highScoreManager.getHighScores();
      const currentHigh = highScoreManager.getCurrentHighScore();
      const config = highScoreManager.getConfig();
      setHighScores(scores);
      setCurrentHighScore(currentHigh);
      setCurrentSessionScore(config.currentSessionScore || 0);
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
        setHighScores(highScoreManager.getHighScores());
        setCurrentHighScore(highScoreManager.getCurrentHighScore());
        setCurrentSessionScore(highScoreManager.getConfig().currentSessionScore || 0);
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
        setTotalMoves(m => m + 1);
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
        setLineStats(prev => {
          const newStats = { ...prev };
          lines.forEach(line => {
            const length = line.length;
            if (!newStats[length]) {
              newStats[length] = { count: 0, points: 0 };
            }
            newStats[length].count++;
            newStats[length].points += calculateLineScore(length);
          });
          return newStats;
        });
        
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
    setTotalMoves(0);
    setLineStats({});
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

  // Overlay for end game
  const showOverlay = gameOver && !showGuide && !showHighScores;

  return (
    <div className="game-layout flex flex-col items-center gap-0">
      {/* ToggleBar is now rendered in App.tsx sticky header */}
      <div className="max-w-xl w-full mx-auto mb-4">
        {/* Game header - only show when not showing guide or scores */}
        {!showGuide && !showHighScores && (
          <GameHeader
            score={score}
            currentHighScore={currentHighScore}
            nextBalls={nextBalls}
            onNewGame={startNewGame}
          />
        )}
      </div>
      
      {/* Game content - only show when not showing guide or scores */}
      {!showGuide && !showHighScores && (
        <>
          <div className="h-2" />
          <div className="game-container max-w-xl w-full mx-auto p-0 relative">
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
            {/* End game overlay */}
            {showOverlay && (
              <div className="absolute inset-0 bg-[rgba(30,30,40,0.72)] flex flex-col items-center justify-center pointer-events-auto z-20">
                <div className="text-5xl font-black text-[#ffe082] drop-shadow-lg">Much Balls...</div>
                {isNewHighScore && (
                  <div className="mt-4 text-2xl text-[#8bc34a] font-bold drop-shadow-lg">
                    New High Score!
                  </div>
                )}
                <div className="mt-8 p-6 bg-[#23272f] bg-opacity-90 rounded-xl text-white min-w-[320px] shadow-2xl">
                  <div className="text-xl font-bold mb-2">Game Summary</div>
                  <div className="text-base mb-1">Total time: <b>{formatTime(timer)}</b></div>
                  <div className="text-base mb-1">Total moves: <b>{totalMoves}</b></div>
                  <div className="text-base mt-3 mb-1">Scored lines:</div>
                  <table className="w-full text-white text-sm border-collapse">
                    <thead>
                      <tr className="text-[#ffe082]">
                        <th align="left">Line Length</th>
                        <th align="right">Count</th>
                        <th align="right">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[5,6,7,8,9].map(len => (
                        <tr key={len}>
                          <td>Line of {len}</td>
                          <td align="right">{lineStats[len]?.count || 0}</td>
                          <td align="right">{lineStats[len]?.points || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 text-base text-[#ffe082] font-semibold">
                    Total points from lines: <b>{[5,6,7,8,9].reduce((sum, len) => sum + (lineStats[len]?.points || 0), 0)}</b>
                  </div>
                  <button onClick={startNewGame} className="mt-6 font-semibold text-lg px-4 py-2 rounded-lg border-none bg-[#444] text-white cursor-pointer hover:bg-[#555]">New Game</button>
                </div>
              </div>
            )}
          </div>
          <div className="w-full max-w-xl flex justify-center items-center mt-4 text-lg text-[#ffe082] tracking-wide">
            Game time: {formatTime(timer)}
          </div>
        </>
      )}
      
      {/* Guide content */}
      {showGuide && (
        <div className="max-w-xl w-full mx-auto">
          <InfoContainer 
            highScores={highScores}
            isNewHighScore={isNewHighScore}
            currentScore={score}
            currentSessionScore={currentSessionScore}
            showGuide={true}
          />
        </div>
      )}
      
      {/* High scores content */}
      {showHighScores && (
        <div className="max-w-xl w-full mx-auto">
          <HighScoreDisplay 
            highScores={highScores}
            currentScore={isNewHighScore ? score : undefined}
            isNewHighScore={isNewHighScore}
            currentSessionScore={currentSessionScore}
          />
        </div>
      )}
      
      {/* Add game end dialog */}
      <GameEndDialog
        isOpen={showGameEndDialog}
        score={score}
        isNewHighScore={isNewHighScore}
        onNewGame={handleNewGameFromDialog}
        onClose={handleCloseDialog}
      />
    </div>
  );
};

export default Game; 
