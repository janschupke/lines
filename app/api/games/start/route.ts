import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createGame, keyedEntropy, boardHash, ENGINE_VERSION } from "@/engine";
import type { InitPacket, PlacedBall } from "@/engine";
import { prisma } from "@/server/db";
import { deriveGameKey } from "@/server/keys";
import { signToken } from "@/server/token";
import { errorResponse, ipHashOf } from "@/server/request";
import { attemptsInWindow, recordAttempt, HOUR } from "@/server/ratelimit";
import {
  CURRENT_KEY_VERSION,
  MAX_GAME_MS,
  e2eFixedKeyHex,
} from "@/server/config";
import { MAX_LIVE_SESSIONS, rowFieldsOfState } from "@/server/session";

export const runtime = "nodejs";

const StartBody = z.object({ playerId: z.string().uuid() });

export async function POST(request: Request): Promise<Response> {
  let body: z.infer<typeof StartBody>;
  try {
    body = StartBody.parse(await request.json());
  } catch {
    return errorResponse("bad_request", 400);
  }
  const ipHash = ipHashOf(request);

  // Abuse cap only — restarting games is normal play and must never be
  // blocked. There is deliberately NO per-player limit: playerId is minted
  // by the client, so a per-player cap stops no attacker (they mint a new
  // one) and only ever punishes an honest player hitting New Game. Row
  // growth is already bounded by MAX_LIVE_SESSIONS per player and the TTL
  // sweep; this per-IP ceiling exists solely against bulk insertion, set
  // far above any human rate. Skipped in dev and under the e2e affordance.
  const testEnv =
    process.env.NODE_ENV === "development" || e2eFixedKeyHex() !== null;
  if (!testEnv) {
    const byIp = await attemptsInWindow({ ipHash }, HOUR, ["start"]);
    if (byIp >= 240) {
      await recordAttempt("rate_limited", ipHash, body.playerId);
      return errorResponse("rate_limited", 429);
    }
  }
  await recordAttempt("start", ipHash, body.playerId);

  const gameId = randomUUID();
  const key = deriveGameKey(CURRENT_KEY_VERSION, gameId);
  const entropy = keyedEntropy(key);
  let state;
  try {
    state = createGame(entropy);
  } catch {
    // R7 assertion — retry once with a fresh gameId, then hard error.
    try {
      state = createGame(
        keyedEntropy(deriveGameKey(CURRENT_KEY_VERSION, randomUUID())),
      );
    } catch {
      return errorResponse("audit_failed", 500);
    }
  }

  // Live-session cap: the oldest beyond MAX_LIVE_SESSIONS - 1 goes.
  const live = await prisma.gameSession.findMany({
    where: { playerId: body.playerId },
    orderBy: { createdAt: "desc" },
    select: { gameId: true },
  });
  if (live.length >= MAX_LIVE_SESSIONS) {
    await prisma.gameSession.deleteMany({
      where: {
        gameId: {
          in: live.slice(MAX_LIVE_SESSIONS - 1).map((s) => s.gameId),
        },
      },
    });
  }

  await prisma.gameSession.create({
    data: {
      gameId,
      playerId: body.playerId,
      keyVersion: CURRENT_KEY_VERSION,
      engineVersion: ENGINE_VERSION,
      ipHash,
      ...rowFieldsOfState(state),
    },
  });

  const init: InitPacket = {
    balls: placed(state.balls),
    ghosts: placed(state.ghosts),
  };
  const issuedAt = Date.now();
  return Response.json({
    gameId,
    token: signToken({
      v: 1,
      gameId,
      issuedAt,
      engineVersion: ENGINE_VERSION,
      keyVersion: CURRENT_KEY_VERSION,
    }),
    expiresAt: issuedAt + MAX_GAME_MS,
    engineVersion: ENGINE_VERSION,
    init,
    boardHash: boardHash(state),
  });
}

function placed(arr: Uint8Array): PlacedBall[] {
  const out: PlacedBall[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== 0) out.push({ c: i, color: arr[i] as PlacedBall["color"] });
  }
  return out;
}
