// Game Configuration
export const BOARD_SIZE = 9;
export const BALLS_PER_TURN = 3;
export const BALL_SIZE = 40;
export const PADDING = 8;

// Ball Colors - now using Tailwind theme colors
export type BallColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan' | 'black';

export const BALL_COLORS: BallColor[] = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan', 'black'];

// Color mapping using Tailwind theme classes instead of hex values
export const COLOR_MAP: Record<BallColor, string> = {
  red: 'ball-red',
  green: 'ball-green',
  blue: 'ball-blue',
  yellow: 'ball-yellow',
  purple: 'ball-purple',
  cyan: 'ball-cyan',
  black: 'ball-black',
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

// Theme color classes for easy reference
export const THEME_COLORS = {
  // Backgrounds
  BG_PRIMARY: 'game-bg-primary',
  BG_SECONDARY: 'game-bg-secondary',
  BG_TERTIARY: 'game-bg-tertiary',
  BG_BOARD: 'game-bg-board',
  BG_CELL_EMPTY: 'game-bg-cell-empty',
  BG_CELL_HOVER: 'game-bg-cell-hover',
  BG_CELL_ACTIVE: 'game-bg-cell-active',
  BG_CELL_PATH: 'game-bg-cell-path',
  
  // Text colors
  TEXT_PRIMARY: 'game-text-primary',
  TEXT_SECONDARY: 'game-text-secondary',
  TEXT_ACCENT: 'game-text-accent',
  TEXT_SUCCESS: 'game-text-success',
  TEXT_ERROR: 'game-text-error',
  
  // Border colors
  BORDER_DEFAULT: 'game-border-default',
  BORDER_PATH: 'game-border-path',
  BORDER_ERROR: 'game-border-error',
  BORDER_ACCENT: 'game-border-accent',
  BORDER_BALL: 'game-border-ball',
  BORDER_PREVIEW: 'game-border-preview',
  
  // Button colors
  BUTTON_PRIMARY: 'game-button-primary',
  BUTTON_HOVER: 'game-button-hover',
  BUTTON_ACCENT: 'game-button-accent',
  BUTTON_ACCENT_HOVER: 'game-button-accent-hover',
} as const; 
