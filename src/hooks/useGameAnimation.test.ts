import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameAnimation } from "./useGameAnimation";
import type { BallColor } from "../game/types";

describe("useGameAnimation", () => {
  describe("initial state", () => {
    it("initializes with no moving ball", () => {
      const { result } = renderHook(() => useGameAnimation());

      expect(result.current.movingBall).toBeNull();
      expect(result.current.movingStep).toBe(0);
      expect(result.current.poppingBalls).toBeDefined();
      expect(result.current.poppingBalls.size).toBe(0);
    });

    it("provides all required methods", () => {
      const { result } = renderHook(() => useGameAnimation());

      expect(result.current.setMovingBall).toBeDefined();
      expect(result.current.setMovingStep).toBeDefined();
      expect(result.current.setPoppingBalls).toBeDefined();
      expect(result.current.startMoveAnimation).toBeDefined();
      expect(result.current.stopMoveAnimation).toBeDefined();
    });
  });

  describe("moving ball animation", () => {
    it("sets moving ball with color and path", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "red" as BallColor;
      const path: [number, number][] = [[0, 0], [1, 1], [2, 2]];

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
      const path: [number, number][] = [[0, 0], [1, 1]];

      act(() => {
        result.current.startMoveAnimation(ballColor, path);
      });

      expect(result.current.movingBall).toEqual({ color: ballColor, path });
      expect(result.current.movingStep).toBe(0);
    });

    it("stops move animation with stopMoveAnimation", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "green" as BallColor;
      const path: [number, number][] = [[0, 0], [1, 1]];

      act(() => {
        result.current.startMoveAnimation(ballColor, path);
        result.current.setMovingStep(3);
        result.current.stopMoveAnimation();
      });

      expect(result.current.movingBall).toBeNull();
      expect(result.current.movingStep).toBe(0);
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
  });

  describe("animation state management", () => {
    it("maintains separate states for moving and popping", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "yellow" as BallColor;
      const path: [number, number][] = [[0, 0], [1, 1]];
      const poppingBalls = new Set(["3,3", "4,4"]);

      act(() => {
        result.current.startMoveAnimation(ballColor, path);
        result.current.setPoppingBalls(poppingBalls);
      });

      expect(result.current.movingBall).toEqual({ color: ballColor, path });
      expect(result.current.poppingBalls).toBe(poppingBalls);
    });

    it("allows simultaneous moving and popping animations", () => {
      const { result } = renderHook(() => useGameAnimation());
      const ballColor = "purple" as BallColor;
      const path: [number, number][] = [[0, 0], [1, 1]];
      const poppingBalls = new Set(["5,5"]);

      act(() => {
        result.current.startMoveAnimation(ballColor, path);
        result.current.setMovingStep(1);
        result.current.setPoppingBalls(poppingBalls);
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
      const path: [number, number][] = [[0, 0], [1, 1], [2, 2]];

      // Start animation
      act(() => {
        result.current.startMoveAnimation(ballColor, path);
      });

      expect(result.current.movingBall).toEqual({ color: ballColor, path });
      expect(result.current.movingStep).toBe(0);

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

      const ids = result.current.floatingScores.map(fs => fs.id);
      expect(ids[0]).not.toBe(ids[1]);
    });

    it("removes floating score after animation duration", async () => {
      const { result } = renderHook(() => useGameAnimation());

      act(() => {
        result.current.addFloatingScore(5, 1, 1);
      });

      expect(result.current.floatingScores).toHaveLength(1);

      // Wait for the animation to complete
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(result.current.floatingScores).toHaveLength(0);
    });
  });
}); 
