import { DURATIONS } from "@/design/tokens";
import type { Effect } from "@/engine";

/**
 * Effect kind -> milliseconds. The engine must not know milliseconds exist;
 * this is the one place presentation timing is decided.
 */
export interface Timings {
  movingStep: number;
  popBall: number;
  growBall: number;
  floatingScore: number;
}

export const defaultTimings: Timings = {
  movingStep: DURATIONS.movingStep,
  popBall: DURATIONS.popBall,
  growBall: DURATIONS.growBall,
  floatingScore: DURATIONS.floatingScore,
};

/** Blocking duration of one effect in the queue. */
export function effectDuration(e: Effect, t: Timings): number {
  switch (e.k) {
    case "move":
      return t.movingStep * (e.path.length - 1);
    case "pop":
      return t.popBall;
    case "score":
      return 0; // non-blocking: floating score removes itself independently
    case "materialize":
      return t.growBall;
    case "ghostMoved":
      return t.growBall; // concurrent with spawnGhosts
    case "spawnGhosts":
      return t.growBall;
    case "gameOver":
      return 0;
  }
}
