import React, { useState, useEffect, useRef, useMemo } from 'react';
import Board, { CELL_SIZE, GAP } from './Board';
import { colorMap } from './colorMap';
import HighScoreManager from '../utils/highScoreManager';
import GameEndDialog from './GameEndDialog';
import HighScoreDisplay from './HighScoreDisplay';
import type { HighScore } from '../utils/configManager';

// Types for the game
export type BallColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan' | 'black';

export interface Ball {
  color: BallColor;
}

export interface Cell {
  x: number;
  y: number;
  ball: Ball | null;
  incomingBall: Ball | null; // Add incoming ball for preview
  active: boolean;
}

const BOARD_SIZE = 9; // Default size from Java code
const BALL_COLORS: BallColor[] = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan', 'black'];
const BALLS_PER_TURN = 3;

const BALL_SIZE = 40;
const OFFSET = (CELL_SIZE - BALL_SIZE) / 2;

// Scoring system based on line length
function calculateLineScore(lineLength: number): number {
  switch (lineLength) {
    case 5: return 5;
    case 6: return 8;
    case 7: return 13;
    case 8: return 21;
    case 9: return 34;
    default: return lineLength; // Fallback for any other length
  }
}

function getRandomColor(): BallColor {
  return BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
}

function getRandomEmptyCells(board: Cell[][], count: number, exclude: Set<string> = new Set()): [number, number][] {
  const emptyCells: [number, number][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const key = `${x},${y}`;
      if (!board[y][x].ball && !exclude.has(key)) {
        emptyCells.push([x, y]);
      }
    }
  }
  // Shuffle and take 'count' cells
  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
  }
  return emptyCells.slice(0, count);
}

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => ({
      x,
      y,
      ball: null,
      incomingBall: null,
      active: false,
    }))
  );
}

// Helper to find a line in a direction
type Direction = [number, number];
const directions: Direction[] = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal up-right
];

function findLine(board: Cell[][], x: number, y: number, color: BallColor): [number, number][][] {
  const lines: [number, number][][] = [];
  for (const [dx, dy] of directions) {
    const line: [number, number][] = [[x, y]];
    // Forward
    let nx = x + dx, ny = y + dy;
    while (
      nx >= 0 && nx < BOARD_SIZE &&
      ny >= 0 && ny < BOARD_SIZE &&
      board[ny][nx].ball &&
      board[ny][nx].ball!.color === color
    ) {
      line.push([nx, ny]);
      nx += dx;
      ny += dy;
    }
    // Backward
    nx = x - dx;
    ny = y - dy;
    while (
      nx >= 0 && nx < BOARD_SIZE &&
      ny >= 0 && ny < BOARD_SIZE &&
      board[ny][nx].ball &&
      board[ny][nx].ball!.color === color
    ) {
      line.unshift([nx, ny]);
      nx -= dx;
      ny -= dy;
    }
    if (line.length >= 5) {
      lines.push(line);
    }
  }
  return lines;
}

function isBoardFull(board: Cell[][]): boolean {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!board[y][x].ball) return false;
    }
  }
  return true;
}

function getRandomNextBalls(count: number): BallColor[] {
  return Array.from({ length: count }, () => getRandomColor());
}

function placePreviewBalls(board: Cell[][], colors: BallColor[], exclude: Set<string> = new Set()): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const positions = getRandomEmptyCells(newBoard, colors.length, exclude);
  positions.forEach(([x, y], i) => {
    newBoard[y][x].incomingBall = { color: colors[i] };
  });
  return newBoard;
}

function recalculateIncomingPositions(board: Cell[][], colors: BallColor[]): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  // Remove all incoming balls
  newBoard.forEach(row => row.forEach(cell => {
    cell.incomingBall = null;
  }));
  
  // Place new incoming balls
  return placePreviewBalls(newBoard, colors);
}

// Helper to get the pixel position of a cell in the board
const getCellPosition = (x: number, y: number) => ({
  left: x * (CELL_SIZE + GAP) + OFFSET,
  top: y * (CELL_SIZE + GAP) + OFFSET,
});

const MovingBall: React.FC<{ color: string; left: number; top: number }> = ({ color, left, top }) => (
  <div
    className="absolute rounded-full border-2 border-[#555] z-10 pointer-events-none shadow-[0_0_8px_2px_#ffe082]"
    style={{
      width: 40,
      height: 40,
      background: color,
      left,
      top,
      transition: 'left 0.08s linear, top 0.08s linear',
    }}
  />
);

