import { describe, it, expect } from "vitest";
import { calculateLineScore } from "./scoring";

describe("calculateLineScore", () => {
  it("returns 0 for lines shorter than 5", () => {
    expect(calculateLineScore(3)).toBe(0);
    expect(calculateLineScore(4)).toBe(0);
  });

  it("returns correct Fibonacci-based score for line length", () => {
    expect(calculateLineScore(5)).toBe(100);
    expect(calculateLineScore(6)).toBe(100);
    expect(calculateLineScore(7)).toBe(200);
    expect(calculateLineScore(8)).toBe(300);
    expect(calculateLineScore(9)).toBe(500);
    expect(calculateLineScore(10)).toBe(800);
    expect(calculateLineScore(11)).toBe(1300);
    expect(calculateLineScore(12)).toBe(2100);
    expect(calculateLineScore(13)).toBe(3400);
    expect(calculateLineScore(14)).toBe(5500);
    expect(calculateLineScore(15)).toBe(8900);
    expect(calculateLineScore(16)).toBe(14400);
    expect(calculateLineScore(17)).toBe(23300);
    expect(calculateLineScore(18)).toBe(37700);
    expect(calculateLineScore(19)).toBe(61000);
    expect(calculateLineScore(30)).toBe(61000); // Max capped at 19
  });

  it("handles edge cases", () => {
    expect(calculateLineScore(0)).toBe(0);
    expect(calculateLineScore(1)).toBe(0);
    expect(calculateLineScore(2)).toBe(0);
    expect(calculateLineScore(-1)).toBe(0);
  });

  it("provides increasing scores for longer lines", () => {
    const scores: number[] = [];
    for (let i = 5; i <= 15; i++) {
      scores.push(calculateLineScore(i));
    }

    // Scores should be non-decreasing (longer lines give more or equal points)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });

  it("caps maximum score at line length 19", () => {
    const maxScore = calculateLineScore(19);
    expect(calculateLineScore(20)).toBe(maxScore);
    expect(calculateLineScore(25)).toBe(maxScore);
    expect(calculateLineScore(50)).toBe(maxScore);
  });

  it("provides significant score differences for different line lengths", () => {
    const score5 = calculateLineScore(5);
    const score10 = calculateLineScore(10);
    const score15 = calculateLineScore(15);

    expect(score10).toBeGreaterThan(score5);
    expect(score15).toBeGreaterThan(score10);
  });
});
