"use client";

import React, { useEffect, useRef } from "react";
import { useGameController } from "@/game/useGameController";
import { GATE_AFTER_FAILURES } from "@/game/connection";

/**
 * The reconnect panel and the shared confirm gate (one component, several
 * triggers, differing only in the opening sentence).
 */
const ConnectionOverlays: React.FC = () => {
  const [snapshot, controller] = useGameController();
  const { connection, score } = snapshot;
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (connection.gateOpen) keepRef.current?.focus();
  }, [connection.gateOpen]);

  useEffect(() => {
    if (!connection.gateOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") controller.closeSwitchGate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [connection.gateOpen, controller]);

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
      <div
        className="game-overlay absolute inset-0 bg-slate-800/95 rounded-xl z-50 p-6 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Switch to Casual?"
        data-testid="confirm-gate"
        onClick={() => controller.closeSwitchGate()}
      >
        <div
          className="game-dialog p-5 max-w-sm text-game-text-secondary"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="game-title text-xl mb-3">Switch to Casual?</h3>
          <p className="mb-3">
            {opening} Switching to Casual means this game can&apos;t go on the
            leaderboard — including the{" "}
            <span className="text-game-text-accent font-bold">{score}</span>{" "}
            points you&apos;ve already scored. It will still count towards your
            local best.
          </p>
          {connection.gateTrigger === "connection-lost" && (
            <p className="mb-3">
              You can keep waiting instead; the game is saved and resumes when
              the connection returns.
            </p>
          )}
          <div className="flex flex-col gap-2">
            <button
              ref={keepRef}
              className="game-button game-button-primary px-4 py-2"
              data-testid="gate-keep"
              onClick={() => controller.closeSwitchGate()}
            >
              {connection.gateTrigger === "manual"
                ? "Stay on Ranked"
                : "Keep waiting"}
            </button>
            <button
              className="game-button game-button-accent px-4 py-2"
              data-testid="gate-switch"
              onClick={() => controller.confirmSwitchToCasual()}
            >
              Switch to Casual — leaves the leaderboard
            </button>
          </div>
        </div>
      </div>
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
