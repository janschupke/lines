"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { GameStats } from "@/engine";
import { formatTime } from "@/shared/utils";
import { validateName } from "@/shared/names";
import type { SubmissionState } from "@/game/controller";
import { loadLastName } from "@/game/persistence";

interface GameEndDialogProps {
  isOpen: boolean;
  score: number;
  currentGameBeatHighScore: boolean;
  stats: GameStats;
  elapsedMs: number;
  submission: SubmissionState;
  onSubmit: (name: string) => void;
  onRetry: () => void;
  onNewGame: () => void;
  onPlayRanked: () => void;
  onClose: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  rejected_name: "Please choose a different name.",
  bad_name: "Please choose a different name.",
  rate_limited: "Too many submissions. Try again later.",
  engine_version:
    "This game was started on an older version and can no longer be submitted.",
  expired: "This game took too long to submit.",
  invalid_move: "This score couldn't be verified.",
  state_mismatch: "This score couldn't be verified.",
  bad_token: "This score couldn't be verified.",
  audit_failed: "Something went wrong saving your score.",
  no_session: "This game's session has expired.",
};

function graphemeCount(s: string): number {
  let n = 0;
  for (const _ of new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  }).segment(s)) {
    n++;
  }
  return n;
}

const GameEndDialog: React.FC<GameEndDialogProps> = ({
  isOpen,
  score,
  currentGameBeatHighScore,
  stats,
  elapsedMs,
  submission,
  onSubmit,
  onRetry,
  onNewGame,
  onPlayRanked,
  onClose,
}) => {
  const [name, setName] = useState<string>(() => loadLastName());
  const inputRef = useRef<HTMLInputElement>(null);
  const verdict = useMemo(() => validateName(name), [name]);
  const graphemes = useMemo(() => graphemeCount(name.trim()), [name]);

  useEffect(() => {
    if (isOpen && submission.status === "idle") inputRef.current?.focus();
  }, [isOpen, submission.status]);

  if (!isOpen) return null;

  const canSubmit = verdict.ok && submission.status !== "submitting";

  const submissionSection = () => {
    switch (submission.status) {
      case "casual":
        return (
          <div className="text-center mb-6" data-testid="submission-casual">
            <div className="text-game-text-secondary mb-1">
              Local casual best:{" "}
              <span className="game-score">
                {Math.max(submission.casualBest, score)}
              </span>
            </div>
            {submission.switched && (
              <div className="text-game-text-secondary mb-2 text-sm">
                This game switched to Casual, so it isn&apos;t eligible for the
                leaderboard.
              </div>
            )}
            <div className="text-game-text-secondary text-sm mb-2">
              Ranked games go on the leaderboard.
            </div>
            <button
              className="game-button game-button-primary px-4 py-2"
              onClick={onPlayRanked}
            >
              Play ranked
            </button>
          </div>
        );
      case "checking":
        return (
          <div
            className="text-center text-game-text-secondary mb-6"
            data-testid="submission-checking"
          >
            Checking the leaderboard…
          </div>
        );
      case "not-qualified":
        return (
          <div
            className="text-center mb-6"
            data-testid="submission-not-qualified"
          >
            <div className="text-game-text-secondary">
              {score} — that&apos;s not quite the top 20 yet.
            </div>
            {submission.threshold !== null && (
              <div className="text-game-text-secondary text-sm">
                The board starts at {submission.threshold}.
              </div>
            )}
          </div>
        );
      case "unreachable":
        return (
          <div
            className="text-center mb-6"
            data-testid="submission-unreachable"
          >
            <div className="text-game-text-secondary mb-2">
              Couldn&apos;t reach the server.
            </div>
            <button
              className="game-button game-button-primary px-4 py-2"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        );
      case "accepted":
        return (
          <div className="text-center mb-6" data-testid="submission-accepted">
            <div className="game-score text-xl mb-2">
              Added to the leaderboard
              {submission.rank !== null ? ` at #${submission.rank}` : ""}
            </div>
            <div className="flex justify-center gap-4">
              <Link
                className="text-game-text-accent underline"
                href={
                  submission.scoreId
                    ? `/leaderboard#score-${submission.scoreId}`
                    : "/leaderboard"
                }
              >
                See the board
              </Link>
              {submission.scoreId && (
                <Link
                  className="text-game-text-accent underline"
                  href={`/replay/${submission.scoreId}`}
                >
                  Watch replay
                </Link>
              )}
            </div>
          </div>
        );
      case "idle":
      case "submitting":
      case "rejected":
        return (
          <div className="mb-6" data-testid="submission-form">
            {submission.status === "rejected" && submission.errorCode && (
              <div
                className="text-game-text-error text-sm text-center mb-2"
                data-testid="submission-error"
              >
                {ERROR_MESSAGES[submission.errorCode] ??
                  "Something went wrong. Try again."}
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <label
                className="text-game-text-secondary text-sm"
                htmlFor="score-name"
              >
                Your name for the leaderboard ({graphemes}/16)
              </label>
              <input
                id="score-name"
                ref={inputRef}
                className="game-panel px-3 py-2 text-game-text-primary bg-transparent outline-hidden border border-game-border-default rounded-lg"
                value={name}
                maxLength={32}
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                enterKeyHint="send"
                disabled={submission.status === "submitting"}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) onSubmit(name);
                }}
              />
              {!verdict.ok && name.trim().length > 0 && (
                <div className="text-game-text-error text-xs">
                  {verdict.reason === "rejected"
                    ? "Please choose a different name."
                    : verdict.reason === "too_long"
                      ? "Keep it to 16 characters."
                      : verdict.reason === "no_letters"
                        ? "Use at least one letter."
                        : "That name can't be used."}
                </div>
              )}
              <button
                className="game-button game-button-accent px-6 py-2 font-bold disabled:opacity-50"
                disabled={!canSubmit}
                data-testid="submit-score"
                onClick={() => onSubmit(name)}
              >
                {submission.status === "submitting"
                  ? "Submitting…"
                  : "Submit score"}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="game-overlay p-6 overflow-auto scrollbar-hide animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-end-title"
      onClick={onClose}
    >
      <div
        className="h-full flex flex-col text-game-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2
            id="game-end-title"
            className="text-4xl font-bold text-game-text-primary"
          >
            {currentGameBeatHighScore ? "🎉 New High Score! 🎉" : "Game Over"}
          </h2>
          <button
            className="text-game-text-primary text-3xl font-bold hover:scale-110 transition-transform cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto scrollbar-hide">
          {/* Main Score Display */}
          <div className="text-center mb-6">
            <div className="game-score score-hero font-bold mb-2">{score}</div>
            <div className="text-xl text-game-text-secondary">Final Score</div>
          </div>

          {/* Submission */}
          <div aria-live="polite">{submissionSection()}</div>

          {/* Game Statistics */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                <div className="text-3xl font-bold text-game-text-primary">
                  {stats.turns}
                </div>
                <div className="text-sm text-game-text-secondary">Turns</div>
              </div>
              <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                <div className="text-3xl font-bold text-game-text-primary">
                  {formatTime((elapsedMs / 1000) | 0)}
                </div>
                <div className="text-sm text-game-text-secondary">Duration</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                <div className="text-3xl font-bold text-game-text-primary">
                  {stats.linesPopped}
                </div>
                <div className="text-sm text-game-text-secondary">
                  Lines Popped
                </div>
              </div>
              <div className="text-center p-4 bg-game-bg-secondary rounded-lg">
                <div className="text-3xl font-bold text-game-text-primary">
                  {stats.longestLine}
                </div>
                <div className="text-sm text-game-text-secondary">
                  Longest Line
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onNewGame}
              className="game-button game-button-accent px-8 py-3 text-lg font-bold"
            >
              Play Again
            </button>
            <button
              onClick={onClose}
              className="game-button game-button-primary px-8 py-3 text-lg font-bold"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameEndDialog;
