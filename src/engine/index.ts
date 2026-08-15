/** Public barrel — the ONLY import surface for the rest of the app. */
export {
  BOARD_SIZE,
  CELL_COUNT,
  COLOR_COUNT,
  INITIAL_BALLS,
  BALLS_PER_TURN,
  MIN_LINE_LENGTH,
  SCORING_TABLE,
  LEADERBOARD_SIZE,
  scoreForLength,
} from "./config";
export type {
  CellIndex,
  ColorId,
  ColorName,
  Effect,
  EntropyError,
  GameAction,
  GameState,
  GameStats,
  InitPacket,
  LineRef,
  MoveError,
  PlacedBall,
  SpawnPacket,
  StepResult,
} from "./types";
export { COLOR_NAMES } from "./types";
export {
  xOf,
  yOf,
  indexOf,
  inRange,
  freeOfBalls,
  freeOfBoth,
  countNonZero,
  previewColors,
  boardHash,
} from "./board";
export { detectLines, resolveLines } from "./lines";
export { findPath, reachableFrom } from "./path";
export type { Cursor, Key } from "./rng";
export {
  INIT_STRIDE,
  TURN_STRIDE,
  chachaBlock,
  wordAt,
  belowAt,
  hkdf,
  hmacSha256,
  sha256,
  keyFromHex,
  keyToHex,
} from "./rng";
export type { EntropySource, KeyedEntropy } from "./entropy";
export {
  keyedEntropy,
  scriptedEntropy,
  validPacket,
  validInitPacket,
} from "./entropy";
export type { SpawnRequest } from "./spawn";
export { createGame, applyAction, replay } from "./reducer";
export type { ReplayResult } from "./reducer";
export type { ViewBoard } from "./effects";
export { viewOf, applyEffect } from "./effects";
export { encodeMoves, decodeMoves, MAX_MOVES, MOVE_LOG_RE } from "./log";
export type { SavedGame } from "./serialize";
export { serialize, deserialize } from "./serialize";
export { ENGINE_VERSION, RULES_HASH } from "./version";
