"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  createGame,
  applyAction,
  scriptedEntropy,
  decodeMoves,
  COLOR_NAMES,
  CELL_COUNT,
} from "@/engine";
import type {
  ColorName,
  GameAction,
  GameState,
  GameStats,
  InitPacket,
  SpawnPacket,
} from "@/engine";
import { getBallColor } from "@/shared/utils";

interface ReplayData {
  name: string;
  score: number;
  stats: GameStats;
  moves: string;
  init: InitPacket;
  packets: SpawnPacket[];
}

/**
 * Drives the engine over the recorded moves and packets — the same code
 * path as live play, no second engine. Honours prefers-reduced-motion by
 * starting at the final board.
 */
const ReplayViewer: React.FC<{ id: string }> = ({ id }) => {
  const [data, setData] = useState<ReplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch(`/api/replays/${id}`)
      .then(async (res) => {
        if (!alive) return;
        if (!res.ok) {
          setError(
            res.status === 404
              ? "This replay is gone — its score was surpassed and left the board."
              : "Couldn't load this replay.",
          );
          return;
        }
        const body = (await res.json()) as ReplayData;
        setData(body);
        const reduced =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const total = decodeMoves(body.moves)?.length ?? 0;
        if (reduced) setPosition(total);
      })
      .catch(() => {
        if (alive) setError("Couldn't load this replay.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const moves: GameAction[] = useMemo(
    () => (data ? (decodeMoves(data.moves) ?? []) : []),
    [data],
  );

  /** The board after `position` moves — a pure replay, cached per data. */
  const states: GameState[] = useMemo(() => {
    if (!data) return [];
    const out: GameState[] = [];
    const entropy = scriptedEntropy(data.init, data.packets);
    let state = createGame(scriptedEntropy(data.init, []));
    out.push(state);
    for (const move of moves) {
      const r = applyAction(state, move, entropy);
      if (!r.ok) break;
      state = r.state;
      out.push(state);
    }
    return out;
  }, [data, moves]);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setPosition((p) => {
        if (p >= moves.length) {
          setPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, 1000 / speed);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, moves.length]);

  if (error) {
    return (
      <Shell>
        <div className="game-panel p-8 text-center text-game-text-secondary">
          {error}
        </div>
      </Shell>
    );
  }
  if (!data || states.length === 0) {
    return (
      <Shell>
        <div className="text-game-text-secondary text-center p-8">
          Loading replay…
        </div>
      </Shell>
    );
  }

  const state = states[Math.min(position, states.length - 1)]!;

  return (
    <Shell>
      <div className="flex items-center justify-between mb-3">
        <div className="text-game-text-secondary">
          <span className="game-title text-lg">{data.name}</span> — final score{" "}
          <span className="game-score">{data.score}</span>
        </div>
        <div className="game-score text-lg" data-testid="replay-score">
          {state.score}
        </div>
      </div>

      <div className="game-panel p-4 mb-3">
        <div
          className="game-board board-grid select-none"
          data-testid="replay-board"
          style={{
            gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
            gridTemplateRows: "repeat(9, minmax(0, 1fr))",
            aspectRatio: "1 / 1",
          }}
        >
          {Array.from({ length: CELL_COUNT }, (_, i) => {
            const ball =
              state.balls[i] !== 0
                ? (COLOR_NAMES[state.balls[i]!] as ColorName)
                : null;
            const ghost =
              !ball && state.ghosts[i] !== 0
                ? (COLOR_NAMES[state.ghosts[i]!] as ColorName)
                : null;
            return (
              <div
                key={i}
                className="game-cell relative flex items-center justify-center bg-game-bg-cell-empty border-game-border-default"
                data-cell={i}
                data-ball={ball ?? undefined}
                data-ghost={ghost ?? undefined}
              >
                {ball && (
                  <span
                    className="game-ball ball-main"
                    style={{ backgroundColor: getBallColor(ball) }}
                  />
                )}
                {ghost && (
                  <span
                    className="game-ball rounded-full border border-game-border-preview shadow-xs opacity-50 ball-ghost"
                    style={{ backgroundColor: getBallColor(ghost) }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="game-panel p-3 flex flex-wrap items-center gap-3 text-sm text-game-text-secondary">
        <button
          className="game-button game-button-primary px-3 py-1"
          data-testid="replay-play"
          onClick={() => setPlaying((v) => !v)}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          className="game-button game-button-primary px-3 py-1"
          onClick={() => setPosition((p) => Math.min(p + 1, moves.length))}
        >
          Step
        </button>
        <select
          className="game-panel px-2 py-1 bg-transparent border border-game-border-default rounded-sm"
          value={speed}
          aria-label="Replay speed"
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          <option value={1}>1×</option>
          <option value={4}>4×</option>
          <option value={16}>16×</option>
        </select>
        <input
          className="flex-1 min-w-32"
          type="range"
          min={0}
          max={moves.length}
          value={position}
          data-testid="replay-scrubber"
          aria-label="Replay position"
          onChange={(e) => setPosition(Number(e.target.value))}
        />
        <span data-testid="replay-position">
          move {Math.min(position, moves.length)} / {moves.length}
        </span>
      </div>
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen text-game-text-primary p-4 flex flex-col items-center">
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h1 className="game-title text-2xl">Replay</h1>
        <div className="flex gap-3">
          <Link
            href="/leaderboard"
            className="game-button game-button-primary px-4 py-2"
          >
            Leaderboard
          </Link>
          <Link href="/" className="game-button game-button-primary px-4 py-2">
            Back to the game
          </Link>
        </div>
      </div>
      {children}
    </div>
  </div>
);

export default ReplayViewer;
