import type { Effect, GameState } from "./types";

/**
 * Effects are not merely animation instructions — they are a pure fold over
 * a view board, with the property-tested invariant
 * `effects.reduce(applyEffect, viewOf(prev)) ≡ viewOf(next)`.
 * No timing fields anywhere: the engine must not know milliseconds exist.
 */
export interface ViewBoard {
  balls: Uint8Array;
  ghosts: Uint8Array;
}

export const viewOf = (s: GameState): ViewBoard => ({
  balls: s.balls.slice(),
  ghosts: s.ghosts.slice(),
});

export function applyEffect(v: ViewBoard, e: Effect): ViewBoard {
  const balls = v.balls.slice();
  const ghosts = v.ghosts.slice();
  switch (e.k) {
    case "move": {
      const fromCell = e.path[0]!;
      const toCell = e.path[e.path.length - 1]!;
      balls[fromCell] = 0;
      balls[toCell] = e.color;
      // The ball picks the displaced ghost up as it lands, so the board is
      // legal at every intermediate fold step (R1 never transiently violated).
      ghosts[toCell] = 0;
      break;
    }
    case "ghostMoved":
      // The clear happened in `move`; `from` is for animation only.
      ghosts[e.to] = e.color;
      break;
    case "pop":
      for (const c of e.cells) balls[c] = 0;
      break;
    case "score":
      break;
    case "materialize":
      for (const p of e.cells) {
        ghosts[p.c] = 0;
        balls[p.c] = p.color;
      }
      break;
    case "spawnGhosts":
      for (const p of e.cells) ghosts[p.c] = p.color;
      break;
    case "gameOver":
      break;
  }
  return { balls, ghosts };
}
