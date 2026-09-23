"use client";

import React from "react";
import { useGameController } from "@/game/useGameController";
import { GATE_AFTER_FAILURES } from "@/game/connection";
import ConfirmDialog from "@/shared/components/ConfirmDialog/ConfirmDialog";

/**
 * The reconnect panel and the confirm gate (several triggers, differing only
 * in the opening sentence). The gate's Escape and backdrop handling lives in
 * ConfirmDialog now — both resolve to "keep the ranked game", never to the
 * destructive branch.
 */
const ConnectionOverlays: React.FC = () => {
  const [snapshot, controller] = useGameController();
  const { connection, score } = snapshot;

  if (connection.state === "n/a" || connection.state === "live") {
    if (!connection.gateOpen) return null;
  }

  if (connection.gateOpen) {
    const opening =
      connection.gateTrigger === "manual"
        ? "This game is currently refereed by the server."
        : connection.gateTrigger === "session-expired"
          ? "This game's server session has expired."
          : "Couldn't reach the server.";
    return (
      <ConfirmDialog
        open
        title="Switch to Casual?"
        testId="confirm-gate"
        cancelTestId="gate-keep"
        confirmTestId="gate-switch"
        cancelLabel={
          connection.gateTrigger === "manual"
            ? "Stay on Ranked"
            : "Keep waiting"
        }
        confirmLabel="Switch to Casual — leaves the leaderboard"
        onCancel={() => controller.closeSwitchGate()}
        onConfirm={() => controller.confirmSwitchToCasual()}
      >
        <p className="mb-3">
          {opening} Switching to Casual means this game can&apos;t go on the
          leaderboard — including the{" "}
          <span className="text-game-text-accent font-bold">{score}</span>{" "}
          points you&apos;ve already scored. It will still count towards your
          local best.
        </p>
        {connection.gateTrigger === "connection-lost" && (
          <p className="mb-3">
            You can keep waiting instead; the game is saved and resumes when the
            connection returns.
          </p>
        )}
      </ConfirmDialog>
    );
  }

  if (connection.state === "reconnecting") {
    return (
      <div
        className="absolute inset-0 bg-slate-800/90 rounded-xl z-40 flex items-center justify-center"
        data-testid="reconnect-panel"
      >
        <div className="game-panel p-5 text-center text-game-text-secondary">
          <div className="game-title text-lg mb-2">Reconnecting…</div>
          <div className="text-sm mb-3">
            Attempt {connection.attempt} — your game is safe.
          </div>
          {connection.attempt >= GATE_AFTER_FAILURES && (
            <button
              className="game-button game-button-primary px-4 py-2"
              onClick={() => controller.openSwitchGate()}
            >
              Options…
            </button>
          )}
        </div>
      </div>
    );
  }

  if (connection.state === "syncing") {
    return (
      <div
        className="absolute top-2 right-2 z-30 text-game-text-secondary text-xs game-panel px-2 py-1"
        data-testid="syncing-indicator"
      >
        syncing…
      </div>
    );
  }

  return null;
};

export default ConnectionOverlays;
