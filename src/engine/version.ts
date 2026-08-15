import {
  BALLS_PER_TURN,
  BOARD_SIZE,
  COLOR_COUNT,
  INITIAL_BALLS,
  MIN_LINE_LENGTH,
  SCORING_TABLE,
} from "./config";
import { fnv1a } from "./board";
import { INIT_STRIDE, TURN_STRIDE } from "./rng";

/**
 * RULES_HASH covers every constant that can change a game's outcome —
 * including the RNG strides, which live outside config.ts but shift every
 * draw in every game if altered. version.test.ts pins it to a literal so CI
 * fails until both the hash and ENGINE_VERSION are consciously updated.
 */
export const RULES_HASH = fnv1a(
  JSON.stringify({
    BOARD_SIZE,
    COLOR_COUNT,
    INITIAL_BALLS,
    BALLS_PER_TURN,
    MIN_LINE_LENGTH,
    SCORING_TABLE,
    INIT_STRIDE,
    TURN_STRIDE,
  }),
);

/** Bumps only when RULES_HASH changes — refactors do not bump it. */
export const ENGINE_VERSION = 1;
