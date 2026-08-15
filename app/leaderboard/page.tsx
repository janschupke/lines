import Link from "next/link";
import { LEADERBOARD_SIZE } from "@/engine";
import { prisma } from "@/server/db";
import { formatTime } from "@/shared/utils";
import HighlightOwnRow from "./HighlightOwnRow";

export const runtime = "nodejs";
// Twenty rows, one query: dynamic rendering costs nothing and means a
// just-submitted score is always visible (ISR + the client router cache
// would otherwise serve a stale page right after submit).
export const dynamic = "force-dynamic";

/**
 * A genuine server component (unlike the game). One board, 20 rows, no
 * tabs, no paging, no "your scores" section — the table holds exactly what
 * is displayed.
 */
export default async function LeaderboardPage() {
  const rows = await prisma.score.findMany({
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: LEADERBOARD_SIZE,
  });

  return (
    <div className="min-h-screen text-game-text-primary p-4 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4 mt-2">
          <h1 className="game-title text-3xl">Leaderboard</h1>
          <Link href="/" className="game-button game-button-primary px-4 py-2">
            Back to the game
          </Link>
        </div>
        <p className="text-game-text-secondary mb-4">
          Every game here was refereed by the server, move by move.
        </p>

        {rows.length === 0 ? (
          <div className="game-panel p-8 text-center text-game-text-secondary">
            No scores yet — the board is waiting for its first ranked game.
          </div>
        ) : (
          <div className="game-panel p-4 overflow-x-auto">
            <table className="w-full text-sm" data-testid="leaderboard">
              <thead>
                <tr className="text-game-text-secondary text-left">
                  <th className="p-2">#</th>
                  <th className="p-2">Name</th>
                  <th className="p-2 text-right">Score</th>
                  <th className="p-2 text-right">Duration</th>
                  <th className="p-2 text-right">Moves</th>
                  <th className="p-2 text-right">Lines</th>
                  <th className="p-2 text-right">Longest</th>
                  <th className="p-2 text-right">Date</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    id={`score-${row.id}`}
                    className="border-t border-game-border-default text-game-text-primary"
                  >
                    <td className="p-2 game-score">{i + 1}</td>
                    <td className="p-2">{row.name}</td>
                    <td className="p-2 text-right font-bold">{row.score}</td>
                    <td className="p-2 text-right">
                      {formatTime((row.durationMs / 1000) | 0)}
                    </td>
                    <td className="p-2 text-right">{row.moveCount}</td>
                    <td className="p-2 text-right">{row.linesPopped}</td>
                    <td className="p-2 text-right">{row.longestLine}</td>
                    <td className="p-2 text-right">
                      {row.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="p-2 text-right">
                      <Link
                        className="text-game-text-accent hover:underline"
                        href={`/replay/${row.id}`}
                      >
                        Replay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <HighlightOwnRow />
      </div>
    </div>
  );
}
