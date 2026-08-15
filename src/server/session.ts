import type { GameState, GameStats } from "@/engine";
import { boardHash } from "@/engine";
import type { GameSession } from "@/generated/prisma/client";

/** The session row IS the game. balls/ghosts are 81 raw bytes each. */
export function stateOfRow(row: GameSession): GameState {
  return {
    balls: new Uint8Array(row.balls),
    ghosts: new Uint8Array(row.ghosts),
    score: row.score,
    moveCount: row.moveCount,
    over: row.over,
    stats: row.stats as unknown as GameStats,
  };
}

export function rowFieldsOfState(state: GameState) {
  return {
    balls: Buffer.from(state.balls),
    ghosts: Buffer.from(state.ghosts),
    score: state.score,
    over: state.over,
    stats: state.stats as unknown as object,
    boardHash: boardHash(state),
  };
}

/** Cap of ~5 live sessions per player: delete the oldest beyond it. */
export const MAX_LIVE_SESSIONS = 5;
