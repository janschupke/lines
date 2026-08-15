import { LEADERBOARD_SIZE } from "@/engine";
import { prisma } from "@/server/db";

export const runtime = "nodejs";
export const revalidate = 60;

/**
 * The whole table — at most LEADERBOARD_SIZE rows, nothing to paginate.
 * Never returns moves, key material, ipHash or playerId.
 */
export async function GET(): Promise<Response> {
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
