import type { GameStats, InitPacket, SpawnPacket } from "@/engine";

/**
 * Thin, mockable transport. GameController owns the retry loop and the
 * state machine; Playwright drives every path by routing at the network
 * boundary, with no test-only code in the app.
 */
export interface StartResponse {
  gameId: string;
  token: string;
  expiresAt: number;
  engineVersion: number;
  init: InitPacket;
  boardHash: string;
}

export interface MoveRequest {
  gameId: string;
  token: string;
  moveCount: number;
  from: number;
  to: number;
  boardHash: string;
}

export interface MoveResponse {
  packet: SpawnPacket;
  boardHash: string;
  score: number;
  moveCount: number;
  over: boolean;
  stats: GameStats;
}

export interface StateResponse {
  balls: number[];
  ghosts: number[];
  score: number;
  moveCount: number;
  over: boolean;
  stats: GameStats;
  boardHash: string;
}

export interface FinishRequest {
  gameId: string;
  token: string;
  name: string;
  durationMs: number;
}

export interface FinishResponse {
  accepted: boolean;
  qualified: boolean;
  score: number;
  rank?: number;
  threshold?: number;
}

class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export interface GameApi {
  /** Also the mode probe: 1500ms budget (13-modes.md). */
  start(playerId: string, timeoutMs?: number): Promise<StartResponse>;
  move(req: MoveRequest): Promise<MoveResponse>;
  state(gameId: string, token: string): Promise<StateResponse>;
  finish(req: FinishRequest): Promise<FinishResponse>;
}

const START_TIMEOUT_MS = 1500;
const REQUEST_TIMEOUT_MS = 4000;

async function call<T>(
  path: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, { ...init, signal: controller.signal });
    if (!res.ok) {
      let code = "http_error";
      try {
        code = (await res.json()).error ?? code;
      } catch {
        // keep generic
      }
      throw new ApiError(res.status, code);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const httpGameApi: GameApi = {
  start: (playerId, timeoutMs = START_TIMEOUT_MS) =>
    call(
      "/api/games/start",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId }),
      },
      timeoutMs,
    ),
  move: (req) =>
    call(
      `/api/games/${req.gameId}/move`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: req.token,
          moveCount: req.moveCount,
          from: req.from,
          to: req.to,
          boardHash: req.boardHash,
        }),
      },
      REQUEST_TIMEOUT_MS,
    ),
  state: (gameId, token) =>
    call(
      `/api/games/${gameId}/state`,
      {
        headers: { "x-game-token": token },
      },
      REQUEST_TIMEOUT_MS,
    ),
  finish: (req) =>
    call(
      `/api/games/${req.gameId}/finish`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: req.token,
          name: req.name,
          durationMs: req.durationMs,
        }),
      },
      REQUEST_TIMEOUT_MS,
    ),
};
