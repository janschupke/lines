import { createHmac, timingSafeEqual } from "node:crypto";
import { MAX_GAME_MS, gameTokenSecret } from "./config";

/**
 * v1.<b64url(payload)>.<b64url(sig)> — HMAC-SHA256 over the payload with
 * GAME_TOKEN_SECRET. Carries NO key material: the client must never hold it.
 */
export interface TokenPayload {
  v: 1;
  gameId: string;
  issuedAt: number;
  engineVersion: number;
  keyVersion: number;
}

const b64url = (buf: Buffer): string => buf.toString("base64url");

export function signToken(payload: TokenPayload): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = createHmac("sha256", gameTokenSecret()).update(body).digest();
  return `v1.${body}.${b64url(sig)}`;
}

export type TokenVerdict =
  | { ok: true; payload: TokenPayload }
  | { ok: false; error: "bad_token" | "expired" };

export function verifyToken(token: string): TokenVerdict {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return { ok: false, error: "bad_token" };
  }
  const [, body, sig] = parts as [string, string, string];
  const expected = createHmac("sha256", gameTokenSecret())
    .update(body)
    .digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return { ok: false, error: "bad_token" };
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, error: "bad_token" };
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return { ok: false, error: "bad_token" };
  }
  if (
    payload.v !== 1 ||
    typeof payload.gameId !== "string" ||
    typeof payload.issuedAt !== "number" ||
    typeof payload.keyVersion !== "number"
  ) {
    return { ok: false, error: "bad_token" };
  }
  if (Date.now() - payload.issuedAt > MAX_GAME_MS) {
    return { ok: false, error: "expired" };
  }
  return { ok: true, payload };
}
