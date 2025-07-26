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
    expect(calculateLineScore(10)).toBe(55);
    expect(calculateLineScore(11)).toBe(89);
    expect(calculateLineScore(12)).toBe(144);
    expect(calculateLineScore(13)).toBe(233);
    expect(calculateLineScore(14)).toBe(377);
    expect(calculateLineScore(15)).toBe(610);
    expect(calculateLineScore(16)).toBe(987);
    expect(calculateLineScore(17)).toBe(1597);
    expect(calculateLineScore(18)).toBe(2584);
    expect(calculateLineScore(19)).toBe(4181);
    expect(calculateLineScore(30)).toBe(4181); // Max capped at 19
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

  it("follows the correct Fibonacci sequence", () => {
    // Test that the sequence follows the pattern: 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, ...
    expect(calculateLineScore(5)).toBe(5);
    expect(calculateLineScore(6)).toBe(8);
    expect(calculateLineScore(7)).toBe(13);
    expect(calculateLineScore(8)).toBe(21);
    expect(calculateLineScore(9)).toBe(34);
    
    // Verify that each number is the sum of the previous two (Fibonacci property)
    // Starting from 5, the sequence is: 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, ...
    expect(calculateLineScore(7)).toBe(calculateLineScore(6) + calculateLineScore(5)); // 13 = 8 + 5
    expect(calculateLineScore(8)).toBe(calculateLineScore(7) + calculateLineScore(6)); // 21 = 13 + 8
    expect(calculateLineScore(9)).toBe(calculateLineScore(8) + calculateLineScore(7)); // 34 = 21 + 13
    expect(calculateLineScore(10)).toBe(calculateLineScore(9) + calculateLineScore(8)); // 55 = 34 + 21
  });

  it("provides the correct scoring for the game requirements", () => {
    // According to the user requirements, scoring should be 5,8,13,21,34 for longer lines respectively
    expect(calculateLineScore(5)).toBe(5);   // 5 balls = 5 points
    expect(calculateLineScore(6)).toBe(8);   // 6 balls = 8 points  
    expect(calculateLineScore(7)).toBe(13);  // 7 balls = 13 points
    expect(calculateLineScore(8)).toBe(21);  // 8 balls = 21 points
    expect(calculateLineScore(9)).toBe(34);  // 9 balls = 34 points
    
    // Additional Fibonacci sequence values
    expect(calculateLineScore(10)).toBe(55); // 10 balls = 55 points
    expect(calculateLineScore(11)).toBe(89); // 11 balls = 89 points
    expect(calculateLineScore(12)).toBe(144); // 12 balls = 144 points
  });

  it("provides exponential growth for longer lines", () => {
    // Test that longer lines provide significantly more points
    const score5 = calculateLineScore(5);
    const score10 = calculateLineScore(10);
    const score15 = calculateLineScore(15);
    
    // Each step should provide substantial score increases
    expect(score10).toBeGreaterThan(score5 * 10); // 55 > 5 * 10 = 50
    expect(score15).toBeGreaterThan(score10 * 10); // 610 > 55 * 10 = 550
    
    // Verify the exponential nature
    expect(score15 / score5).toBeGreaterThan(100); // 610 / 5 = 122
  });
});
