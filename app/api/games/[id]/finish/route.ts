import { z } from "zod";
import {
  replay,
  decodeMoves,
  boardHash,
  ENGINE_VERSION,
  LEADERBOARD_SIZE,
} from "@/engine";
import { validateName } from "@/shared/names";
import { prisma } from "@/server/db";
import { deriveGameKey } from "@/server/keys";
import { verifyToken } from "@/server/token";
import { errorResponse, ipHashOf } from "@/server/request";
import { attemptsInWindow, recordAttempt, HOUR, DAY } from "@/server/ratelimit";
import { CLOCK_SKEW_MS, MAX_GAME_MS, MIN_MS_PER_MOVE } from "@/server/config";

export const runtime = "nodejs";

const FinishBody = z.object({
  token: z.string().max(512),
  name: z.string().min(1).max(64),
  durationMs: z.number().int().min(0).max(MAX_GAME_MS),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: gameId } = await context.params;
  let body: z.infer<typeof FinishBody>;
  try {
    body = FinishBody.parse(await request.json());
  } catch {
    return errorResponse("bad_request", 400);
  }
  const ipHash = ipHashOf(request);

  const verdict = verifyToken(body.token);
  if (!verdict.ok) {
    await recordAttempt(verdict.error, ipHash);
    return errorResponse(verdict.error, 401);
  }
  if (verdict.payload.gameId !== gameId) {
    await recordAttempt("bad_token", ipHash);
    return errorResponse("bad_token", 401);
  }
  if (verdict.payload.engineVersion !== ENGINE_VERSION) {
    await recordAttempt("engine_version", ipHash);
    return errorResponse("engine_version", 409);
  }

  const session = await prisma.gameSession.findUnique({ where: { gameId } });
  if (!session) {
    // idempotent double-finish: the first call deleted the session but
    // wrote the row — return it.
    const existing = await prisma.score.findUnique({ where: { gameId } });
    if (existing) {
      return Response.json({
        accepted: true,
        qualified: true,
        score: existing.score,
        scoreId: existing.id,
      });
    }
    await recordAttempt("no_session", ipHash);
    return errorResponse("no_session", 404);
  }
  const playerId = session.playerId;
  if (!session.over) {
    await recordAttempt("not_finished", ipHash, playerId);
    return errorResponse("not_finished", 422);
  }

  const existing = await prisma.score.findUnique({ where: { gameId } });
  if (existing) {
    await recordAttempt("duplicate", ipHash, playerId);
    return Response.json({
      accepted: true,
      qualified: true,
      score: existing.score,
      scoreId: existing.id,
    });
  }

  // Rate limits before any heavy work — but a duplicate finish (above)
  // never consumes budget.
  const [hourly, daily, byIp] = await Promise.all([
    attemptsInWindow({ playerId }, HOUR, [
      "accepted",
      "rate_limited",
      "audit_failed",
      "bad_name",
      "rejected_name",
      "not_qualified",
    ]),
    attemptsInWindow({ playerId }, DAY, ["accepted"]),
    attemptsInWindow({ ipHash }, HOUR, [
      "accepted",
      "rate_limited",
      "audit_failed",
      "bad_name",
      "rejected_name",
      "not_qualified",
    ]),
  ]);
  if (hourly >= 10 || daily >= 60 || byIp >= 30) {
    await recordAttempt("rate_limited", ipHash, playerId);
    return errorResponse("rate_limited", 429);
  }

  // The qualification gate sits BEFORE the audit and the name work: a score
  // that cannot reach the board needs no replay and no sanitization.
  const threshold = await currentThreshold();
  if (session.score <= threshold.value && threshold.full) {
    await recordAttempt("not_qualified", ipHash, playerId);
    await prisma.gameSession
      .delete({ where: { gameId } })
      .catch(() => undefined);
    return Response.json({
      accepted: true,
      qualified: false,
      score: session.score,
      threshold: threshold.value,
    });
  }

  // The full replay audit: the game must be verifiable from its recorded
  // actions alone. A mismatch is OUR bug — never the player's.
  const key = deriveGameKey(session.keyVersion, gameId);
  const moves = decodeMoves(session.moves);
  const deadline = Date.now() + 250;
  const audit = moves ? replay(key, moves, () => Date.now() > deadline) : null;
  if (
    !audit ||
    !audit.ok ||
    audit.state.score !== session.score ||
    boardHash(audit.state) !== session.boardHash ||
    JSON.stringify(audit.state.stats) !== JSON.stringify(session.stats)
  ) {
    await recordAttempt("audit_failed", ipHash, playerId);
    return errorResponse("audit_failed", 500);
  }

  // durationMs is active play time and must come from the client (the
  // server cannot see inactivity or reconnecting pauses) — clamped so it
  // can never exceed the wall clock.
  const wall = Date.now() - session.createdAt.getTime();
  const durationMs = Math.min(body.durationMs, wall + CLOCK_SKEW_MS);
  const suspicious = durationMs < audit.state.moveCount * MIN_MS_PER_MOVE;

  // Name checks: 5 rejected-name attempts per player per hour.
  const nameRejections = await attemptsInWindow({ playerId }, HOUR, [
    "rejected_name",
    "bad_name",
  ]);
  if (nameRejections >= 5) {
    await recordAttempt("rate_limited", ipHash, playerId);
    return errorResponse("rate_limited", 429);
  }
  const name = validateName(body.name);
  if (!name.ok) {
    const outcome = name.reason === "rejected" ? "rejected_name" : "bad_name";
    await recordAttempt(outcome, ipHash, playerId);
    return errorResponse(outcome, 422);
  }

  // Insert-and-evict in one transaction, serialised by an advisory lock.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "SELECT pg_advisory_xact_lock(hashtext('leaderboard'))",
      );
      // re-check under the lock: the threshold may have moved
      const rows = await tx.score.findMany({
        orderBy: [{ score: "desc" }, { createdAt: "asc" }],
        select: { score: true },
      });
      const full = rows.length >= LEADERBOARD_SIZE;
      const lowest = full ? rows[rows.length - 1]!.score : 0;
      if (full && audit.state.score <= lowest) {
        throw new NotQualified();
      }
      await tx.score.create({
        data: {
          gameId,
          playerId,
          name: name.display,
          score: audit.state.score,
          durationMs,
          moveCount: audit.state.moveCount,
          linesPopped: audit.state.stats.linesPopped,
          longestLine: audit.state.stats.longestLine,
          ballsCleared: audit.state.stats.ballsCleared,
          keyVersion: session.keyVersion,
          moves: session.moves,
          engineVersion: session.engineVersion,
          boardHash: session.boardHash,
          ipHash,
          suspicious,
        },
      });
      await tx.$executeRawUnsafe(
        `DELETE FROM "Score" WHERE id IN (
           SELECT id FROM "Score" ORDER BY score DESC, "createdAt" ASC OFFSET ${LEADERBOARD_SIZE}
         )`,
      );
      await tx.gameSession.delete({ where: { gameId } });
    });
  } catch (error) {
    if (error instanceof NotQualified) {
      await recordAttempt("not_qualified", ipHash, playerId);
      await prisma.gameSession
        .delete({ where: { gameId } })
        .catch(() => undefined);
      return Response.json({
        accepted: true,
        qualified: false,
        score: session.score,
        threshold: threshold.value,
      });
    }
    // unique violation from a concurrent double-finish: re-read and answer
    const raced = await prisma.score.findUnique({ where: { gameId } });
    if (raced) {
      await prisma.gameSession
        .delete({ where: { gameId } })
        .catch(() => undefined);
      return Response.json({
        accepted: true,
        qualified: true,
        score: raced.score,
        scoreId: raced.id,
      });
    }
    throw error;
  }

  await recordAttempt("accepted", ipHash, playerId);
  const rank =
    (await prisma.score.count({
      where: { score: { gt: audit.state.score } },
    })) + 1;
  const written = await prisma.score.findUnique({ where: { gameId } });
  return Response.json({
    accepted: true,
    qualified: true,
    score: audit.state.score,
    rank,
    scoreId: written?.id,
  });
}

class NotQualified extends Error {}

async function currentThreshold(): Promise<{ value: number; full: boolean }> {
  const rows = await prisma.score.findMany({
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    select: { score: true },
  });
  return {
    value: rows.length >= LEADERBOARD_SIZE ? rows[rows.length - 1]!.score : 0,
    full: rows.length >= LEADERBOARD_SIZE,
  };
}
