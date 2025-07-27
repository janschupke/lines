import { BALL_COLORS } from "../config";
import type { FloatingScore, GrowingBall } from "../../hooks/useGameAnimation";

export type BallColor = (typeof BALL_COLORS)[number];

export interface Ball {
  color: BallColor;
}

export interface Cell {
  x: number;
  y: number;
  ball: Ball | null;
  incomingBall: Ball | null;
  active: boolean;
}

export type Direction = [number, number];

export interface LineScore {
  length: number;
  score: number;
  turnNumber: number;
  timestamp: number;
}

export interface GameStatistics {
  turnsCount: number;
  linesPopped: number;
  longestLinePopped: number;
}

export interface GameState {
  board: Cell[][];
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  currentGameBeatHighScore: boolean;
  selected: { x: number; y: number } | null;
  gameOver: boolean;
  nextBalls: BallColor[];
  timer: number;
  timerActive: boolean;
  movingBall: { color: BallColor; path: [number, number][] } | null;
  movingStep: number;
  poppingBalls: Set<string>;
  hoveredCell: { x: number; y: number } | null;
  pathTrail: [number, number][] | null;
  notReachable: boolean;
  showGameEndDialog: boolean;
  statistics: GameStatistics;
  floatingScores: FloatingScore[];
  growingBalls: GrowingBall[];
}

export interface GameActions {
  startNewGame: () => void;
  handleCellClick: (x: number, y: number) => void;
  handleCellHover: (x: number, y: number) => void;
  handleCellLeave: () => void;
  handleNewGameFromDialog: () => void;
  handleCloseDialog: () => void;
  checkAndUpdateHighScore: (score: number) => boolean;
  resetNewHighScoreFlag: () => void;
  resetCurrentGameHighScoreFlag: () => void;
}

// Game Phase Management Types
export interface GamePhase {
  type: "idle" | "moving" | "popping" | "converting" | "spawning" | "gameOver";
  data?: Record<string, unknown>;
}

export interface MoveResult {
  newBoard: Cell[][];
  linesFormed: boolean;
  ballsRemoved?: [number, number][];
  pointsEarned?: number;
  nextBalls?: BallColor[];
  steppedOnIncomingBall?: BallColor;
}

export interface ConversionResult {
  newBoard: Cell[][];
  nextBalls: BallColor[];
  gameOver: boolean;
  linesFormed?: boolean;
  ballsRemoved?: [number, number][];
  pointsEarned?: number;
}

// Board State Types
export interface BoardState {
  board: Cell[][];
  nextBalls: BallColor[];
  setBoard: (board: Cell[][]) => void;
  setNextBalls: (nextBalls: BallColor[], board?: Cell[][]) => void;
}

// Animation Types
export interface AnimationState {
  movingBall: { color: BallColor; path: [number, number][] } | null;
  movingStep: number;
  poppingBalls: Set<string>;
  setMovingBall: (
    ball: { color: BallColor; path: [number, number][] } | null,
  ) => void;
  setMovingStep: (step: number) => void;
  setPoppingBalls: (balls: Set<string>) => void;
}

// Enhanced Animation Types
export interface AnimationPhase {
  type: "idle" | "moving" | "popping" | "spawning" | "converting";
  data?: {
    movingBall?: { color: BallColor; path: [number, number][] };
    poppingBalls?: Set<string>;
    spawningBalls?: Array<{
      x: number;
      y: number;
      color: BallColor;
      isTransitioning: boolean;
    }>;
  };
}

export interface SpawnedBall {
  x: number;
  y: number;
  color: BallColor;
  isTransitioning: boolean; // true if transitioning from preview to real, false if new preview
  originalPosition?: { x: number; y: number }; // for stepped-on balls that get relocated
  id?: string; // optional ID for animation tracking
}

export interface GameTurnState {
  phase: "idle" | "moving" | "popping" | "spawning" | "converting" | "gameOver";
  moveData?: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    steppedOnPreview?: BallColor;
  };
  spawnedBalls?: SpawnedBall[];
  poppedBalls?: [number, number][];
  pointsEarned?: number;
}

// Timer Types
export interface TimerState {
  timer: number;
  timerActive: boolean;
  setTimerActive: (active: boolean) => void;
  resetTimer: () => void;
  onActivity: () => void;
}
