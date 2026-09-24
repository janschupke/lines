"use client";

import React, { useRef, useState } from "react";
import { useGameController } from "@/game/useGameController";
import { MODE_BLURB, REASON_TEXT } from "@/game/mode";
import { useDismissable } from "@/shared/hooks/useDismissable";

/** Casual only degrades for a stated cause; a chosen mode needs no excuse. */
const DEGRADE_REASONS = new Set([
  "offline",
  "data-saver",
  "slow-connection",
  "unreliable-history",
  "server-unreachable",
]);

const ShieldIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const DeviceIcon: React.FC<{ className: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

/**
 * Persistent mode indicator — the player must be able to answer "what am I
 * playing right now?" at any moment. Never a transient toast.
 *
 * Presentation rule: Ranked is the default and shows no commentary. The
 * chip only explains itself while checking the connection, or when the
 * game DEGRADED to Casual for a cause outside the player's choice.
 */
const ModeChip: React.FC = () => {
  const [snapshot, controller] = useGameController();
  const [infoOpen, setInfoOpen] = useState(false);
  // Encloses the ⓘ trigger as well as the popover, so pressing ⓘ to close
  // isn't read as an outside click and immediately re-opened.
  const chipRef = useRef<HTMLDivElement>(null);
  useDismissable(infoOpen, chipRef, () => setInfoOpen(false));
  const { active, reason, probing, canSwitchToRankedInPlace } = snapshot.mode;

  const isRanked = active === "ranked" && !probing;
  // While probing the game is HEADED for Ranked — present it that way
  // instead of flashing a meaningless "Casual".
  const label = probing || isRanked ? "Ranked" : "Casual";
  const reasonText = probing ? REASON_TEXT.checking : REASON_TEXT[reason];
  // Only a DEGRADE is worth explaining in prose; "checking connection…" is a
  // status for the chip, not a reason the player is on a mode.
  const degradedReason =
    !probing && !isRanked && DEGRADE_REASONS.has(reason)
      ? REASON_TEXT[reason]
      : null;
  const shownReason = probing ? REASON_TEXT.checking : degradedReason;
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
    <div className="relative" ref={chipRef}>
      <div
        className="game-panel px-3 py-1 flex items-center gap-2 text-sm"
        data-testid="mode-chip"
        data-mode={probing ? "checking" : active}
        aria-live="polite"
        aria-label={`${label} mode — ${reasonText}`}
      >
        <span
          className={`flex items-center gap-1.5 font-semibold ${
            isRanked ? "text-game-text-accent" : "text-game-text-secondary"
          } ${probing ? "opacity-60" : ""}`}
        >
          {label === "Ranked" ? (
            <ShieldIcon className="w-4 h-4" />
          ) : (
            <DeviceIcon className="w-4 h-4" />
          )}
          {label}
        </span>
        {shownReason && (
          <span
            className="mode-reason-text text-game-text-secondary"
            data-testid="mode-reason"
          >
            {shownReason}
          </span>
        )}
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
          // Opens UPWARD: the chip lives in the footer, and the page is
          // built never to scroll, so anything below the chip is unreachable.
          className="absolute bottom-full left-1/2 -translate-x-1/2 w-80 max-w-[90vw] game-dialog z-chrome-popover p-4 mb-1 text-left text-game-text-secondary text-sm"
          role="dialog"
          aria-label="About game modes"
        >
          <p className="mb-2">
            <span className="text-game-text-accent font-semibold">Ranked</span>{" "}
            {MODE_BLURB.ranked}
          </p>
          <p className="mb-2">
            <span className="text-game-text-primary font-semibold">Casual</span>{" "}
            {MODE_BLURB.casual}
          </p>
          {degradedReason && (
            <p className="mb-2">
              You&apos;re playing {label} because {degradedReason}.
            </p>
          )}
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
