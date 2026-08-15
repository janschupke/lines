import { hkdf, keyFromHex } from "@/engine";
import type { Key } from "@/engine";
import { e2eFixedKeyHex, entropySecret } from "./config";

const encoder = new TextEncoder();

/**
 * The ranked game key: HKDF(ENTROPY_SECRET[keyVersion], gameId), recomputed
 * per request. Never stored, never sent to the client.
 */
export function deriveGameKey(keyVersion: number, gameId: string): Key {
  const fixed = e2eFixedKeyHex();
  if (fixed) return keyFromHex(fixed);
  return hkdf(
    encoder.encode(entropySecret(keyVersion)),
    encoder.encode("lines-game-key"),
    encoder.encode(gameId),
    32,
  );
}
