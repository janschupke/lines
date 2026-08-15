import type { Key } from "./rng";
import { INIT_STRIDE, TURN_STRIDE, sha256 } from "./rng";
import type { SpawnRequest } from "./spawn";
import { keyedInit, keyedSpawn } from "./spawn";
import type { EntropyError, InitPacket, SpawnPacket } from "./types";

export interface EntropySource {
  /** The initial deal. Called exactly once, before any spawn. */
  init(): InitPacket;
  /** The one entropy phase of a turn. Returns an EntropyError on failure. */
  spawn(req: SpawnRequest): SpawnPacket | EntropyError;
}

export interface KeyedEntropy extends EntropySource {
  rngDraws(): number;
}

/**
 * Seeded entropy: the server for Ranked, the client for Casual, every replay
 * and audit. Draw positions are fixed by construction — the initial deal
 * draws only inside [0, INIT_STRIDE) and turn t only inside
 * [INIT_STRIDE + TURN_STRIDE*t, +TURN_STRIDE) — so a turn's draws never
 * depend on how much earlier turns consumed.
 *
 * `startTurn` lets a replay resume mid-game: the first spawn() call is
 * treated as turn `startTurn`.
 */
export function keyedEntropy(rawKey: Key, startTurn = 0): KeyedEntropy {
  if (rawKey.length < 16) {
    throw new Error("keyedEntropy: key must be at least 16 bytes");
  }
  // ChaCha20 wants exactly 32 bytes; other (>=16) lengths are expanded.
  const key = rawKey.length === 32 ? rawKey : sha256(rawKey);
  let draws = 0;
  let turn = startTurn;
  return {
    init(): InitPacket {
      const cursor = { key, pos: 0 };
      const packet = keyedInit(cursor);
      if (cursor.pos > INIT_STRIDE) {
        throw new Error("initial deal exceeded INIT_STRIDE");
      }
      draws += cursor.pos;
      return packet;
    },
    spawn(req: SpawnRequest): SpawnPacket {
      const base = INIT_STRIDE + TURN_STRIDE * turn;
      turn++;
      const cursor = { key, pos: base };
      const packet = keyedSpawn(cursor, req);
      if (cursor.pos - base > TURN_STRIDE) {
        throw new Error("turn entropy exceeded TURN_STRIDE");
      }
      draws += cursor.pos - base;
      return packet;
    },
    rngDraws: () => draws,
  };
}

/**
 * Scripted entropy: the Ranked client replaying server-issued packets, and
 * local replay-on-load. Every packet is validated against the request it
 * answers — a malformed or hostile packet fails loudly instead of silently
 * desyncing the board. Running out of packets returns 'entropy_exhausted'.
 */
export function scriptedEntropy(
  init: InitPacket,
  packets: readonly SpawnPacket[],
): EntropySource {
  let next = 0;
  return {
    init: () => init,
    spawn(req: SpawnRequest): SpawnPacket | EntropyError {
      if (next >= packets.length) return "entropy_exhausted";
      const packet = packets[next++]!;
      if (!validPacket(req, packet)) return "entropy_illegal";
      return packet;
    },
  };
}

export function validPacket(req: SpawnRequest, packet: SpawnPacket): boolean {
  const free = new Set(req.free);
  const used = new Set<number>();
  const shouldRelocate = req.relocateColor !== null && req.free.length > 0;
  if (shouldRelocate !== (packet.relocate !== undefined)) return false;
  if (packet.relocate) {
    if (!free.has(packet.relocate.to)) return false;
    used.add(packet.relocate.to);
  }
  const expected =
    req.ghostCount < req.free.length - used.size
      ? req.ghostCount
      : req.free.length - used.size;
  if (packet.ghosts.length !== expected) return false;
  for (const g of packet.ghosts) {
    if (!free.has(g.c) || used.has(g.c)) return false;
    if (!(g.color >= 1 && g.color <= 7)) return false;
    used.add(g.c);
  }
  return true;
}

/** InitPacket sanity — an init block from the network can never produce an illegal board. */
export function validInitPacket(packet: InitPacket): boolean {
  const used = new Set<number>();
  for (const list of [packet.balls, packet.ghosts]) {
    for (const p of list) {
      if (!Number.isInteger(p.c) || p.c < 0 || p.c > 80) return false;
      if (!(p.color >= 1 && p.color <= 7)) return false;
      if (used.has(p.c)) return false;
      used.add(p.c);
    }
  }
  return true;
}
