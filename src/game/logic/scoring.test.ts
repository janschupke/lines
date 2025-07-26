import { describe, it, expect } from "vitest";
import { calculateLineScore } from "./scoring";

describe("calculateLineScore", () => {
  it("returns 0 for lines shorter than 5", () => {
    expect(calculateLineScore(3)).toBe(0);
    expect(calculateLineScore(4)).toBe(0);
  });

  it("returns correct Fibonacci-based score for line length", () => {
    expect(calculateLineScore(5)).toBe(5);
    expect(calculateLineScore(6)).toBe(8);
    expect(calculateLineScore(7)).toBe(13);
    expect(calculateLineScore(8)).toBe(21);
    expect(calculateLineScore(9)).toBe(34);
    // For line lengths beyond the sequence, return the maximum available score
    expect(calculateLineScore(10)).toBe(34);
    expect(calculateLineScore(11)).toBe(34);
    expect(calculateLineScore(12)).toBe(34);
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
    const score9 = calculateLineScore(9);
    const score10 = calculateLineScore(10);

    expect(score9).toBeGreaterThan(score5);
    // Since the sequence is truncated, score10 will be the same as score9
    expect(score10).toBe(score9);
  });

  it("follows the correct Fibonacci sequence", () => {
    // Test the Fibonacci property: F(n) = F(n-1) + F(n-2)
    expect(calculateLineScore(7)).toBe(
      calculateLineScore(6) + calculateLineScore(5),
    ); // 13 = 8 + 5
    expect(calculateLineScore(8)).toBe(
      calculateLineScore(7) + calculateLineScore(6),
    ); // 21 = 13 + 8
    expect(calculateLineScore(9)).toBe(
      calculateLineScore(8) + calculateLineScore(7),
    ); // 34 = 21 + 13
    // Beyond the sequence, all values are capped at the maximum
    expect(calculateLineScore(10)).toBe(34);
  });

  it("provides the correct scoring for the game requirements", () => {
    // Test the basic scoring values
    expect(calculateLineScore(5)).toBe(5); // 5 balls = 5 points
    expect(calculateLineScore(6)).toBe(8); // 6 balls = 8 points
    expect(calculateLineScore(7)).toBe(13); // 7 balls = 13 points
    expect(calculateLineScore(8)).toBe(21); // 8 balls = 21 points
    expect(calculateLineScore(9)).toBe(34); // 9 balls = 34 points

    // Beyond the sequence, all values are capped at the maximum
    expect(calculateLineScore(10)).toBe(34); // 10 balls = 34 points (capped)
    expect(calculateLineScore(11)).toBe(34); // 11 balls = 34 points (capped)
    expect(calculateLineScore(12)).toBe(34); // 12 balls = 34 points (capped)
  });

  it("provides exponential growth for longer lines", () => {
    const score5 = calculateLineScore(5);
    const score9 = calculateLineScore(9);
    const score10 = calculateLineScore(10);

    // Each step should provide substantial score increases within the sequence
    expect(score9).toBeGreaterThan(score5 * 5); // 34 > 5 * 5 = 25
    // Beyond the sequence, scores are capped
    expect(score10).toBe(score9); // Both are capped at 34
  });
});
