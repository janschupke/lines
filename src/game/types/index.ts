import { type BallColor as _BallColor } from "../constants";
export type BallColor = _BallColor;

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
  ballsCleared: number;
  linesPopped: number;
  longestLinePopped: number;
  individualBallsPopped: number;
  totalScore: number;
  scoreProgression: number[];
  lineScores: LineScore[];
  averageScorePerTurn: number;
  ballsPerTurn: number;
  linesPerTurn: number;
  peakScore: number;
  consecutiveHighScores: number;
  strategicBonus: number;
}

export interface GameState {
  board: Cell[][];
  score: number;
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
  currentHighScore: number;
  isNewHighScore: boolean;
  showGameEndDialog: boolean;
  statistics: GameStatistics;
}

export interface GameActions {
  startNewGame: () => void;
  handleCellClick: (x: number, y: number) => void;
  handleCellHover: (x: number, y: number) => void;
  handleCellLeave: () => void;
  handleNewGameFromDialog: () => void;
  handleCloseDialog: () => void;
}
