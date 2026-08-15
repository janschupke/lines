/**
 * Regenerates the golden replay corpus in src/engine/__fixtures__/replays/.
 * Run only when a rules change is intended: `npx tsx scripts/gen-corpus.ts`.
 * A dozen randomLegalPlayer games with fixed seeds, plus hand-built games
 * are appended by the corpus test itself where board literals are clearer.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createGame,
  applyAction,
  keyedEntropy,
  boardHash,
  encodeMoves,
  keyToHex,
} from "../src/engine";
import type { GameAction, SpawnPacket } from "../src/engine";
import { greedyLegalMove, testKey } from "../src/engine/testutil";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "src", "engine", "__fixtures__", "replays");
mkdirSync(dir, { recursive: true });

const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
const LENGTHS = [20, 40, 60, 80, 120, 200, 40, 60, 300, 500, 30, 90];

for (let i = 0; i < SEEDS.length; i++) {
  const seed = SEEDS[i]!;
  const key = testKey(seed);
  const entropy = keyedEntropy(key);
  const chooser = testKey(seed + 100000);
  let state = createGame(entropy);
  const moves: GameAction[] = [];
  const packets: SpawnPacket[] = [];
  const probe = (s: typeof state, a: GameAction): boolean => {
    const r = applyAction(s, a, {
      init: () => ({ balls: [], ghosts: [] }),
      spawn: () => ({ ghosts: [] }),
    });
    return r.ok && r.effects.some((e) => e.k === "pop");
  };
  for (let t = 0; t < LENGTHS[i]! && !state.over; t++) {
    const action = greedyLegalMove(state, chooser, t, probe);
    if (!action) break;
    const r = applyAction(state, action, entropy);
    if (!r.ok) throw new Error(r.error);
    moves.push(action);
    packets.push(r.packet);
    state = r.state;
  }
  const fixture = {
    name: `random-seed-${seed}`,
    key: keyToHex(key),
    moves: encodeMoves(moves),
    packets,
    expect: {
      score: state.score,
      rngDraws: entropy.rngDraws(),
      boardHash: boardHash(state),
      stats: state.stats,
      over: state.over,
      moveCount: state.moveCount,
    },
  };
  const file = join(dir, `random-seed-${seed}.json`);
  writeFileSync(file, JSON.stringify(fixture, null, 1) + "\n");
  console.warn(`wrote ${file} (${moves.length} moves, score ${state.score})`);
}
