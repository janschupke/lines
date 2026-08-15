"use client";

import React, { useState } from "react";
import { useGameController } from "@/game/useGameController";
import { REASON_TEXT } from "@/game/mode";

/**
 * Persistent mode indicator — the player must be able to answer "what am I
 * playing right now?" at any moment. Never a transient toast.
 */
const ModeChip: React.FC = () => {
  const [snapshot, controller] = useGameController();
  const [infoOpen, setInfoOpen] = useState(false);
  const { active, reason, probing, canSwitchToRankedInPlace } = snapshot.mode;

  const isRanked = active === "ranked" && !probing;
  const label = probing ? "Casual" : isRanked ? "Ranked" : "Casual";
  const reasonText = probing ? REASON_TEXT.checking : REASON_TEXT[reason];
  const subtitle = isRanked
    ? "verified by the server"
    : "instant · works offline";

  const onSwitch = () => {
    if (probing) return;
    if (isRanked) {
      if (snapshot.score > 0 || snapshot.stats.turns > 0) {
        controller.openSwitchGate();
      } else {
        controller.startCasualGame();
      }
    } else if (canSwitchToRankedInPlace) {
      controller.startRankedGame();
    }
  };

  return (
    <div
      className="game-panel px-3 py-1 flex items-center gap-2 text-sm"
      data-testid="mode-chip"
      data-mode={probing ? "checking" : active}
      aria-live="polite"
      aria-label={`${label} mode — ${reasonText}`}
      title={`${label}: ${subtitle} — ${reasonText}`}
    >
      <span
        className={
          isRanked
            ? "text-game-text-accent font-semibold"
            : "text-game-text-secondary font-semibold"
        }
      >
        {isRanked ? "◆" : "◇"} {label}
      </span>
      <span
        className="mode-reason-text text-game-text-secondary"
        data-testid="mode-reason"
      >
        {reasonText}
      </span>
      <button
        className="text-game-text-secondary hover:text-game-text-primary cursor-pointer"
        aria-label="About game modes"
        onClick={() => setInfoOpen((v) => !v)}
      >
        ⓘ
      </button>
      <button
        className={`cursor-pointer ${
          probing || (!isRanked && !canSwitchToRankedInPlace)
            ? "text-game-border-default"
            : "text-game-text-secondary hover:text-game-text-primary"
        }`}
        aria-label="Switch mode"
        data-testid="mode-switch"
        aria-disabled={probing || (!isRanked && !canSwitchToRankedInPlace)}
        title={
          !isRanked && !canSwitchToRankedInPlace
            ? "Ranked games have to start from the beginning."
            : "Switch mode"
        }
        onClick={onSwitch}
      >
        ⇄
      </button>
      {infoOpen && (
        <div
          className="absolute top-full left-0 right-0 game-dialog z-50 p-4 mt-1 text-left text-game-text-secondary text-sm"
          role="dialog"
          aria-label="About game modes"
        >
          <p className="mb-2">
            <span className="text-game-text-accent font-semibold">Ranked</span>{" "}
            is for the leaderboard: the server referees every move, so games
            can&apos;t be played with foreknowledge. Needs a connection.
          </p>
          <p className="mb-2">
            <span className="text-game-text-primary font-semibold">Casual</span>{" "}
            is for playing: instant, works offline. Scores stay on your device
            as a local best.
          </p>
          <p className="mb-2">Right now: {reasonText}.</p>
          {!isRanked && !canSwitchToRankedInPlace && (
            <p className="mb-2">
              Ranked games have to start from the beginning.{" "}
              <button
                className="underline cursor-pointer"
                data-testid="start-ranked"
                onClick={() => {
                  setInfoOpen(false);
                  controller.startRankedGame();
                }}
              >
                Start a ranked game
              </button>
            </p>
          )}
          <button
            className="game-button game-button-primary px-3 py-1 mt-1"
            onClick={() => setInfoOpen(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ModeChip;
