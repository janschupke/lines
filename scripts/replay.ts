/**
 * npm run replay -- --key <64 hex> --moves <log>
 * Prints {score, rngDraws, boardHash, stats}. Used to generate golden
 * fixtures, precompute Playwright move sequences, and debug rejected
 * submissions by hand.
 */
import { decodeMoves, keyFromHex, replay, boardHash } from "../src/engine";

const args = process.argv.slice(2);
const get = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
};

const keyHex = get("--key");
const movesLog = get("--moves") ?? "";

if (!keyHex) {
  console.error("usage: npm run replay -- --key <64 hex> [--moves <log>]");
  process.exit(2);
}

const moves = decodeMoves(movesLog);
if (moves === null) {
  console.error("moves log does not decode");
  process.exit(1);
}

const result = replay(keyFromHex(keyHex), moves);
if (!result.ok) {
  console.error(JSON.stringify(result));
  process.exit(1);
}

console.warn(
  JSON.stringify(
    {
      score: result.state.score,
      rngDraws: result.rngDraws,
      boardHash: boardHash(result.state),
      stats: result.state.stats,
      over: result.state.over,
      moveCount: result.state.moveCount,
    },
    null,
    2,
  ),
);
