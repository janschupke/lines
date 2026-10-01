import { LEADERBOARD_SIZE } from "@/engine";
import { prisma } from "@/server/db";
import { rankedGate } from "@/server/request";

export const runtime = "nodejs";
// Never prerendered: a build must not need the database, and the game-over
// qualification check wants the live threshold anyway.
export const dynamic = "force-dynamic";

/**
 * The whole table — at most LEADERBOARD_SIZE rows, nothing to paginate.
 * Never returns moves, key material, ipHash or playerId.
 */
export async function GET(): Promise<Response> {
  const off = rankedGate();
  if (off) return off;
  const rows = await prisma.score.findMany({
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
  });
  const entries = rows.map((row, i) => ({
    id: row.id,
    rank: i + 1,
    name: row.name,
    score: row.score,
    durationMs: row.durationMs,
    moveCount: row.moveCount,
    linesPopped: row.linesPopped,
    longestLine: row.longestLine,
    createdAt: row.createdAt.toISOString(),
  }));
  const threshold =
    rows.length >= LEADERBOARD_SIZE ? rows[rows.length - 1]!.score : 0;
  return Response.json({ entries, threshold });
}
