/**
 * Game Configuration
 *
 * This file contains all the configurable values that define the game's behavior.
 * Centralizing these values makes it easy to adjust game balance and behavior.
 */

// ============================================================================
// BALL COLORS
// ============================================================================

/** Available ball colors for the game */
export const BALL_COLORS = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "pink",
  "black",
] as const;

export type BallColor = (typeof BALL_COLORS)[number];

// ============================================================================
// BOARD CONFIGURATION
// ============================================================================

/** Size of the game board (9x9 grid) */
export const BOARD_SIZE = 9;

/** Number of rows and columns (same as BOARD_SIZE for square board) */
export const BOARD_ROWS = BOARD_SIZE;
export const BOARD_COLS = BOARD_SIZE;

// ============================================================================
// BALL CONFIGURATION
// ============================================================================

/** Number of balls spawned at the start of the game */
export const INITIAL_BALLS = 3;

/** Number of new balls spawned after each move */
export const BALLS_PER_TURN = 3;

/** Number of ball colors available in the game */
export const BALL_COLORS_COUNT = 7;

/** Minimum line length required to clear balls */
export const MIN_LINE_LENGTH = 5;

/** Maximum line length for scoring calculations */
export const MAX_LINE_LENGTH = 9;

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

/** Fibonacci sequence for line scoring (5, 8, 13, 21, 34, ...) */
export const FIBONACCI_SEQUENCE = [5, 8, 13, 21, 34];

/** Scoring table for different line lengths */
export const SCORING_TABLE: Record<number, number> = {
  5: 5,
  6: 8,
  7: 13,
  8: 21,
  9: 34,
};

// ============================================================================
// ANIMATION CONFIGURATION
// ============================================================================

/** Animation durations in milliseconds */
export const ANIMATION_DURATIONS = {
  /** Duration of ball movement animation */
  MOVE_BALL: 50,

  /** Duration of ball popping animation */
  POP_BALL: 300,

  /** Duration of ball spawning animation */
  SPAWN_BALL: 100,

  /** Duration of ball growing animation */
  GROW_BALL: 100,

  /** Duration of floating score animation */
  FLOATING_SCORE: 1000,

  /** Duration of transition animations */
  TRANSITION: 100,

  /** Duration of fade in/out animations */
  FADE: 300,
} as const;

// ============================================================================
// TIMER CONFIGURATION
// ============================================================================

/** Timer update interval in milliseconds */
export const TIMER_INTERVAL_MS = 1000;

/** Inactivity timeout before timer pauses (10 seconds) */
export const INACTIVITY_TIMEOUT_MS = 10000;

// ============================================================================
// GAME MECHANICS
// ============================================================================

/** Maximum number of balls that can be on the board before game over */
export const MAX_BOARD_BALLS = BOARD_SIZE * BOARD_SIZE;

/** Number of preview balls shown to the player */
export const PREVIEW_BALLS_COUNT = 3;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

/** Overlay transparency percentage (5% = 95% opacity) */
export const OVERLAY_OPACITY = 95;

/** Z-index values for different UI layers */
export const Z_INDEX = {
  /** Game board base layer */
  BOARD: 0,

  /** Moving ball animation layer */
  MOVING_BALL: 10,

  /** UI elements layer */
  UI: 20,

  /** Overlay layer */
  OVERLAY: 50,

  /** Dialog layer */
  DIALOG: 1000,
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

/** Local storage key for high score */
export const HIGH_SCORE_STORAGE_KEY = "lines-game-high-score";
