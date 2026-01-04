import { BallColor } from "../config";
import type { FloatingScore, GrowingBall } from "../hooks/useGameAnimation";
import { LineDirection as LineDirectionEnum } from "./enums";
export { TurnPhase, LineDirection } from "./enums";
export type { BallColor } from "../config";

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

/**
 * Coordinate type
 */
export interface Coord {
  x: number;
  y: number;
}

export interface GameStatistics {
  turnsCount: number;
  linesPopped: number;
  longestLinePopped: number;
}

/**
 * Pure game state - serializable, testable, no UI concerns
 */
export interface GameState {
  board: Cell[][];
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  currentGameBeatHighScore: boolean;
  gameOver: boolean;
  nextBalls: BallColor[];
  timer: number;
  timerActive: boolean;
  statistics: GameStatistics;
  showGameEndDialog: boolean;
}

/**
 * UI state - presentation concerns, not serialized
 */
export interface UIState {
  selected: { x: number; y: number } | null;
  hoveredCell: { x: number; y: number } | null;
  pathTrail: [number, number][] | null;
  notReachable: boolean;
  movingBall: {
    color: BallColor;
    path: [number, number][];
    from: { x: number; y: number };
    to: { x: number; y: number };
    boardSnapshot: Cell[][];
  } | null;
  movingStep: number;
  poppingBalls: Set<string>;
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
}

/**
 * Represents a line of balls
 */
export interface Line {
  cells: [number, number][];
  color: BallColor;
  length: number;
  direction: (typeof LineDirectionEnum)[keyof typeof LineDirectionEnum];
}

/**
 * Result of line detection
 */
export interface LineDetectionResult {
  lines: Line[];
  ballsToRemove: [number, number][];
  score: number;
}

export interface ConversionResult {
  newBoard: Cell[][];
  nextBalls: BallColor[];
  gameOver: boolean;
  linesFormed?: boolean;
  ballsRemoved?: [number, number][];
  pointsEarned?: number;
  lines?: Line[]; // Lines that were formed (for statistics)
}

// SpawnedBall is still used in useGameAnimation hook for animation tracking
export interface SpawnedBall {
  x: number;
  y: number;
  color: BallColor;
  isTransitioning: boolean; // true if transitioning from preview to real, false if new preview
  originalPosition?: { x: number; y: number }; // for stepped-on balls that get relocated
  id?: string; // optional ID for animation tracking
}
