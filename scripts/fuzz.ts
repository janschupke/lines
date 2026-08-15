/**
 * Nightly fuzz: complete games asserting the cheap invariants (no surviving
 * line, ghost invariant, over iff full) and that nothing throws.
 * Usage: npx tsx scripts/fuzz.ts [games]
 */
import {
  createGame,
  applyAction,
  keyedEntropy,
  detectLines,
  freeOfBalls,
  countNonZero,
} from "../src/engine";
import { randomLegalMove, testKey } from "../src/engine/testutil";

const games = parseInt(process.argv[2] ?? "10000", 10);
let totalMoves = 0;

for (let seed = 0; seed < games; seed++) {
  const entropy = keyedEntropy(testKey(seed));
  const chooser = testKey(seed + 5_000_000);
  let state = createGame(entropy);
  for (let t = 0; t < 400 && !state.over; t++) {
    const action = randomLegalMove(state, chooser, t);
    if (!action) break;
    const r = applyAction(state, action, entropy);
    if (!r.ok) throw new Error(`seed ${seed} move ${t}: ${r.error}`);
    state = r.state;
    totalMoves++;
    // invariant 2: no line survives
    if (detectLines(state.balls).length !== 0) {
      throw new Error(`seed ${seed} move ${t}: line survived`);
    }
    // invariant 4: ghost count and disjointness (a late pop after the
    // relocation-materialise can leave fewer than the target)
    const free = freeOfBalls(state.balls).length;
    const expected = free < 3 ? free : 3;
    const latePop =
      r.effects.some((e) => e.k === "ghostMoved") &&
      r.effects.some((e) => e.k === "pop");
    if (
      countNonZero(state.ghosts) > expected ||
      (!latePop && countNonZero(state.ghosts) !== expected)
    ) {
      throw new Error(`seed ${seed} move ${t}: ghost count`);
    }
    // invariant 7: over iff full
    if (state.over !== (free === 0)) {
      throw new Error(`seed ${seed} move ${t}: over/full mismatch`);
    }
  }
  if (seed % 500 === 499) console.warn(`${seed + 1}/${games} games`);
}
console.warn(`fuzz OK: ${games} games, ${totalMoves} moves`);
