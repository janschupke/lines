/**
 * The single source for the saved game, high score, player id and local
 * aggregate state. Stores the ACTION LOG, not the board: a corrupt or
 * hand-edited save fails to replay and we start fresh. Validation and
 * storage reset happen only at game end.
 */
import {
  createGame,
  applyAction,
  decodeMoves,
  keyedEntropy,
  scriptedEntropy,
  keyFromHex,
  keyToHex,
} from "@/engine";
import type {
  EntropySource,
  GameAction,
  GameState,
  InitPacket,
  SavedGame,
  SpawnPacket,
} from "@/engine";

export const KEY_GAME = "lines:game:v1";
export const KEY_HIGHSCORE = "lines:highscore:v1"; // { casual: n, ranked: n }
const KEY_PLAYER_ID = "lines:playerId:v1";
export const KEY_NET_HISTORY = "lines:netHistory:v1";
const KEY_MODE_PREF = "lines:modePref:v1";
const KEY_MODE_INTRO = "lines:seenModeIntro:v1";

const LEGACY_HIGH_SCORE_KEY = "lines-game-high-score";

/**
 * False after the first quota/disabled-storage failure: the session then
 * plays in memory and the UI shows a one-time notice.
 */
let persistenceAvailable = true;
export const isPersistenceAvailable = (): boolean => persistenceAvailable;

/** Test hook. */
export const resetPersistenceAvailability = (): void => {
  persistenceAvailable = true;
};

function read(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    persistenceAvailable = false;
    return null;
  }
}

function write(key: string, value: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    persistenceAvailable = false;
  }
}

function remove(key: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    persistenceAvailable = false;
  }
}

// -- high score (per board: casual and ranked are not comparable) -----------

export interface HighScores {
  casual: number;
  ranked: number;
}

/**
 * The legacy bare-integer key is migrated once — losing the high score is
 * the only user-visible data loss the refactor could cause.
 */
export function loadHighScores(): HighScores {
  const raw = read(KEY_HIGHSCORE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<HighScores>;
      return {
        casual: typeof parsed.casual === "number" ? parsed.casual : 0,
        ranked: typeof parsed.ranked === "number" ? parsed.ranked : 0,
      };
    } catch {
      return { casual: 0, ranked: 0 };
    }
  }
  const legacy = read(LEGACY_HIGH_SCORE_KEY);
  if (legacy) {
    const value = parseInt(legacy, 10);
    if (!Number.isNaN(value) && value > 0) {
      const migrated = { casual: value, ranked: 0 };
      write(KEY_HIGHSCORE, JSON.stringify(migrated));
      remove(LEGACY_HIGH_SCORE_KEY);
      return migrated;
    }
  }
  return { casual: 0, ranked: 0 };
}

export function saveHighScore(board: "casual" | "ranked", score: number): void {
  const scores = loadHighScores();
  if (score <= scores[board]) return;
  scores[board] = score;
  write(KEY_HIGHSCORE, JSON.stringify(scores));
}

// -- player id ---------------------------------------------------------------

export function getPlayerId(): string {
  const existing = read(KEY_PLAYER_ID);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `p-${Date.now()}`;
  write(KEY_PLAYER_ID, id);
  return id;
}

// -- casual key --------------------------------------------------------------

/** 32 random bytes for a casual game key. Lives outside the engine. */
export function mintCasualKey(): Uint8Array {
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);
  return key;
}

// -- the saved game ----------------------------------------------------------

function parseSavedGame(raw: string): SavedGame | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;
  if (p["v"] !== 1) return null;
  if (typeof p["moves"] !== "string") return null;
  if (
    typeof p["startedAt"] !== "number" ||
    typeof p["elapsedMs"] !== "number"
  ) {
    return null;
  }
  if (p["mode"] === "casual") {
    if (typeof p["key"] !== "string" || !/^[0-9a-f]{64}$/.test(p["key"])) {
      return null;
    }
    // a casual save must never carry server identifiers
    if ("gameId" in p || "token" in p) return null;
    return p as unknown as SavedGame;
  }
  if (p["mode"] === "ranked") {
    if (typeof p["gameId"] !== "string" || typeof p["token"] !== "string") {
      return null;
    }
    if ("key" in p) return null; // the client never holds a server key
    // localKey marks a ranked game continued as casual after a switch: the
    // replay still runs on the recorded packets, the key only rules future
    // draws. Optional and client-minted — never a server key.
    if (
      "localKey" in p &&
      (typeof p["localKey"] !== "string" ||
        !/^[0-9a-f]{64}$/.test(p["localKey"] as string))
    ) {
      return null;
    }
    if (typeof p["init"] !== "object" || p["init"] === null) return null;
    if (!Array.isArray(p["packets"])) return null;
    return p as unknown as SavedGame;
  }
  return null;
}

