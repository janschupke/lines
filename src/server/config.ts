/** Server-side constants and secret access. */

export const MAX_GAME_MS = 24 * 3600 * 1000; // matches the GameSession TTL sweep
export const MIN_MS_PER_MOVE = 150; // faster than this marks `suspicious`
export const CLOCK_SKEW_MS = 60_000;
export const CURRENT_KEY_VERSION = 1;

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

export function gameTokenSecret(): string {
  return required("GAME_TOKEN_SECRET");
}

/** Rotating ENTROPY_SECRET: rows store keyVersion; older secrets stay readable. */
export function entropySecret(keyVersion: number): string {
  return required(`ENTROPY_SECRET_V${keyVersion}`);
}

export function ipHashSalt(): string {
  return required("IP_HASH_SALT");
}

/**
 * The ONLY test affordance in the codebase: a fixed game key for Playwright
 * determinism, server-side where the client cannot reach it. The key still
 * never appears in any response, the DOM or the UI.
 */
export function e2eFixedKeyHex(): string | null {
  const hex = process.env["E2E_FIXED_KEY"];
  if (!hex) return null;
  if (process.env.NODE_ENV === "production" && process.env["VERCEL"]) {
    throw new Error("E2E_FIXED_KEY must never be set in production");
  }
  return hex;
}
