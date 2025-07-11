import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
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
const INITIAL_BALLS = 5;
const BALL_COLORS: BallColor[] = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan', 'black'];
const BALLS_PER_TURN = 3;

const BALL_SIZE = 40;
const OFFSET = (CELL_SIZE - BALL_SIZE) / 2;

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

function placeRandomBalls(board: Cell[][], count: number, exclude: Set<string> = new Set()): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const positions = getRandomEmptyCells(newBoard, count, exclude);
  positions.forEach(([x, y]) => {
    newBoard[y][x].ball = { color: getRandomColor() };
  });
  return newBoard;
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

const MovingBall = styled.div<{color: string; left: number; top: number}>`
  position: absolute;
  width: ${BALL_SIZE}px;
  height: ${BALL_SIZE}px;
  border-radius: 50%;
  background: ${props => props.color};
  border: 2px solid #555;
  box-shadow: 0 0 8px 2px #ffe082;
  z-index: 10;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
  transition: left 0.08s linear, top 0.08s linear;
  pointer-events: none;
`;

const InfoContainer: React.FC<{ highScores: HighScore[]; isNewHighScore: boolean; currentScore?: number; currentSessionScore?: number }> = ({ 
  highScores, 
  isNewHighScore, 
  currentScore,
  currentSessionScore
}) => (
  <div
    className="info-container"
    style={{
      margin: '32px auto 0 auto',
      padding: 24,
      border: '1px solid #222',
      borderRadius: 12,
      maxWidth: 600,
      width: '100%',
      background: '#23272f',
      color: '#f5f7fa',
      boxShadow: '0 2px 12px #0004',
    }}
  >
    <h2 style={{ marginTop: 0 }}>About</h2>
    <p>
      Lines is a puzzle game where you move colored balls on a grid to form lines of five or more of the same color. Each turn, new balls appear on the board. Try to keep the board from filling up and score as many points as possible!
    </p>
    <p>
      This is a React port of the original Java version.
    </p>
    <h2>Guide</h2>
    <ul>
      <li>Click a ball to select it, then click an empty cell to move it (if a path exists).</li>
      <li>Form lines of 5 or more balls of the same color (horizontally, vertically, or diagonally) to clear them and score points.</li>
      <li>After each move, new balls (shown in the preview) will appear on the board.</li>
      <li>The game ends when the board is full and no more moves are possible.</li>
    </ul>
    
    {/* Add high score display */}
    <div style={{ marginTop: 24 }}>
      <HighScoreDisplay 
        highScores={highScores.slice(0, 5)} 
        currentScore={isNewHighScore ? currentScore : undefined}
        isNewHighScore={isNewHighScore}
        currentSessionScore={currentSessionScore}
      />
    </div>
  </div>
);

const NextBallsPreview: React.FC<{ nextBalls: BallColor[] }> = ({ nextBalls }) => {
  const colorMap: Record<BallColor, string> = {
    red: '#e74c3c',
    green: '#27ae60',
    blue: '#2980b9',
    yellow: '#f1c40f',
    purple: '#8e44ad',
    cyan: '#1abc9c',
    black: '#222',
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      {nextBalls.map((color, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: colorMap[color],
            border: '2px solid #888',
            margin: '0 4px',
            verticalAlign: 'middle',
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

const Game: React.FC = () => {
  const [board, setBoard] = useState<Cell[][]>(() => {
    const initialBoard = placeRandomBalls(createEmptyBoard(), INITIAL_BALLS);
    return placePreviewBalls(initialBoard, getRandomNextBalls(BALLS_PER_TURN));
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
      }
    }
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
      
      // If we moved to a position that had a preview ball, recalculate incoming positions
      if (board[toY][toX].incomingBall) {
        const recalculatedBoard = recalculateIncomingPositions(newBoard, nextBalls);
        setBoard(recalculatedBoard);
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
      if (movedColor) {
        const lines = findLine(newBoard, toX, toY, movedColor);
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
        ballsToRemove.forEach(([lx, ly]) => {
          newBoard[ly][lx].ball = null;
        });
        setBoard(newBoard);
        const newScore = score + ballsToRemove.length;
        setScore(newScore);
        
        // Check for new high score
        checkForNewHighScore(newScore);
        
        if (isBoardFull(newBoard)) {
          setGameOver(true);
          setShowGameEndDialog(true);
        }
        setNextBalls(getRandomNextBalls(BALLS_PER_TURN));
      } else {
        // Only spawn as many balls as there are empty cells
        const emptyCount = getRandomEmptyCells(newBoard, BOARD_SIZE * BOARD_SIZE).length;
        if (emptyCount === 0) {
          setBoard(newBoard);
          setGameOver(true);
          return;
        }
        
        // Convert incoming balls to real balls, preserving existing balls
        const boardWithRealBalls = newBoard.map(row => row.map(cell => ({
          ...cell,
          ball: cell.incomingBall ? cell.incomingBall : cell.ball,
          incomingBall: null
        })));
        
        // Generate next preview balls ONCE
        const nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN);
        // Add new preview balls for next turn
        const afterBalls = placePreviewBalls(boardWithRealBalls, nextPreviewBalls);
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

  // Start new game with random balls and preview
  const startNewGame = () => {
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    const initialBoard = placeRandomBalls(createEmptyBoard(), INITIAL_BALLS);
    const boardWithPreview = placePreviewBalls(initialBoard, initialNext);
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
      <MovingBall color={colorMap[movingBall.color]} left={left} top={top} />
    );
  }

  return (
    <div className="game-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{ maxWidth: 600, width: '100%', margin: '0 auto', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={startNewGame} style={{ fontWeight: 600, fontSize: 18, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#444', color: '#fff', cursor: 'pointer' }}>New Game</button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <NextBallsPreview nextBalls={nextBalls} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 22, color: '#ffe082' }}>Score: {score}</span>
            <span style={{ fontSize: 14, color: '#ccc' }}>Best: {currentHighScore}</span>
          </div>
        </div>
      </div>
      <div style={{ height: 8 }} />
      <div className="game-container" style={{ maxWidth: 600, width: '100%', margin: '0 auto', padding: 0 }}>
        <Board board={board} onCellClick={handleCellClick} movingBall={movingBall}>
          {movingBallEl}
        </Board>
      </div>
      <div style={{ width: '100%', maxWidth: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, fontSize: 18, color: '#ffe082', letterSpacing: 1 }}>
        Game time: {formatTime(timer)}
      </div>
      <InfoContainer 
        highScores={highScores}
        isNewHighScore={isNewHighScore}
        currentScore={score}
        currentSessionScore={currentSessionScore}
      />
      
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
