import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameAnimation } from "./useGameAnimation";
import type { BallColor, SpawnedBall } from "../game/types";

describe("useGameAnimation", () => {
  describe("initial state", () => {
    it("initializes with no moving ball", () => {
      const { result } = renderHook(() => useGameAnimation());

      expect(result.current.movingBall).toBeNull();
      expect(result.current.movingStep).toBe(0);
      expect(result.current.poppingBalls).toBeDefined();
      expect(result.current.poppingBalls.size).toBe(0);
      expect(result.current.spawningBalls).toEqual([]);
      expect(result.current.currentPhase).toEqual({ type: "idle" });
    });

    it("provides all required methods", () => {
      const { result } = renderHook(() => useGameAnimation());

      expect(result.current.setMovingBall).toBeDefined();
      expect(result.current.setMovingStep).toBeDefined();
      expect(result.current.setPoppingBalls).toBeDefined();
      expect(result.current.startMoveAnimation).toBeDefined();
      expect(result.current.stopMoveAnimation).toBeDefined();
      expect(result.current.startPoppingAnimation).toBeDefined();
      expect(result.current.stopPoppingAnimation).toBeDefined();
      expect(result.current.startSpawningAnimation).toBeDefined();
      expect(result.current.stopSpawningAnimation).toBeDefined();
      expect(result.current.resetAnimationState).toBeDefined();
    });
  });

  describe("moving ball animation", () => {
    it("sets moving ball with color and path", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "red" as BallColor;
      const path: [number, number][] = [
        [0, 0],
        [1, 1],
        [2, 2],
      ];

      act(() => {
        result.current.setMovingBall({ color: ballColor, path });
      });

      expect(result.current.movingBall).toEqual({ color: ballColor, path });
    });

    it("updates moving step", () => {
      const { result } = renderHook(() => useGameAnimation());

      act(() => {
        result.current.setMovingStep(5);
      });

      expect(result.current.movingStep).toBe(5);
    });

    it("starts move animation with startMoveAnimation", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "blue" as BallColor;
      const path: [number, number][] = [
        [0, 0],
        [1, 1],
      ];

      act(() => {
        result.current.startMoveAnimation(ballColor, path);
      });

      expect(result.current.movingBall).toEqual({ color: ballColor, path });
      expect(result.current.movingStep).toBe(0);
      expect(result.current.currentPhase).toEqual({
        type: "moving",
        data: { movingBall: { color: ballColor, path } },
      });
    });

    it("stops move animation with stopMoveAnimation", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "green" as BallColor;
      const path: [number, number][] = [
        [0, 0],
        [1, 1],
      ];

      act(() => {
        result.current.startMoveAnimation(ballColor, path);
        result.current.setMovingStep(3);
        result.current.stopMoveAnimation();
      });

      expect(result.current.movingBall).toBeNull();
      expect(result.current.movingStep).toBe(0);
      expect(result.current.currentPhase).toEqual({ type: "idle" });
    });
  });

  describe("popping balls animation", () => {
    it("sets popping balls", () => {
      const { result } = renderHook(() => useGameAnimation());
      const poppingBalls = new Set(["0,0", "1,1", "2,2"]);

      act(() => {
        result.current.setPoppingBalls(poppingBalls);
      });

      expect(result.current.poppingBalls).toBe(poppingBalls);
      expect(result.current.poppingBalls.size).toBe(3);
    });

    it("clears popping balls", () => {
      const { result } = renderHook(() => useGameAnimation());
      const poppingBalls = new Set(["0,0", "1,1"]);

      act(() => {
        result.current.setPoppingBalls(poppingBalls);
        result.current.setPoppingBalls(new Set());
      });

      expect(result.current.poppingBalls.size).toBe(0);
    });

    it("updates popping balls with new set", () => {
      const { result } = renderHook(() => useGameAnimation());
      const initialPoppingBalls = new Set(["0,0"]);
      const newPoppingBalls = new Set(["1,1", "2,2"]);

      act(() => {
        result.current.setPoppingBalls(initialPoppingBalls);
        result.current.setPoppingBalls(newPoppingBalls);
      });

      expect(result.current.poppingBalls).toBe(newPoppingBalls);
      expect(result.current.poppingBalls.has("0,0")).toBe(false);
      expect(result.current.poppingBalls.has("1,1")).toBe(true);
      expect(result.current.poppingBalls.has("2,2")).toBe(true);
    });

    it("starts popping animation with startPoppingAnimation", () => {
      const { result } = renderHook(() => useGameAnimation());
      const poppingBalls = new Set(["0,0", "1,1"]);

      act(() => {
        result.current.startPoppingAnimation(poppingBalls);
      });

      expect(result.current.poppingBalls).toBe(poppingBalls);
      expect(result.current.currentPhase).toEqual({
        type: "popping",
        data: { poppingBalls },
      });
    });

    it("stops popping animation with stopPoppingAnimation", () => {
      const { result } = renderHook(() => useGameAnimation());
      const poppingBalls = new Set(["0,0", "1,1"]);

      act(() => {
        result.current.startPoppingAnimation(poppingBalls);
        result.current.stopPoppingAnimation();
      });

      expect(result.current.poppingBalls.size).toBe(0);
      expect(result.current.currentPhase).toEqual({ type: "idle" });
    });
  });

  describe("spawning balls animation", () => {
    it("initializes with empty spawning balls", () => {
      const { result } = renderHook(() => useGameAnimation());

      expect(result.current.spawningBalls).toEqual([]);
    });

    it("starts spawning animation with startSpawningAnimation", () => {
      const { result } = renderHook(() => useGameAnimation());
      const spawningBalls: SpawnedBall[] = [
        { x: 0, y: 0, color: "red" as BallColor, isTransitioning: true },
        { x: 1, y: 1, color: "blue" as BallColor, isTransitioning: false },
      ];

      act(() => {
        result.current.startSpawningAnimation(spawningBalls);
      });

      expect(result.current.spawningBalls).toEqual(spawningBalls);
      expect(result.current.currentPhase).toEqual({
        type: "spawning",
        data: { spawningBalls },
      });
    });

    it("stops spawning animation with stopSpawningAnimation", () => {
      const { result } = renderHook(() => useGameAnimation());
      const spawningBalls: SpawnedBall[] = [
        { x: 0, y: 0, color: "red" as BallColor, isTransitioning: true },
      ];

      act(() => {
        result.current.startSpawningAnimation(spawningBalls);
        result.current.stopSpawningAnimation();
      });

      expect(result.current.spawningBalls).toEqual([]);
      expect(result.current.currentPhase).toEqual({ type: "idle" });
    });

    it("adds spawning balls with addSpawningBalls", () => {
      const { result } = renderHook(() => useGameAnimation());
      const spawningBalls: SpawnedBall[] = [
        { x: 0, y: 0, color: "red" as BallColor, isTransitioning: true },
        { x: 1, y: 1, color: "blue" as BallColor, isTransitioning: false },
      ];

      act(() => {
        result.current.addSpawningBalls(spawningBalls);
      });

      expect(result.current.spawningBalls).toEqual(spawningBalls);
    });

    it("removes spawning balls after animation duration", async () => {
      const { result } = renderHook(() => useGameAnimation());
      const spawningBalls: SpawnedBall[] = [
        { x: 0, y: 0, color: "red" as BallColor, isTransitioning: true },
      ];

      act(() => {
        result.current.addSpawningBalls(spawningBalls);
      });

      expect(result.current.spawningBalls).toEqual(spawningBalls);

      // Wait for the animation to complete
      await new Promise((resolve) => setTimeout(resolve, 700));

      expect(result.current.spawningBalls).toEqual([]);
    });
  });

  describe("animation state management", () => {
    it("maintains separate states for moving, popping, and spawning", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "yellow" as BallColor;
      const path: [number, number][] = [
        [0, 0],
        [1, 1],
      ];
      const poppingBalls = new Set(["3,3", "4,4"]);
      const spawningBalls: SpawnedBall[] = [
        { x: 5, y: 5, color: "purple" as BallColor, isTransitioning: true },
      ];

      act(() => {
        result.current.startMoveAnimation(ballColor, path);
        result.current.startPoppingAnimation(poppingBalls);
        result.current.startSpawningAnimation(spawningBalls);
      });

      expect(result.current.movingBall).toEqual({ color: ballColor, path });
      expect(result.current.poppingBalls).toBe(poppingBalls);
      expect(result.current.spawningBalls).toEqual(spawningBalls);
      // Current phase should be the last one set (spawning)
      expect(result.current.currentPhase.type).toBe("spawning");
    });

    it("allows simultaneous moving and popping animations", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "purple" as BallColor;
      const path: [number, number][] = [
        [0, 0],
        [1, 1],
      ];
      const poppingBalls = new Set(["5,5"]);

      act(() => {
        result.current.startMoveAnimation(ballColor, path);
        result.current.setMovingStep(1);
        result.current.startPoppingAnimation(poppingBalls);
      });

      expect(result.current.movingBall).toEqual({ color: ballColor, path });
      expect(result.current.movingStep).toBe(1);
      expect(result.current.poppingBalls).toBe(poppingBalls);
    });
  });

  describe("animation lifecycle", () => {
    it("completes full animation cycle", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "pink" as BallColor;
      const path: [number, number][] = [
        [0, 0],
        [1, 1],
        [2, 2],
      ];

      // Start animation
      act(() => {
        result.current.startMoveAnimation(ballColor, path);
      });

      expect(result.current.movingBall).toEqual({ color: ballColor, path });
      expect(result.current.movingStep).toBe(0);
      expect(result.current.currentPhase.type).toBe("moving");

      // Progress animation
      act(() => {
        result.current.setMovingStep(1);
      });

      expect(result.current.movingStep).toBe(1);

      // Complete animation
      act(() => {
        result.current.setMovingStep(2);
        result.current.stopMoveAnimation();
      });

      expect(result.current.movingBall).toBeNull();
      expect(result.current.movingStep).toBe(0);
      expect(result.current.currentPhase.type).toBe("idle");
    });
  });

  describe("floating score animation", () => {
    it("initializes with empty floating scores", () => {
      const { result } = renderHook(() => useGameAnimation());

      expect(result.current.floatingScores).toEqual([]);
    });

    it("adds floating score with correct properties", () => {
      const { result } = renderHook(() => useGameAnimation());
      const score = 5;
      const x = 3;
      const y = 4;

      act(() => {
        result.current.addFloatingScore(score, x, y);
      });

      expect(result.current.floatingScores).toHaveLength(1);
      const floatingScore = result.current.floatingScores[0];
      expect(floatingScore.score).toBe(score);
      expect(floatingScore.x).toBe(x);
      expect(floatingScore.y).toBe(y);
      expect(floatingScore.id).toBeDefined();
      expect(floatingScore.timestamp).toBeDefined();
    });

    it("adds multiple floating scores", () => {
      const { result } = renderHook(() => useGameAnimation());

      act(() => {
        result.current.addFloatingScore(5, 1, 1);
        result.current.addFloatingScore(3, 2, 2);
      });

      expect(result.current.floatingScores).toHaveLength(2);
      expect(result.current.floatingScores[0].score).toBe(5);
      expect(result.current.floatingScores[1].score).toBe(3);
    });

    it("generates unique IDs for floating scores", () => {
      const { result } = renderHook(() => useGameAnimation());

      act(() => {
        result.current.addFloatingScore(5, 1, 1);
        result.current.addFloatingScore(3, 2, 2);
      });

      const ids = result.current.floatingScores.map((fs) => fs.id);
      expect(ids[0]).not.toBe(ids[1]);
    });

    it("removes floating score after animation duration", async () => {
      const { result } = renderHook(() => useGameAnimation());

      act(() => {
        result.current.addFloatingScore(5, 1, 1);
      });

      expect(result.current.floatingScores).toHaveLength(1);

      // Wait for the animation to complete
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(result.current.floatingScores).toHaveLength(0);
    });
  });

  describe("growing ball animation", () => {
    it("initializes with empty growing balls", () => {
      const { result } = renderHook(() => useGameAnimation());

      expect(result.current.growingBalls).toEqual([]);
    });

    it("adds growing ball with correct properties", () => {
      const { result } = renderHook(() => useGameAnimation());
      const x = 2;
      const y = 3;
      const color = "red" as BallColor;
      const isTransitioning = true;

      act(() => {
        result.current.addGrowingBall(x, y, color, isTransitioning);
      });

      expect(result.current.growingBalls).toHaveLength(1);
      const growingBall = result.current.growingBalls[0];
      expect(growingBall.x).toBe(x);
      expect(growingBall.y).toBe(y);
      expect(growingBall.color).toBe(color);
      expect(growingBall.isTransitioning).toBe(isTransitioning);
      expect(growingBall.id).toBeDefined();
      expect(growingBall.timestamp).toBeDefined();
    });

    it("distinguishes between transitioning and new preview balls", () => {
      const { result } = renderHook(() => useGameAnimation());

      act(() => {
        result.current.addGrowingBall(0, 0, "red" as BallColor, true); // transitioning
        result.current.addGrowingBall(1, 1, "blue" as BallColor, false); // new preview
      });

      expect(result.current.growingBalls).toHaveLength(2);
      expect(result.current.growingBalls[0].isTransitioning).toBe(true);
      expect(result.current.growingBalls[1].isTransitioning).toBe(false);
    });

    it("removes growing ball after animation duration", async () => {
      const { result } = renderHook(() => useGameAnimation());

      act(() => {
        result.current.addGrowingBall(0, 0, "red" as BallColor, true);
      });

      expect(result.current.growingBalls).toHaveLength(1);

      // Wait for the animation to complete
      await new Promise((resolve) => setTimeout(resolve, 700));

      expect(result.current.growingBalls).toHaveLength(0);
    });
  });

  describe("reset animation state", () => {
    it("resets all animation states to initial values", () => {
      const { result } = renderHook(() => useGameAnimation());

      // Set up various animation states
      act(() => {
        result.current.startMoveAnimation("red" as BallColor, [
          [0, 0],
          [1, 1],
        ]);
        result.current.setMovingStep(1);
        result.current.startPoppingAnimation(new Set(["0,0"]));
        result.current.startSpawningAnimation([
          { x: 0, y: 0, color: "blue" as BallColor, isTransitioning: true },
        ]);
        result.current.addFloatingScore(5, 1, 1);
        result.current.addGrowingBall(2, 2, "green" as BallColor, false);
      });

      // Verify states are set
      expect(result.current.movingBall).not.toBeNull();
      expect(result.current.movingStep).toBe(1);
      expect(result.current.poppingBalls.size).toBe(1);
      expect(result.current.spawningBalls.length).toBe(1);
      expect(result.current.floatingScores.length).toBe(1);
      expect(result.current.growingBalls.length).toBe(1);

      // Reset
      act(() => {
        result.current.resetAnimationState();
      });

      // Verify all states are reset
      expect(result.current.movingBall).toBeNull();
      expect(result.current.movingStep).toBe(0);
      expect(result.current.poppingBalls.size).toBe(0);
      expect(result.current.spawningBalls).toEqual([]);
      expect(result.current.floatingScores).toEqual([]);
      expect(result.current.growingBalls).toEqual([]);
      expect(result.current.currentPhase).toEqual({ type: "idle" });
    });
  });
});
