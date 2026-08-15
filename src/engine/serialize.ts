import { CELL_COUNT } from "./config";
import type { GameState, InitPacket, SpawnPacket } from "./types";

/**
 * Persist the log, not the board. Replaying a save costs about a millisecond
 * and self-validates it: a corrupt or tampered save fails to replay and we
 * start fresh.
 */
export type SavedGame =
  | {
      v: 1;
      mode: "casual";
      key: string; // 64 hex chars, client-minted; never a server key
      moves: string;
      startedAt: number;
      elapsedMs: number;
    }
  | {
      v: 1;
      mode: "ranked";
      gameId: string;
      token: string;
      init: InitPacket; // from POST /api/games/start
      moves: string;
      packets: SpawnPacket[]; // one per move, from the server
      startedAt: number;
      elapsedMs: number;
    };

interface SerializedState {
  v: 1;
  balls: number[];
  ghosts: number[];
  score: number;
  moveCount: number;
  over: boolean;
  stats: GameState["stats"];
}

export const serialize = (s: GameState): string =>
  JSON.stringify({
    v: 1,
    balls: Array.from(s.balls),
    ghosts: Array.from(s.ghosts),
    score: s.score,
    moveCount: s.moveCount,
    over: s.over,
    stats: s.stats,
  } satisfies SerializedState);

export function deserialize(j: string): GameState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(j);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Partial<SerializedState>;
  if (p.v !== 1) return null;
  if (!Array.isArray(p.balls) || p.balls.length !== CELL_COUNT) return null;
  if (!Array.isArray(p.ghosts) || p.ghosts.length !== CELL_COUNT) return null;
  if (typeof p.score !== "number" || typeof p.moveCount !== "number")
    return null;
  if (typeof p.over !== "boolean") return null;
  const st = p.stats;
  if (
    typeof st !== "object" ||
    st === null ||
    typeof st.turns !== "number" ||
    typeof st.linesPopped !== "number" ||
    typeof st.longestLine !== "number" ||
    typeof st.ballsCleared !== "number"
  ) {
    return null;
  }
  const balls = new Uint8Array(CELL_COUNT);
  const ghosts = new Uint8Array(CELL_COUNT);
  for (let i = 0; i < CELL_COUNT; i++) {
    const b = p.balls[i];
    const g = p.ghosts[i];
    if (typeof b !== "number" || b < 0 || b > 7) return null;
    if (typeof g !== "number" || g < 0 || g > 7) return null;
    if (b !== 0 && g !== 0) return null;
    balls[i] = b;
    ghosts[i] = g;
  }
  return {
    balls,
    ghosts,
    score: p.score,
    moveCount: p.moveCount,
    over: p.over,
    stats: {
      turns: st.turns,
      linesPopped: st.linesPopped,
      longestLine: st.longestLine,
      ballsCleared: st.ballsCleared,
    },
  };
}
