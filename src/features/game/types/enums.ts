/**
 * TypeScript Enums for strict typing
 *
 * All enums use string values for serialization compatibility
 */

/** Turn phase enum for state machine */
export const TurnPhase = {
  Idle: "idle",
  Moving: "moving", // Ball is animating
  CheckingLines: "checkingLines", // After move, checking for lines
  Popping: "popping", // Animating line removal
  CheckingBlocked: "checkingBlocked", // Checking and recalculating preview balls
  Growing: "growing", // Animating ball growth
  CheckingLinesAfterGrow: "checkingLinesAfterGrow", // Checking for lines from grown balls
  PoppingAfterGrow: "poppingAfterGrow", // Animating line removal from grown balls
  TurnComplete: "turnComplete", // Ready for next turn
} as const;

export type TurnPhase = (typeof TurnPhase)[keyof typeof TurnPhase];

/** Line direction enum */
export const LineDirection = {
  Horizontal: "horizontal",
  Vertical: "vertical",
  DiagonalDown: "diagonal-down",
  DiagonalUp: "diagonal-up",
} as const;

export type LineDirection = (typeof LineDirection)[keyof typeof LineDirection];
