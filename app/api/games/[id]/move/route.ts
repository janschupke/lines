import { z } from "zod";
import {
  applyAction,
  keyedEntropy,
  boardHash,
  encodeMoves,
  ENGINE_VERSION,
  MAX_MOVES,
} from "@/engine";
import { prisma } from "@/server/db";
import { deriveGameKey } from "@/server/keys";
import { verifyToken } from "@/server/token";
import { errorResponse, ipHashOf } from "@/server/request";
import { attemptsInWindow, recordAttempt, HOUR } from "@/server/ratelimit";
import { stateOfRow, rowFieldsOfState } from "@/server/session";

export const runtime = "nodejs";

const MoveBody = z.object({
  token: z.string().max(512),
  moveCount: z.number().int().min(0).max(MAX_MOVES),
  from: z.number().int().min(0).max(80),
  to: z.number().int().min(0).max(80),
  boardHash: z.string().length(8),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: gameId } = await context.params;
  const raw = await request.text();
  if (raw.length > 1024) return errorResponse("bad_request", 400);
  let body: z.infer<typeof MoveBody>;
  try {
    body = MoveBody.parse(JSON.parse(raw));
  } catch {
    return errorResponse("bad_request", 400);
  }

  const verdict = verifyToken(body.token);
  if (!verdict.ok) {
    return errorResponse(verdict.error, 401);
  }
  if (verdict.payload.gameId !== gameId) return errorResponse("bad_token", 401);
  if (verdict.payload.engineVersion !== ENGINE_VERSION) {
    return errorResponse("engine_version", 409);
  }

  const session = await prisma.gameSession.findUnique({ where: { gameId } });
  if (!session) return errorResponse("no_session", 404);

  // ~move cap plus retries per game per hour
  const recentMoves = session.moveCount; // cheap sanity; the strict limiter:
  if (recentMoves >= MAX_MOVES) return errorResponse("bad_request", 400);

  const ipHash = ipHashOf(request);

  // Idempotency and the rewind guard — the security-critical part.
  if (body.moveCount !== session.moveCount) {
    if (
      body.moveCount === session.moveCount - 1 &&
      session.lastFrom === body.from &&
      session.lastTo === body.to &&
      session.lastPacket !== null
    ) {
      // Retry of a request whose response was lost: return the stored packet.
      return Response.json({
        packet: session.lastPacket,
        boardHash: session.boardHash,
        score: session.score,
        moveCount: session.moveCount,
        over: session.over,
        stats: session.stats,
      });
    }
    // A rewind attempt — the lookahead oracle. Close it.
    await recordAttempt("rewind", ipHash, session.playerId);
    return errorResponse("state_mismatch", 409);
  }

  if (session.boardHash !== body.boardHash) {
    return errorResponse("state_mismatch", 409);
  }
  if (session.over) return errorResponse("already_over", 422);

  // Abuse guard on sustained hammering (~move cap + retries per hour).
  const movesThisHour = await attemptsInWindow({ ipHash }, HOUR, ["rewind"]);
  if (movesThisHour > 600) return errorResponse("rate_limited", 429);

  const key = deriveGameKey(session.keyVersion, gameId);
  const entropy = keyedEntropy(key, session.moveCount);
  const state = stateOfRow(session);
  const result = applyAction(
    state,
    { t: "move", from: body.from, to: body.to },
    entropy,
  );
  if (!result.ok) {
    return errorResponse("invalid_move", 422);
  }

  // The atomic write: read-modify-write, optimistic concurrency and rewind
  // rejection in one predicate.
  const updated = await prisma.gameSession.updateMany({
    where: { gameId, moveCount: body.moveCount },
    data: {
      ...rowFieldsOfState(result.state),
      moveCount: { increment: 1 },
      moves:
        session.moves +
        encodeMoves([{ t: "move", from: body.from, to: body.to }]),
      lastPacket: result.packet as object,
      lastFrom: body.from,
      lastTo: body.to,
      lastSeenAt: new Date(),
    },
  });
  if (updated.count === 0) {
    // a concurrent request won the race
    return errorResponse("state_mismatch", 409);
  }

  return Response.json({
    packet: result.packet,
    boardHash: boardHash(result.state),
    score: result.state.score,
    moveCount: result.state.moveCount,
    over: result.state.over,
    stats: result.state.stats,
  });
}
