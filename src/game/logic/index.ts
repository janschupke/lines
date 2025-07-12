import { BOARD_SIZE, BALL_COLORS, type BallColor } from '../constants';
import type { Cell, Direction } from '../types';

const DIRECTIONS: Direction[] = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal up-right
];

// Game Logic Functions
export function getRandomColor(): BallColor {
  return BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
}

export function getRandomNextBalls(count: number): BallColor[] {
  return Array.from({ length: count }, () => getRandomColor());
}

export function createEmptyBoard(): Cell[][] {
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

export function getRandomEmptyCells(board: Cell[][], count: number, exclude: Set<string> = new Set()): [number, number][] {
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

// NEW: Function to place real balls (not preview balls)
export function placeRealBalls(board: Cell[][], colors: BallColor[], exclude: Set<string> = new Set()): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const positions = getRandomEmptyCells(newBoard, colors.length, exclude);
  positions.forEach(([x, y], i) => {
    newBoard[y][x].ball = { color: colors[i] };
  });
  return newBoard;
}

export function placePreviewBalls(board: Cell[][], colors: BallColor[], exclude: Set<string> = new Set()): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const positions = getRandomEmptyCells(newBoard, colors.length, exclude);
  positions.forEach(([x, y], i) => {
    newBoard[y][x].incomingBall = { color: colors[i] };
  });
  return newBoard;
}

export function recalculateIncomingPositions(board: Cell[][], colors: BallColor[]): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  // Remove all incoming balls
  newBoard.forEach(row => row.forEach(cell => {
    cell.incomingBall = null;
  }));
  
  // Place new incoming balls
  return placePreviewBalls(newBoard, colors);
}

export function isBoardFull(board: Cell[][]): boolean {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!board[y][x].ball) return false;
    }
  }
  return true;
}

export function findLine(board: Cell[][], x: number, y: number, color: BallColor): [number, number][][] {
  const lines: [number, number][][] = [];
  for (const [dx, dy] of DIRECTIONS) {
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

export function findPath(board: Cell[][], from: {x: number, y: number}, to: {x: number, y: number}): [number, number][] | null {
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
