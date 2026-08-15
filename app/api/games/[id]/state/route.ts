import { ENGINE_VERSION } from "@/engine";
import { prisma } from "@/server/db";
import { verifyToken } from "@/server/token";
import { errorResponse } from "@/server/request";

export const runtime = "nodejs";

/**
 * Reconciliation after a reload. Requires the token. Never returns key
 * material or the move log.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: gameId } = await context.params;
  const token = request.headers.get("x-game-token") ?? "";
  const verdict = verifyToken(token);
  if (!verdict.ok) return errorResponse(verdict.error, 401);
  if (verdict.payload.gameId !== gameId) return errorResponse("bad_token", 401);
  if (verdict.payload.engineVersion !== ENGINE_VERSION) {
    return errorResponse("engine_version", 409);
  }
  const session = await prisma.gameSession.findUnique({ where: { gameId } });
  if (!session) return errorResponse("no_session", 404);
  return Response.json({
    balls: Array.from(new Uint8Array(session.balls)),
    ghosts: Array.from(new Uint8Array(session.ghosts)),
    score: session.score,
    moveCount: session.moveCount,
    over: session.over,
    stats: session.stats,
    boardHash: session.boardHash,
  });
}