/** Engine replay under an arbitrary entropy source (scripted or keyed). */
function replayWith(
  entropy: EntropySource,
  moves: readonly GameAction[],
): { ok: true; state: GameState } | { ok: false } {
  let state: GameState;
  try {
    state = createGame(entropy);
  } catch {
    return { ok: false };
  }
  for (const move of moves) {
    const result = applyAction(state, move, entropy);
    if (!result.ok) return { ok: false };
    state = result.state;
  }
  return { ok: true, state };
}

export interface LoadedGame {
  state: GameState;
  saved: SavedGame;
  moves: GameAction[];
}

/** Every failure path returns null: tampered, corrupt, or engine-incompatible. */
export function loadGame(): LoadedGame | null {
  const raw = read(KEY_GAME);
  if (!raw) return null;
  const saved = parseSavedGame(raw);
  if (!saved) return null;
  const moves = decodeMoves(saved.moves);
  if (!moves) return null;
  let entropy: EntropySource;
  try {
    entropy =
      saved.mode === "casual"
        ? keyedEntropy(keyFromHex(saved.key))
        : scriptedEntropy(saved.init, saved.packets);
  } catch {
    return null;
  }
  const result = replayWith(entropy, moves);
  if (!result.ok) return null;
  return { state: result.state, saved, moves };
}

export interface CasualSaveInput {
  key: Uint8Array;
  moves: string;
  startedAt: number;
  elapsedMs: number;
}

export function saveCasualGame(input: CasualSaveInput): void {
  const saved: SavedGame = {
    v: 1,
    mode: "casual",
    key: keyToHex(input.key),
    moves: input.moves,
    startedAt: input.startedAt,
    elapsedMs: input.elapsedMs,
  };
  write(KEY_GAME, JSON.stringify(saved));
}

export interface RankedSaveInput {
  gameId: string;
  token: string;
  init: InitPacket;
  moves: string;
  packets: SpawnPacket[];
  startedAt: number;
  elapsedMs: number;
  /** Set when the game switched to casual mid-play; see parseSavedGame. */
  localKey?: string;
}

export function saveRankedGame(input: RankedSaveInput): void {
  const saved: SavedGame & { localKey?: string } = {
    v: 1,
    mode: "ranked",
    gameId: input.gameId,
    token: input.token,
    init: input.init,
    moves: input.moves,
    packets: input.packets,
    startedAt: input.startedAt,
    elapsedMs: input.elapsedMs,
  };
  if (input.localKey) saved.localKey = input.localKey;
  write(KEY_GAME, JSON.stringify(saved));
}

/** Cleared only at game end, per the requirement. */
export function clearGame(): void {
  remove(KEY_GAME);
}

// -- mode / net history (consumed in Phase 8) -------------------------------

export type NetOutcome = "clean" | "reconnected" | "dropped";

export function loadNetHistory(): NetOutcome[] {
  const raw = read(KEY_NET_HISTORY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is NetOutcome =>
        x === "clean" || x === "reconnected" || x === "dropped",
    );
  } catch {
    return [];
  }
}

export function pushNetOutcome(outcome: NetOutcome): void {
  // a clean ranked game clears the history — the connection has recovered
  if (outcome === "clean") {
    remove(KEY_NET_HISTORY);
    return;
  }
  const history = [...loadNetHistory(), outcome].slice(-3);
  write(KEY_NET_HISTORY, JSON.stringify(history));
}

// -- mode preference / intro -------------------------------------------------

export function loadModePref(): "casual" | "ranked" | null {
  const raw = read(KEY_MODE_PREF);
  return raw === "casual" || raw === "ranked" ? raw : null;
}

export function saveModePref(mode: "casual" | "ranked"): void {
  write(KEY_MODE_PREF, mode);
}

export function hasSeenModeIntro(): boolean {
  return read(KEY_MODE_INTRO) === "1";
}

export function markModeIntroSeen(): void {
  write(KEY_MODE_INTRO, "1");
}
