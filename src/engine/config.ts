/**
 * Rule constants only — anything here changes game outcomes and is covered
 * by RULES_HASH. No animation values, no storage keys.
 */

export const BOARD_SIZE = 9;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const COLOR_COUNT = 7;
export const INITIAL_BALLS = 5;
export const BALLS_PER_TURN = 3;
export const MIN_LINE_LENGTH = 5;

/** Fibonacci scoring per line length. Lengths above 9 clamp to the max key. */
export const SCORING_TABLE: Readonly<Record<number, number>> = {
  5: 5,
  6: 8,
  7: 13,
  8: 21,
  9: 34,
};

const MAX_SCORED_LENGTH = 9;

export const scoreForLength = (len: number): number =>
  SCORING_TABLE[
    len < MIN_LINE_LENGTH
      ? MIN_LINE_LENGTH
      : len > MAX_SCORED_LENGTH
        ? MAX_SCORED_LENGTH
        : len
  ]!;
