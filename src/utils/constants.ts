// Game Configuration
export const BOARD_SIZE = 9;
export const BALLS_PER_TURN = 3;
export const BALL_SIZE = 40;
export const PADDING = 8;

// Ball Colors
export type BallColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan' | 'black';

export const BALL_COLORS: BallColor[] = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan', 'black'];

export const COLOR_MAP: Record<BallColor, string> = {
  red: '#e74c3c',
  green: '#27ae60',
  blue: '#2980b9',
  yellow: '#f1c40f',
  purple: '#8e44ad',
  cyan: '#1abc9c',
  black: '#222',
};

// Scoring System
export const SCORING_TABLE: Record<number, number> = {
  5: 5,
  6: 8,
  7: 13,
  8: 21,
  9: 34,
};

export function calculateLineScore(lineLength: number): number {
  return SCORING_TABLE[lineLength] || lineLength;
}

// Animation Durations
export const ANIMATION_DURATIONS = {
  MOVE_BALL: 80,
  POP_BALL: 300,
  TRANSITION: 200,
} as const;

// UI Colors
export const UI_COLORS = {
  BACKGROUND: '#23272f',
  CELL_EMPTY: '#eee',
  CELL_ACTIVE: '#ffe082',
  CELL_HOVER: '#bbb',
  CELL_PATH: '#b3d1ff',
  BORDER_DEFAULT: '#888',
  BORDER_PATH: '#1976d2',
  BORDER_ERROR: '#e74c3c',
  TEXT_PRIMARY: '#fff',
  TEXT_SECONDARY: '#ccc',
  TEXT_ACCENT: '#ffe082',
  BUTTON_PRIMARY: '#444',
  BUTTON_HOVER: '#555',
  BUTTON_ACCENT: '#ffe082',
  BUTTON_ACCENT_HOVER: '#ffb300',
} as const; 
