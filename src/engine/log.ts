import { CELL_COUNT } from "./config";
import type { GameAction } from "./types";

/**
 * Action log: base64url, three characters per move, encoding
 * v = from * 81 + to (range 0..6560) as a fixed three-digit base-64 number,
 * most-significant digit first. Canonical by construction:
 * decode(encode(m)) === m and encode(decode(s)) === s for every accepted s.
 */
const B64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const MOVE_LOG_RE = /^[A-Za-z0-9_-]*$/;
export const MAX_MOVES = 2000;

const INDEX = new Map<string, number>();
for (let i = 0; i < B64URL.length; i++) INDEX.set(B64URL[i]!, i);

export function encodeMoves(moves: readonly GameAction[]): string {
  let out = "";
  for (const m of moves) {
    const v = m.from * CELL_COUNT + m.to;
    out +=
      B64URL[(v / 4096) | 0]! + B64URL[((v / 64) | 0) % 64]! + B64URL[v % 64]!;
  }
  return out;
}

/** null on any violation — malformed logs never decode. */
export function decodeMoves(s: string): GameAction[] | null {
  if (!MOVE_LOG_RE.test(s)) return null;
  if (s.length % 3 !== 0) return null;
  if (s.length / 3 > MAX_MOVES) return null;
  const out: GameAction[] = [];
  for (let i = 0; i < s.length; i += 3) {
    const a = INDEX.get(s[i]!);
    const b = INDEX.get(s[i + 1]!);
    const c = INDEX.get(s[i + 2]!);
    if (a === undefined || b === undefined || c === undefined) return null;
    const v = a * 4096 + b * 64 + c;
    if (v >= CELL_COUNT * CELL_COUNT) return null; // 6561..262143 unrepresentable
    out.push({ t: "move", from: (v / CELL_COUNT) | 0, to: v % CELL_COUNT });
  }
  return out;
}
