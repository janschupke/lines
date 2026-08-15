import { DURATIONS } from "@/design/tokens";

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

/** Ball color enum for strict TypeScript typing */
export const BallColor = {
  Red: "red",
  Blue: "blue",
  Green: "green",
  Yellow: "yellow",
  Purple: "purple",
  Pink: "pink",
  Black: "black",
} as const;

export type BallColor = (typeof BallColor)[keyof typeof BallColor];

// ============================================================================
// BOARD CONFIGURATION
// ============================================================================

/** Size of the game board (9x9 grid) */
export const BOARD_SIZE = 9;

// ============================================================================
// BALL CONFIGURATION
// ============================================================================

/** Number of balls spawned at the start of the game */
export const INITIAL_BALLS = 5;

/** Number of new balls spawned after each move */
export const BALLS_PER_TURN = 3;

/** Minimum line length required to clear balls */
export const MIN_LINE_LENGTH = 5;

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

/**
 * Animation durations in milliseconds, sourced from the design tokens.
 * GROW_BALL stays 100: it is the JS bookkeeping cadence for clearing the
 * growing state, not the CSS grow animation (DURATIONS.growBall, 600ms).
 * Both this object and the timing code it drives are deleted in Phase 4.
 */
export const ANIMATION_DURATIONS = {
  /** Duration of ball popping animation */
  POP_BALL: DURATIONS.popBall,

  /** Duration of ball growing state bookkeeping (see note above) */
  GROW_BALL: 100,

  /** Duration of floating score animation */
  FLOATING_SCORE: DURATIONS.floatingScore,

  /** Duration of score flash animation */
  SCORE_FLASH: DURATIONS.scoreFlash,

  /** Duration of high score flash animation */
  HIGH_SCORE_FLASH: DURATIONS.highScoreFlash,

  /** Duration of fade in/out animations */
  FADE: DURATIONS.fade,

  /** Duration of button hover transition */
  BUTTON_HOVER: DURATIONS.buttonHover,

  /** Duration of moving ball animation step */
  MOVING_STEP: DURATIONS.movingStep,

  /** Duration of button shine effect transition */
  BUTTON_SHINE: DURATIONS.buttonShine,

  /** Duration of gradient shift animation */
  GRADIENT_SHIFT: DURATIONS.gradientShift,

  /** Duration of selected ball pulse animation */
  SELECTED_BALL_PULSE: DURATIONS.selectedBallPulse,
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
