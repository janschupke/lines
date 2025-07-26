import { describe, it, expect, beforeEach } from "vitest";
import { GamePhaseManager } from "./gamePhaseManager";

describe("GamePhaseManager", () => {
  let gamePhaseManager: GamePhaseManager;

  beforeEach(() => {
    gamePhaseManager = new GamePhaseManager();
  });

  describe("initial state", () => {
    it("starts in idle phase", () => {
      expect(gamePhaseManager.getCurrentPhase()).toBe("idle");
    });

    it("allows moves in idle phase", () => {
      expect(gamePhaseManager.canMakeMove()).toBe(true);
    });

    it("is not animating in idle phase", () => {
      expect(gamePhaseManager.isAnimating()).toBe(false);
    });

    it("is not game over in idle phase", () => {
      expect(gamePhaseManager.isGameOver()).toBe(false);
    });
  });

  describe("phase transitions", () => {
    it("transitions to moving phase", () => {
      gamePhaseManager.transitionTo("moving");
      expect(gamePhaseManager.getCurrentPhase()).toBe("moving");
      expect(gamePhaseManager.isAnimating()).toBe(true);
      expect(gamePhaseManager.canMakeMove()).toBe(false);
    });

    it("transitions to popping phase", () => {
      gamePhaseManager.transitionTo("popping");
      expect(gamePhaseManager.getCurrentPhase()).toBe("popping");
      expect(gamePhaseManager.isAnimating()).toBe(true);
      expect(gamePhaseManager.canMakeMove()).toBe(false);
    });

    it("transitions to converting phase", () => {
      gamePhaseManager.transitionTo("converting");
      expect(gamePhaseManager.getCurrentPhase()).toBe("converting");
      expect(gamePhaseManager.isAnimating()).toBe(false);
      expect(gamePhaseManager.canMakeMove()).toBe(false);
    });

    it("transitions to game over phase", () => {
      gamePhaseManager.transitionTo("gameOver");
      expect(gamePhaseManager.getCurrentPhase()).toBe("gameOver");
      expect(gamePhaseManager.isGameOver()).toBe(true);
      expect(gamePhaseManager.canMakeMove()).toBe(false);
    });

    it("transitions back to idle phase", () => {
      gamePhaseManager.transitionTo("moving");
      gamePhaseManager.transitionTo("idle");
      expect(gamePhaseManager.getCurrentPhase()).toBe("idle");
      expect(gamePhaseManager.canMakeMove()).toBe(true);
      expect(gamePhaseManager.isAnimating()).toBe(false);
    });
  });

  describe("reset", () => {
    it("resets to idle phase", () => {
      gamePhaseManager.transitionTo("gameOver");
      gamePhaseManager.reset();
      expect(gamePhaseManager.getCurrentPhase()).toBe("idle");
      expect(gamePhaseManager.canMakeMove()).toBe(true);
      expect(gamePhaseManager.isGameOver()).toBe(false);
    });
  });

  describe("animation states", () => {
    it("identifies moving as animating", () => {
      gamePhaseManager.transitionTo("moving");
      expect(gamePhaseManager.isAnimating()).toBe(true);
    });

    it("identifies popping as animating", () => {
      gamePhaseManager.transitionTo("popping");
      expect(gamePhaseManager.isAnimating()).toBe(true);
    });

    it("identifies converting as not animating", () => {
      gamePhaseManager.transitionTo("converting");
      expect(gamePhaseManager.isAnimating()).toBe(false);
    });

    it("identifies idle as not animating", () => {
      expect(gamePhaseManager.isAnimating()).toBe(false);
    });

    it("identifies game over as not animating", () => {
      gamePhaseManager.transitionTo("gameOver");
      expect(gamePhaseManager.isAnimating()).toBe(false);
    });
  });

  describe("move permissions", () => {
    it("allows moves only in idle phase", () => {
      expect(gamePhaseManager.canMakeMove()).toBe(true);

      gamePhaseManager.transitionTo("moving");
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      gamePhaseManager.transitionTo("popping");
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      gamePhaseManager.transitionTo("converting");
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      gamePhaseManager.transitionTo("gameOver");
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      gamePhaseManager.transitionTo("idle");
      expect(gamePhaseManager.canMakeMove()).toBe(true);
    });
  });
});
