import { BALLS_PER_TURN, CELL_COUNT } from "./config";
import {
  freeOfBalls,
  freeOfBoth,
  countNonZero,
  inRange,
  xOf,
  yOf,
  indexOf,
} from "./board";
import type { EntropySource } from "./entropy";
import { keyedEntropy, validInitPacket } from "./entropy";
import { resolveLines } from "./lines";
import { findPath } from "./path";
import type { Key } from "./rng";
import type {
  CellIndex,
  ColorId,
  Effect,
  GameAction,
  GameState,
  GameStats,
  PlacedBall,
  SpawnPacket,
  StepResult,
} from "./types";

const EMPTY_STATS: GameStats = {
  turns: 0,
  linesPopped: 0,
  longestLine: 0,
  ballsCleared: 0,
};

/** Rounded centroid of a set of cells, as a cell index (no pixel math). */
function centroidOf(cells: readonly CellIndex[]): CellIndex {
  let sx = 0;
  let sy = 0;
  for (const c of cells) {
    sx += xOf(c);
    sy += yOf(c);
  }
  const n = cells.length;
  const rx = (sx / n + 0.5) | 0;
  const ry = (sy / n + 0.5) | 0;
  return indexOf(rx, ry);
}

export function createGame(entropy: EntropySource): GameState {
  const packet = entropy.init();
  if (!validInitPacket(packet)) {
    throw new Error("createGame: illegal init packet");
  }
  const balls = new Uint8Array(CELL_COUNT);
  const ghosts = new Uint8Array(CELL_COUNT);
  for (const b of packet.balls) balls[b.c] = b.color;
  for (const g of packet.ghosts) ghosts[g.c] = g.color;
  return {
    balls,
    ghosts,
    score: 0,
    moveCount: 0,
    over: false,
    stats: EMPTY_STATS,
  };
}

/**
 * The turn. All randomness is confined to one contiguous phase (step 5);
 * everything before it is a pure function of the board. See R10.
 */
