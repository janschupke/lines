// Re-export all configuration values from the centralized config
export {
  // Ball colors and types
  BALL_COLORS,
  getRandomBallColor,
  getRandomNextBalls,
  
  // Board configuration
  BOARD_SIZE,
  BOARD_ROWS,
  BOARD_COLS,
  
  // Ball configuration
  INITIAL_BALLS,
  BALLS_PER_TURN,
  BALL_COLORS_COUNT,
  MIN_LINE_LENGTH,
  MAX_LINE_LENGTH,
  
  // Scoring configuration
  SCORE_BASE_MULTIPLIER,
  FIBONACCI_SEQUENCE,
  SCORING_TABLE,
  calculateLineScore,
  
  // Animation configuration
  ANIMATION_DURATIONS,
  
  // Timer configuration
  TIMER_INTERVAL_MS,
  INACTIVITY_TIMEOUT_MS,
  
  // Game mechanics
  MAX_BOARD_BALLS,
  PREVIEW_BALLS_COUNT,
  
  // UI configuration
  OVERLAY_OPACITY,
  Z_INDEX,
  
  // Storage keys
  HIGH_SCORE_STORAGE_KEY,
} from "./config";

export type { BallColor } from "./config";
