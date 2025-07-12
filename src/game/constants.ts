// Game Configuration
export const BOARD_SIZE = 9;
export const INITIAL_BALLS = 3;
export const BALLS_PER_TURN = 3;

// Ball Colors - now using Tailwind theme colors
export type BallColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan' | 'black';

export const BALL_COLORS: BallColor[] = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan', 'black'];

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

export const TIMER_INTERVAL_MS = 1000; 