const InfoContainer: React.FC<{ highScores: HighScore[]; isNewHighScore: boolean; currentScore?: number; currentSessionScore?: number; showGuide?: boolean }> = ({
  highScores,
  isNewHighScore,
  currentScore,
  currentSessionScore,
  showGuide = false
}) => (
  <div
    className="mx-auto mt-8 p-6 border border-[#222] rounded-xl max-w-xl w-full bg-[#23272f] text-[#f5f7fa] shadow-lg"
  >
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
        <h2>Guide</h2>
        <ul>
          <li>Click a ball to select it, then click an empty cell to move it (if a path exists).</li>
          <li>Form lines of 5 or more balls of the same color (horizontally, vertically, or diagonally) to clear them and score points.</li>
          <li>After each move, new balls (shown in the preview) will appear on the board.</li>
          <li>The game ends when the board is full and no more moves are possible.</li>
        </ul>
      </>
    ) : (
      <HighScoreDisplay highScores={highScores} isNewHighScore={isNewHighScore} currentScore={currentScore} currentSessionScore={currentSessionScore} />
    )}
  </div>
);

const NextBallsPreview: React.FC<{ nextBalls: BallColor[] }> = ({ nextBalls }) => {
  return (
    <div className="flex justify-center items-center gap-3">
      {nextBalls.map((color, i) => (
        <span
          key={i}
          className="block w-8 h-8 rounded-full border-2 border-[#888] text-center align-middle"
          style={{
            background: colorMap[color],
            margin: '0 4px',
          }}
          title={color}
        />
      ))}
    </div>
  );
};

// Helper to format time as hh:mm:ss or mm:ss
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

export interface GameToggleProps {
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
  showHighScores: boolean;
  setShowHighScores: (v: boolean) => void;
}

export const ToggleBar: React.FC<GameToggleProps> = ({ showGuide, setShowGuide, showHighScores, setShowHighScores }) => (
  <div className="flex justify-center gap-3 w-full max-w-xl mx-auto">
    <button
      onClick={() => setShowGuide(!showGuide)}
      className={`font-semibold text-base px-4 py-2 rounded-lg border-none cursor-pointer min-w-[120px] transition-colors ${
        showGuide ? 'bg-[#ffe082] text-black' : 'bg-[#444] text-white hover:bg-[#555]'
      }`}
    >
      {showGuide ? 'Hide Guide' : 'Show Guide'}
    </button>
    <button
      onClick={() => setShowHighScores(!showHighScores)}
      className={`font-semibold text-base px-4 py-2 rounded-lg border-none cursor-pointer min-w-[120px] transition-colors ${
        showHighScores ? 'bg-[#ffe082] text-black' : 'bg-[#444] text-white hover:bg-[#555]'
      }`}
    >
      {showHighScores ? 'Hide Scores' : 'Show Scores'}
    </button>
  </div>
);

interface GameProps extends GameToggleProps {
  initialBoard?: Cell[][];
  initialNextBalls?: BallColor[];
}

