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

    it("is not spawning in idle phase", () => {
      expect(gamePhaseManager.isSpawning()).toBe(false);
    });

    it("is not converting in idle phase", () => {
      expect(gamePhaseManager.isConverting()).toBe(false);
    });

    it("is not game over in idle phase", () => {
      expect(gamePhaseManager.isGameOver()).toBe(false);
    });

    it("has empty phase data initially", () => {
      expect(gamePhaseManager.getPhaseData()).toEqual({});
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

    it("transitions to spawning phase", () => {
      gamePhaseManager.transitionTo("spawning");
      expect(gamePhaseManager.getCurrentPhase()).toBe("spawning");
      expect(gamePhaseManager.isAnimating()).toBe(true);
      expect(gamePhaseManager.canMakeMove()).toBe(false);
      expect(gamePhaseManager.isSpawning()).toBe(true);
    });

    it("transitions to converting phase", () => {
      gamePhaseManager.transitionTo("converting");
      expect(gamePhaseManager.getCurrentPhase()).toBe("converting");
      expect(gamePhaseManager.isAnimating()).toBe(false);
      expect(gamePhaseManager.canMakeMove()).toBe(false);
      expect(gamePhaseManager.isConverting()).toBe(true);
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

    it("transitions with phase data", () => {
      const phaseData = { moveData: { fromX: 0, fromY: 0, toX: 1, toY: 1 } };
      gamePhaseManager.transitionTo("moving", phaseData);

      expect(gamePhaseManager.getCurrentPhase()).toBe("moving");
      expect(gamePhaseManager.getPhaseData()).toEqual(phaseData);
    });

    it("overwrites phase data on transition", () => {
      const initialData = { moveData: { fromX: 0, fromY: 0, toX: 1, toY: 1 } };
      const newData = { poppingBalls: ["0,0", "1,1"] };

      gamePhaseManager.transitionTo("moving", initialData);
      gamePhaseManager.transitionTo("popping", newData);

      expect(gamePhaseManager.getCurrentPhase()).toBe("popping");
      expect(gamePhaseManager.getPhaseData()).toEqual(newData);
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

    it("clears phase data on reset", () => {
      const phaseData = { moveData: { fromX: 0, fromY: 0, toX: 1, toY: 1 } };
      gamePhaseManager.transitionTo("moving", phaseData);
      gamePhaseManager.reset();

      expect(gamePhaseManager.getPhaseData()).toEqual({});
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

    it("identifies spawning as animating", () => {
      gamePhaseManager.transitionTo("spawning");
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

  describe("spawning states", () => {
    it("identifies spawning phase correctly", () => {
      expect(gamePhaseManager.isSpawning()).toBe(false);

      gamePhaseManager.transitionTo("spawning");
      expect(gamePhaseManager.isSpawning()).toBe(true);

      gamePhaseManager.transitionTo("idle");
      expect(gamePhaseManager.isSpawning()).toBe(false);
    });
  });

  describe("converting states", () => {
    it("identifies converting phase correctly", () => {
      expect(gamePhaseManager.isConverting()).toBe(false);

      gamePhaseManager.transitionTo("converting");
      expect(gamePhaseManager.isConverting()).toBe(true);

      gamePhaseManager.transitionTo("idle");
      expect(gamePhaseManager.isConverting()).toBe(false);
    });
  });

  describe("move permissions", () => {
    it("allows moves only in idle phase", () => {
      expect(gamePhaseManager.canMakeMove()).toBe(true);

      gamePhaseManager.transitionTo("moving");
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      gamePhaseManager.transitionTo("popping");
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      gamePhaseManager.transitionTo("spawning");
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      gamePhaseManager.transitionTo("converting");
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      gamePhaseManager.transitionTo("gameOver");
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      gamePhaseManager.transitionTo("idle");
      expect(gamePhaseManager.canMakeMove()).toBe(true);
    });
  });

  describe("phase descriptions", () => {
    it("provides correct descriptions for all phases", () => {
      expect(gamePhaseManager.getPhaseDescription()).toBe("Ready for moves");

      gamePhaseManager.transitionTo("moving");
      expect(gamePhaseManager.getPhaseDescription()).toBe("Ball is moving");

      gamePhaseManager.transitionTo("popping");
      expect(gamePhaseManager.getPhaseDescription()).toBe("Lines are popping");

      gamePhaseManager.transitionTo("spawning");
      expect(gamePhaseManager.getPhaseDescription()).toBe("Balls are spawning");

      gamePhaseManager.transitionTo("converting");
      expect(gamePhaseManager.getPhaseDescription()).toBe(
        "Converting preview balls",
      );

      gamePhaseManager.transitionTo("gameOver");
      expect(gamePhaseManager.getPhaseDescription()).toBe("Game over");
    });
  });

  describe("complete animation flow", () => {
    it("handles complete animation sequence", () => {
      // Start with idle
      expect(gamePhaseManager.getCurrentPhase()).toBe("idle");
      expect(gamePhaseManager.canMakeMove()).toBe(true);

      // Move phase
      gamePhaseManager.transitionTo("moving", {
        moveData: { fromX: 0, fromY: 0, toX: 1, toY: 1 },
      });
      expect(gamePhaseManager.getCurrentPhase()).toBe("moving");
      expect(gamePhaseManager.isAnimating()).toBe(true);
      expect(gamePhaseManager.canMakeMove()).toBe(false);

      // Popping phase (if lines formed)
      gamePhaseManager.transitionTo("popping", {
        poppingBalls: ["0,0", "1,1"],
      });
      expect(gamePhaseManager.getCurrentPhase()).toBe("popping");
      expect(gamePhaseManager.isAnimating()).toBe(true);

      // Spawning phase
      gamePhaseManager.transitionTo("spawning", {
        spawningBalls: [{ x: 2, y: 2, color: "red", isTransitioning: true }],
      });
      expect(gamePhaseManager.getCurrentPhase()).toBe("spawning");
      expect(gamePhaseManager.isAnimating()).toBe(true);
      expect(gamePhaseManager.isSpawning()).toBe(true);

      // Converting phase
      gamePhaseManager.transitionTo("converting");
      expect(gamePhaseManager.getCurrentPhase()).toBe("converting");
      expect(gamePhaseManager.isAnimating()).toBe(false);
      expect(gamePhaseManager.isConverting()).toBe(true);

      // Back to idle
      gamePhaseManager.transitionTo("idle");
      expect(gamePhaseManager.getCurrentPhase()).toBe("idle");
      expect(gamePhaseManager.canMakeMove()).toBe(true);
      expect(gamePhaseManager.isAnimating()).toBe(false);
    });

    it("handles game over from any phase", () => {
      const phases = ["moving", "popping", "spawning", "converting"] as const;

      phases.forEach((phase) => {
        gamePhaseManager.transitionTo(phase);
        gamePhaseManager.transitionTo("gameOver");

        expect(gamePhaseManager.getCurrentPhase()).toBe("gameOver");
        expect(gamePhaseManager.isGameOver()).toBe(true);
        expect(gamePhaseManager.canMakeMove()).toBe(false);
        expect(gamePhaseManager.isAnimating()).toBe(false);

        gamePhaseManager.reset();
      });
    });
  });
});
