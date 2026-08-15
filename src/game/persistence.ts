/**
 * The single source for the high score and local stats. (The in-progress
 * SavedGame — action log, not board — lands in Phase 5.)
 */

const HIGH_SCORE_KEY = "lines-game-high-score";

const storageAvailable = (): boolean => typeof localStorage !== "undefined";

export function loadHighScore(): number {
  if (!storageAvailable()) return 0;
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (stored) {
      const score = parseInt(stored, 10);
      if (!Number.isNaN(score)) return score;
    }
  } catch {
    // ignore — storage may be unavailable
  }
  return 0;
}

export function saveHighScore(score: number): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // ignore
  }
}

/** 32 random bytes for a casual game key. Lives outside the engine. */
export function mintCasualKey(): Uint8Array {
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);
  return key;
}
