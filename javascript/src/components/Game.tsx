import React, { useState } from 'react';
import Board from './Board';
import InfoPanel from './InfoPanel';
import StatusBar from './StatusBar';

// Types for the game
export type BallColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan' | 'black';

export interface Ball {
  color: BallColor;
}

export interface Cell {
  x: number;
  y: number;
  ball: Ball | null;
  active: boolean;
}

const BOARD_SIZE = 9; // Default size from Java code
const INITIAL_BALLS = 5;
const BALL_COLORS: BallColor[] = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan', 'black'];
const BALLS_PER_TURN = 3;

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

// Pathfinding: BFS to check if a path exists between two cells
function pathExists(board: Cell[][], from: {x: number, y: number}, to: {x: number, y: number}): boolean {
  if (from.x === to.x && from.y === to.y) return false;
  const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
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
        if (nx === to.x && ny === to.y) return true;
        visited[ny][nx] = true;
        queue.push([nx, ny]);
      }
    }
  }
  return false;
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
    newBoard[y][x].ball = { color: colors[i] };
  });
  return newBoard;
}

const About: React.FC = () => (
  <div className="about-container" style={{ marginTop: 32, padding: 16, border: '1px solid #ccc', borderRadius: 8, maxWidth: 400 }}>
    <h2>About</h2>
    <p>
      Lines is a puzzle game where you move colored balls on a grid to form lines of five or more of the same color. Each turn, new balls appear on the board. Try to keep the board from filling up and score as many points as possible!
    </p>
    <p>
      This is a JavaScript/React port of the original Java version.
    </p>
  </div>
);

const Guide: React.FC = () => (
  <div className="guide-container" style={{ marginTop: 32, padding: 16, border: '1px solid #ccc', borderRadius: 8, maxWidth: 400 }}>
    <h2>Guide</h2>
    <ul>
      <li>Click a ball to select it, then click an empty cell to move it (if a path exists).</li>
      <li>Form lines of 5 or more balls of the same color (horizontally, vertically, or diagonally) to clear them and score points.</li>
      <li>After each move, new balls (shown in the preview) will appear on the board.</li>
      <li>The game ends when the board is full and no more moves are possible.</li>
    </ul>
  </div>
);

const Game: React.FC = () => {
  const [board, setBoard] = useState<Cell[][]>(() => placeRandomBalls(createEmptyBoard(), INITIAL_BALLS));
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('Game in progress');
  const [selected, setSelected] = useState<{x: number, y: number} | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [nextBalls, setNextBalls] = useState<BallColor[]>(() => getRandomNextBalls(BALLS_PER_TURN));

  // Handle cell click: select or move
  const handleCellClick = (x: number, y: number) => {
    if (gameOver) return;
    const cell = board[y][x];
    if (cell.ball) {
      setSelected({ x, y });
      setBoard(prev => prev.map((row, yy) => row.map((c, xx) => ({ ...c, active: xx === x && yy === y }))));
      setStatus(`Selected ball at (${x}, ${y})`);
    } else if (selected) {
      if (pathExists(board, selected, { x, y })) {
        const newBoard = board.map(row => row.map(cell => ({ ...cell, active: false })));
        newBoard[y][x].ball = board[selected.y][selected.x].ball;
        newBoard[selected.y][selected.x].ball = null;
        setSelected(null);
        // Check for lines
        const movedColor = newBoard[y][x].ball?.color;
        const allLines: Set<string> = new Set();
        const ballsToRemove: [number, number][] = [];
        if (movedColor) {
          const lines = findLine(newBoard, x, y, movedColor);
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
          setScore(s => s + ballsToRemove.length);
          setStatus(`Removed ${ballsToRemove.length} balls!`);
          if (isBoardFull(newBoard)) {
            setGameOver(true);
            setStatus('Game over! Board is full.');
          }
          setNextBalls(getRandomNextBalls(BALLS_PER_TURN));
        } else {
          // Only spawn as many balls as there are empty cells
          const emptyCount = getRandomEmptyCells(newBoard, BOARD_SIZE * BOARD_SIZE).length;
          if (emptyCount === 0) {
            setBoard(newBoard);
            setGameOver(true);
            setStatus('Game over! Board is full.');
            return;
          }
          const afterBalls = placePreviewBalls(newBoard, nextBalls.slice(0, Math.min(BALLS_PER_TURN, emptyCount)));
          setBoard(afterBalls);
          setStatus(`Moved ball to (${x}, ${y}) and spawned ${Math.min(BALLS_PER_TURN, emptyCount)} balls.`);
          setNextBalls(getRandomNextBalls(BALLS_PER_TURN));
          if (isBoardFull(afterBalls)) {
            setGameOver(true);
            setStatus('Game over! Board is full.');
          }
        }
      } else {
        setStatus('No path to target cell');
      }
    }
  };

  // Start new game with random balls and preview
  const startNewGame = () => {
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    setBoard(placeRandomBalls(createEmptyBoard(), INITIAL_BALLS));
    setScore(0);
    setStatus('New game started');
    setSelected(null);
    setGameOver(false);
    setNextBalls(initialNext);
  };

  return (
    <div className="game-layout" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 32 }}>
      <div className="game-container">
        <InfoPanel score={score} onNewGame={startNewGame} nextBalls={nextBalls} />
        <Board board={board} onCellClick={handleCellClick} />
        <StatusBar status={status} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <About />
        <Guide />
      </div>
    </div>
  );
};

export default Game; 