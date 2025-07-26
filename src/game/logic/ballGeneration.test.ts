import { describe, it, expect } from "vitest";
import { getRandomNextBalls } from "./ballGeneration";
import { BALL_COLORS } from "../config";

describe("ballGeneration", () => {
  describe("getRandomNextBalls", () => {
    it("generates correct number of balls", () => {
      const balls = getRandomNextBalls(3);
      expect(balls).toHaveLength(3);
    });

    it("generates valid ball colors", () => {
      const balls = getRandomNextBalls(5);

      balls.forEach((ball) => {
        expect(BALL_COLORS).toContain(ball);
      });
    });

    it("generates different balls on each call", () => {
      const balls1 = getRandomNextBalls(3);
      const balls2 = getRandomNextBalls(3);

      // Note: This test might occasionally fail due to randomness
      // In a real scenario, we might want to mock Math.random for deterministic tests
      expect(balls1).not.toEqual(balls2);
    });

    it("handles zero count", () => {
      const balls = getRandomNextBalls(0);
      expect(balls).toHaveLength(0);
    });

    it("handles large count", () => {
      const balls = getRandomNextBalls(10);
      expect(balls).toHaveLength(10);

      balls.forEach((ball) => {
        expect(BALL_COLORS).toContain(ball);
      });
    });

    it("generates balls within valid color range", () => {
      const balls = getRandomNextBalls(20);

      balls.forEach((ball) => {
        expect(typeof ball).toBe("string");
        expect(BALL_COLORS.includes(ball as any)).toBe(true);
      });
    });
  });
});