const Game: React.FC<GameProps> = ({ showGuide, showHighScores, initialBoard, initialNextBalls }) => {
  const [board, setBoard] = useState<Cell[][]>(() => {
    if (initialBoard && initialNextBalls) {
      // Use provided initial board and preview balls
      return placePreviewBalls(initialBoard, initialNextBalls);
    }
    // Start with empty board, add 3 real balls, then add 3 incoming preview balls
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(BALLS_PER_TURN);
    // Place 3 real balls on the board
    const positions = getRandomEmptyCells(board, BALLS_PER_TURN);
    const boardWithRealBalls = board.map(row => row.map(cell => ({ ...cell })));
    positions.forEach(([x, y], i) => {
      boardWithRealBalls[y][x].ball = { color: initialBalls[i] };
    });
    // Add 3 incoming preview balls
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

  // Pathfinding for animation: returns the path as a list of [x, y] from start to end
  function findPath(board: Cell[][], from: {x: number, y: number}, to: {x: number, y: number}): [number, number][] | null {
    if (from.x === to.x && from.y === to.y) return null;
    const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
    const prev: (null | [number, number])[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    const queue: [number, number][] = [[from.x, from.y]];
    visited[from.y][from.x] = true;
    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0]
    ];
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      for (const [dx, dy] of directions) {
        const nx = x + dx, ny = y + dy;
        if (
          nx >= 0 && nx < BOARD_SIZE &&
          ny >= 0 && ny < BOARD_SIZE &&
          !visited[ny][nx] &&
          !board[ny][nx].ball
        ) {
          visited[ny][nx] = true;
          prev[ny][nx] = [x, y];
          if (nx === to.x && ny === to.y) {
            // Reconstruct path
            const path: [number, number][] = [];
            let cx = nx, cy = ny;
            while (!(cx === from.x && cy === from.y)) {
              path.push([cx, cy]);
              [cx, cy] = prev[cy][cx]!;
            }
            path.push([from.x, from.y]);
            path.reverse();
            return path;
          }
          queue.push([nx, ny]);
        }
      }
    }
    return null;
  }

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
      animationRef.current = setTimeout(() => setMovingStep(s => s + 1), 80);
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
          line.forEach(([lx, ly]) => {
            const key = `${lx},${ly}`;
            if (!allLines.has(key)) {
              allLines.add(key);
              ballsToRemove.push([lx, ly]);
            }
          });
        });
      }
      if (ballsToRemove.length > 0) {
        // Popping animation: mark balls as popping, then remove after delay
        setPoppingBalls(new Set(ballsToRemove.map(([lx, ly]) => `${lx},${ly}`)));
        setTimeout(() => {
          // If the board is full after the move, exclude the destination cell from removal
          let filteredBallsToRemove = ballsToRemove;
          if (isBoardFull(newBoard)) {
            filteredBallsToRemove = ballsToRemove.filter(([lx, ly]) => !(lx === toX && ly === toY));
          }
          filteredBallsToRemove.forEach(([lx, ly]) => {
            newBoard[ly][lx].ball = null;
          });
          setBoard(newBoard);
          setPoppingBalls(new Set());
          // Calculate score based on line lengths
          let totalScore = 0;
          const newLineStats = { ...lineStats };
          if (lines.length > 0) {
            lines.forEach(line => {
              const len = line.length;
              const pts = calculateLineScore(len);
              totalScore += pts;
              if (!newLineStats[len]) newLineStats[len] = { count: 0, points: 0 };
              newLineStats[len].count += 1;
              newLineStats[len].points += pts;
            });
          }
          setLineStats(newLineStats);
          const newScore = score + totalScore;
          setScore(newScore);
          // Check for new high score
          checkForNewHighScore(newScore);
          if (isBoardFull(newBoard)) {
            // Ensure the moved ball is present and all incomingBall are cleared
            const clearedBoard = newBoard.map(row => row.map(cell => ({ ...cell, incomingBall: null })));
            setBoard(clearedBoard);
            setGameOver(true);
            setShowGameEndDialog(true);
          }
          setNextBalls(getRandomNextBalls(BALLS_PER_TURN));
        }, 300); // 300ms for popping animation
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
    // Place 3 real balls on the board
    const positions = getRandomEmptyCells(board, BALLS_PER_TURN);
    const boardWithRealBalls = board.map(row => row.map(cell => ({ ...cell })));
    positions.forEach(([x, y], i) => {
      boardWithRealBalls[y][x].ball = { color: initialBalls[i] };
    });
    // Add 3 incoming preview balls
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

  // UI state for toggles
  // REMOVE: const [showGuide, setShowGuide] = useState(false);
  // REMOVE: const [showHighScores, setShowHighScores] = useState(false);

  // Render the moving ball absolutely above the board
  let movingBallEl = null;
  if (movingBall && movingStep < movingBall.path.length) {
    const [mx, my] = movingBall.path[movingStep];
    const { left, top } = getCellPosition(mx, my);
    movingBallEl = (
      <MovingBall color={colorMap[movingBall.color]} left={left} top={top} />
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
          <div className="flex flex-row items-center justify-between">
            <button 
              onClick={startNewGame} 
              className="font-semibold text-lg px-4 py-2 rounded-lg border-none bg-[#444] text-white cursor-pointer hover:bg-[#555] transition-colors"
            >
              New Game
            </button>
            <div className="flex-1 flex justify-center items-center">
              <NextBallsPreview nextBalls={nextBalls} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-bold text-2xl text-[#ffe082]">Score: {score}</span>
              <span className="text-sm text-[#ccc]">Best: {currentHighScore}</span>
            </div>
          </div>
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
