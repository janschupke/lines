import { BALL_COLORS } from "../config";
import type { FloatingScore, GrowingBall } from "../../hooks/useGameAnimation";

export type BallColor = typeof BALL_COLORS[number];

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
  gameDuration: number;
  linesPopped: number;
  individualBallsPopped: number;
  longestLinePopped: number;
  averageScorePerTurn: number;
  totalScore: number;
  scoreProgression: number[];
  lineScores: number[];
  peakScore: number;
  consecutiveHighScores: number;
  ballsCleared: number;
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
  type: "idle" | "moving" | "popping" | "converting" | "gameOver";
  data?: Record<string, unknown>;
}

export interface MoveResult {
  newBoard: Cell[][];
  linesFormed: boolean;
  ballsRemoved?: [number, number][];
  pointsEarned?: number;
  nextBalls?: BallColor[];
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
  setMovingBall: (ball: { color: BallColor; path: [number, number][] } | null) => void;
  setMovingStep: (step: number) => void;
  setPoppingBalls: (balls: Set<string>) => void;
}

// Timer Types
export interface TimerState {
  timer: number;
  timerActive: boolean;
  setTimerActive: (active: boolean) => void;
  resetTimer: () => void;
  onActivity: () => void;
}