export function applyAction(
  state: GameState,
  action: GameAction,
  entropy: EntropySource,
): StepResult {
  // 1. Validate — pure.
  if (state.over) return { ok: false, error: "game_over" };
  const { from, to } = action;
  if (!inRange(from) || !inRange(to))
    return { ok: false, error: "out_of_bounds" };
  if (from === to) return { ok: false, error: "same_cell" };
  const movingColor = state.balls[from]! as ColorId | 0;
  if (movingColor === 0) return { ok: false, error: "no_ball_at_source" };
  if (state.balls[to] !== 0)
    return { ok: false, error: "destination_occupied" };
  const path = findPath(state.balls, from, to);
  if (path === null) return { ok: false, error: "unreachable" };

  const effects: Effect[] = [];
  const balls = state.balls.slice();
  const ghosts = state.ghosts.slice();

  // 2. Move; if a ghost occupied the destination, it is now pending relocation.
  balls[from] = 0;
  balls[to] = movingColor;
  let displaced: ColorId | null = null;
  if (ghosts[to] !== 0) {
    displaced = ghosts[to] as ColorId;
    ghosts[to] = 0;
  }
  effects.push({ k: "move", color: movingColor as ColorId, path });

  let score = state.score;
  let linesPopped = state.stats.linesPopped;
  let longestLine = state.stats.longestLine;
  let ballsCleared = state.stats.ballsCleared;

  // 3. Full-board line resolve.
  const first = resolveLines(balls);
  balls.set(first.balls);
  let poppedAny = false;
  for (const round of first.rounds) {
    poppedAny = true;
    effects.push({
      k: "pop",
      cells: round.cells,
      lines: round.lines,
      round: effectsRound(effects),
    });
    score += round.points;
    effects.push({
      k: "score",
      delta: round.points,
      total: score,
      at: centroidOf(round.cells),
    });
    linesPopped += round.lines.length;
    ballsCleared += round.cells.length;
    for (const line of round.lines) {
      if (line.length > longestLine) longestLine = line.length;
    }
  }

  // 4. No pop: materialise every ghost in place, then resolve again.
  if (!poppedAny) {
    const materialized: PlacedBall[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      if (ghosts[i] !== 0) {
        materialized.push({ c: i, color: ghosts[i] as ColorId });
        balls[i] = ghosts[i]!;
        ghosts[i] = 0;
      }
    }
    if (materialized.length > 0) {
      effects.push({ k: "materialize", cells: materialized });
    }
    const second = resolveLines(balls);
    balls.set(second.balls);
    for (const round of second.rounds) {
      effects.push({
        k: "pop",
        cells: round.cells,
        lines: round.lines,
        round: effectsRound(effects),
      });
      score += round.points;
      effects.push({
        k: "score",
        delta: round.points,
        total: score,
        at: centroidOf(round.cells),
      });
      linesPopped += round.lines.length;
      ballsCleared += round.cells.length;
      for (const line of round.lines) {
        if (line.length > longestLine) longestLine = line.length;
      }
    }
  }

  // 5. Entropy — one packet: relocation, then top-up to min(3, cells free of balls).
  const free = freeOfBoth(balls, ghosts);
  // The displaced ghost re-enters the board via the packet's relocation, so
  // it counts toward the top-up target.
  const ghostsNow =
    countNonZero(ghosts) + (displaced !== null && free.length > 0 ? 1 : 0);
  const ballFreeCount = freeOfBalls(balls).length;
  const target =
    BALLS_PER_TURN < ballFreeCount ? BALLS_PER_TURN : ballFreeCount;
  const ghostCount = target > ghostsNow ? target - ghostsNow : 0;
  const packet = entropy.spawn({
    free,
    relocateColor: displaced,
    ghostCount,
  });
  if (typeof packet === "string") return { ok: false, error: packet };

  if (packet.relocate && displaced !== null) {
    ghosts[packet.relocate.to] = displaced;
    effects.push({
      k: "ghostMoved",
      from: to,
      to: packet.relocate.to,
      color: displaced,
    });
  }
  if (packet.ghosts.length > 0) {
    for (const g of packet.ghosts) ghosts[g.c] = g.color;
    effects.push({ k: "spawnGhosts", cells: packet.ghosts });
  }

  // 6. Game over — real balls only, one check, both branches.
  const over = freeOfBalls(balls).length === 0;
  const stats: GameStats = {
    turns: state.stats.turns + 1,
    linesPopped,
    longestLine,
    ballsCleared,
  };
  if (over) {
    effects.push({ k: "gameOver", score, stats });
  }

  return {
    ok: true,
    state: {
      balls,
      ghosts,
      score,
      moveCount: state.moveCount + 1,
      over,
      stats,
    },
    effects,
    packet,
  };
}

/** Round counter for pop effects within one action (0-based). */
function effectsRound(effects: readonly Effect[]): number {
  let n = 0;
  for (const e of effects) if (e.k === "pop") n++;
  return n;
}

export type ReplayResult =
  | { ok: true; state: GameState; packets: SpawnPacket[]; rngDraws: number }
  | {
      ok: false;
      error:
        | "game_over"
        | "out_of_bounds"
        | "same_cell"
        | "no_ball_at_source"
        | "destination_occupied"
        | "unreachable"
        | "entropy_exhausted"
        | "entropy_illegal";
      index: number;
    }
  | { ok: false; timedOut: true; index: number };

/**
 * Replays a full game from a key. Aborts at the first illegal move with its
 * index. `deadline` is checked every 128 moves so a pathological input
 * cannot pin a serverless instance.
 */
export function replay(
  key: Key,
  moves: readonly GameAction[],
  deadline?: () => boolean,
): ReplayResult {
  const entropy = keyedEntropy(key);
  let state = createGame(entropy);
  const packets: SpawnPacket[] = [];
  for (let i = 0; i < moves.length; i++) {
    if (deadline && (i & 127) === 127 && deadline()) {
      return { ok: false, timedOut: true, index: i };
    }
    const result = applyAction(state, moves[i]!, entropy);
    if (!result.ok) return { ok: false, error: result.error, index: i };
    state = result.state;
    packets.push(result.packet);
  }
  return { ok: true, state, packets, rngDraws: entropy.rngDraws() };
}
