import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameControllerContext } from "@/game/useGameController";
import type { GameController, UiSnapshot } from "@/game/controller";
import ModeChip from "./ModeChip";

const snapshotWith = (over: Partial<UiSnapshot> = {}): UiSnapshot =>
  ({
    score: 0,
    stats: { turns: 0, linesPopped: 0, longestLine: 0, ballsCleared: 0 },
    mode: {
      active: "ranked",
      reason: "connection-good",
      probing: false,
      canSwitchToRankedInPlace: false,
    },
    ...over,
  }) as UiSnapshot;

const renderChip = (snapshot: UiSnapshot = snapshotWith()) => {
  const controller = {
    subscribe: () => () => undefined,
    getSnapshot: () => snapshot,
    openSwitchGate: vi.fn(),
    startCasualGame: vi.fn(),
    startRankedGame: vi.fn(),
  } as unknown as GameController;

  render(
    <GameControllerContext.Provider value={controller}>
      <ModeChip />
    </GameControllerContext.Provider>,
  );
  return controller;
};

const openInfo = () =>
  fireEvent.click(screen.getByRole("button", { name: "About game modes" }));

// Through fireEvent, so the state update the dismissal triggers is flushed
// inside act() before the assertion reads the DOM.
const pressEscape = () => fireEvent.keyDown(document, { key: "Escape" });

const pressOutside = () =>
  fireEvent(document.body, new Event("pointerdown", { bubbles: true }));

const popover = () =>
  screen.queryByRole("dialog", { name: "About game modes" });

describe("ModeChip", () => {
  it("opens the mode explainer from the ⓘ button", () => {
    renderChip();
    expect(popover()).toBeNull();
    openInfo();
    expect(popover()).toBeInTheDocument();
  });

  describe("dismissing the explainer", () => {
    it("closes on Escape", () => {
      renderChip();
      openInfo();
      pressEscape();
      expect(popover()).toBeNull();
    });

    it("closes on a click outside it", () => {
      renderChip();
      openInfo();
      pressOutside();
      expect(popover()).toBeNull();
    });

    it("closes — and stays closed — when ⓘ is pressed again", () => {
      renderChip();
      openInfo();
      // The trigger sits inside the dismiss boundary on purpose: were it
      // outside, this press would dismiss and then re-open in one gesture.
      openInfo();
      expect(popover()).toBeNull();
    });

    it("keeps the explainer open for a click inside it", () => {
      renderChip();
      openInfo();
      fireEvent(
        screen.getByText("Close"),
        new Event("pointerdown", { bubbles: true }),
      );
      expect(popover()).toBeInTheDocument();
    });
  });

  describe("copy", () => {
    it("does not tell the player that only one mode is for playing", () => {
      renderChip();
      openInfo();
      expect(popover()?.textContent).not.toMatch(/is for playing/i);
      expect(popover()?.textContent).not.toMatch(/is for the leaderboard/i);
    });

    it("keeps the implementation out of it", () => {
      renderChip();
      openInfo();
      expect(popover()?.textContent).not.toMatch(/referee/i);
      expect(popover()?.textContent).not.toMatch(/foreknowledge/i);
    });

    it("explains a degrade, in the player's terms", () => {
      renderChip(
        snapshotWith({
          mode: {
            active: "casual",
            reason: "offline",
            probing: false,
            canSwitchToRankedInPlace: false,
          },
        }),
      );
      openInfo();
      expect(popover()?.textContent).toContain(
        "You're playing Casual because you're offline.",
      );
    });

    it("says nothing about why when the player picked the mode", () => {
      renderChip(
        snapshotWith({
          mode: {
            active: "casual",
            reason: "your-choice",
            probing: false,
            canSwitchToRankedInPlace: false,
          },
        }),
      );
      openInfo();
      expect(popover()?.textContent).not.toMatch(
        /You're playing Casual because/,
      );
    });
  });
});
