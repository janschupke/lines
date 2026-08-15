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

  const switchDisabled = probing || (!isRanked && !canSwitchToRankedInPlace);

  return (
    // The wrapper anchors the popover: it must NOT sit inside the
    // .game-panel chip, whose overflow-hidden clips it into invisibility.
    <div className="relative">
      <div
        className="game-panel px-3 py-1 flex items-center gap-2 text-sm"
        data-testid="mode-chip"
        data-mode={probing ? "checking" : active}
        aria-live="polite"
        aria-label={`${label} mode — ${reasonText}`}
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
          className="px-1.5 py-0.5 rounded-sm text-game-text-secondary hover:text-game-text-primary hover:bg-game-bg-tertiary cursor-pointer"
          aria-label="About game modes"
          aria-expanded={infoOpen}
          onClick={() => setInfoOpen((v) => !v)}
        >
          ⓘ
        </button>
        <button
          className={`px-1.5 py-0.5 rounded-sm ${
            switchDisabled
              ? "text-game-border-default cursor-default"
              : "text-game-text-secondary hover:text-game-text-primary hover:bg-game-bg-tertiary cursor-pointer"
          }`}
          aria-label={isRanked ? "Switch to Casual" : "Switch to Ranked"}
          data-testid="mode-switch"
          aria-disabled={switchDisabled}
          title={
            !isRanked && !canSwitchToRankedInPlace
              ? "Ranked games have to start from the beginning."
              : isRanked
                ? "Switch to Casual"
                : "Switch to Ranked"
          }
          onClick={onSwitch}
        >
          ⇄
        </button>
      </div>
      {infoOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-80 max-w-[90vw] game-dialog z-50 p-4 mt-1 text-left text-game-text-secondary text-sm"
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
          <p className="mb-2">
            {label}: {subtitle} — {reasonText}.
          </p>
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
