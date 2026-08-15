import {
  decodeMoves,
  encodeMoves,
  replay,
  createGame,
  keyedEntropy,
} from "@/engine";
import type { PlacedBall } from "@/engine";
import { prisma } from "@/server/db";
import { deriveGameKey } from "@/server/keys";
import { errorResponse, ipHashOf } from "@/server/request";
import { attemptsInWindow, recordAttempt, HOUR } from "@/server/ratelimit";

export const runtime = "nodejs";

/**
 * The replay for a single Score row: init and packets are RECONSTRUCTED
 * server-side from the game key, which never leaves this process. Replays
 * exist only for games currently on the board — an evicted row 404s.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const ipHash = ipHashOf(request);
  if ((await attemptsInWindow({ ipHash }, HOUR, ["replay"])) >= 120) {
    return errorResponse("rate_limited", 429);
  }
  await recordAttempt("replay", ipHash);

  const row = await prisma.score.findUnique({ where: { id } });
  if (!row) return errorResponse("no_session", 404);

  const moves = decodeMoves(row.moves);
  if (!moves) return errorResponse("audit_failed", 500);
  const key = deriveGameKey(row.keyVersion, row.gameId);
  const initial = createGame(keyedEntropy(key));
  const result = replay(key, moves);
  if (!result.ok) return errorResponse("audit_failed", 500);

  const placed = (arr: Uint8Array): PlacedBall[] => {
    const out: PlacedBall[] = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== 0)
        out.push({ c: i, color: arr[i] as PlacedBall["color"] });
    }
    return out;
  };

  return Response.json(
    {
      name: row.name,
      score: result.state.score,
      stats: result.state.stats,
      engineVersion: row.engineVersion,
      moves: encodeMoves(moves),
      init: { balls: placed(initial.balls), ghosts: placed(initial.ghosts) },
      packets: result.packets,
    },
    {
      headers: {
        // Score rows are immutable; cache hard.
        "cache-control": "public, max-age=31536000, immutable",
      },
    },
  );
}
