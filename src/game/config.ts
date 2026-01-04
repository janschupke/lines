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

type BallColor = (typeof BALL_COLORS)[number];

// ============================================================================
// BOARD CONFIGURATION
// ============================================================================

/** Size of the game board (9x9 grid) */
export const BOARD_SIZE = 9;

/** Number of rows and columns (same as BOARD_SIZE for square board) */
const BOARD_ROWS = BOARD_SIZE;
const BOARD_COLS = BOARD_SIZE;

// ============================================================================
// BALL CONFIGURATION
// ============================================================================

/** Number of balls spawned at the start of the game */
export const INITIAL_BALLS = 5;

/** Number of new balls spawned after each move */
export const BALLS_PER_TURN = 3;

/** Number of ball colors available in the game */
const BALL_COLORS_COUNT = 7;

/** Minimum line length required to clear balls */
export const MIN_LINE_LENGTH = 5;

/** Maximum line length for scoring calculations */
const MAX_LINE_LENGTH = 9;

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

/** Scoring table for different line lengths (Fibonacci sequence) */
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
  /** Duration of ball popping animation */
  POP_BALL: 300,

  /** Duration of ball growing animation */
  GROW_BALL: 100,

  /** Duration of floating score animation */
  FLOATING_SCORE: 2000,

  /** Duration of score flash animation */
  SCORE_FLASH: 1000,

  /** Duration of high score flash animation */
  HIGH_SCORE_FLASH: 1000,

  /** Duration of fade in/out animations */
  FADE: 300,

  /** Duration of button hover transition */
  BUTTON_HOVER: 300,

  /** Duration of moving ball animation step */
  MOVING_STEP: 100,

  /** Duration of button shine effect transition */
  BUTTON_SHINE: 500,

  /** Duration of gradient shift animation */
  GRADIENT_SHIFT: 8000,

  /** Duration of selected ball pulse animation */
  SELECTED_BALL_PULSE: 1500,
} as const;

// ============================================================================
// TIMER CONFIGURATION
// ============================================================================

/** Timer update interval in milliseconds */
export const TIMER_INTERVAL_MS = 1000;

/** Inactivity timeout before timer pauses (10 seconds) */
export const INACTIVITY_TIMEOUT_MS = 10000;

// ============================================================================
// STORAGE KEYS
// ============================================================================

/** Local storage key for high score */
export const HIGH_SCORE_STORAGE_KEY = "lines-game-high-score";
