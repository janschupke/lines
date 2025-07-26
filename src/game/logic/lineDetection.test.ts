import { describe, it, expect, beforeEach } from "vitest";
import { handleLineDetection } from "./lineDetection";
import { createEmptyBoard } from "./boardManagement";
import type { Cell, BallColor } from "../types";

describe("handleLineDetection", () => {
  let board: Cell[][];

  beforeEach(() => {
    board = createEmptyBoard();
  });

  it("detects horizontal lines", () => {
    // Create a horizontal line of 5 red balls
    const testBoard = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      testBoard[0][i].ball = { color: "red" as BallColor };
    }

    const result = handleLineDetection(testBoard, 2, 0);

    expect(result).not.toBeNull();
    expect(result?.linesFormed).toBe(true);
    expect(result?.pointsEarned).toBe(5);
    expect(result?.ballsRemoved).toHaveLength(5);
  });

  it("detects vertical lines", () => {
    // Create a vertical line of 5 red balls
    const testBoard = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      testBoard[i][0].ball = { color: "red" as BallColor };
    }

    const result = handleLineDetection(testBoard, 0, 2);

    expect(result).not.toBeNull();
    expect(result?.linesFormed).toBe(true);
    expect(result?.pointsEarned).toBe(5);
  });

  it("detects diagonal lines", () => {
    // Create a diagonal line of 5 red balls
    const testBoard = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      testBoard[i][i].ball = { color: "red" as BallColor };
    }

    const result = handleLineDetection(testBoard, 2, 2);

    expect(result).not.toBeNull();
    expect(result?.linesFormed).toBe(true);
    expect(result?.pointsEarned).toBe(5);
  });

  it("returns null when no lines are formed", () => {
    const boardWithBall = board.map((row) =>
      row.map((cell) => ({ ...cell })),
    );
    boardWithBall[0][0].ball = { color: "red" as BallColor };

    const result = handleLineDetection(boardWithBall, 0, 0);

    expect(result).toBeNull();
  });

  it("handles multiple lines simultaneously", () => {
    // Create a cross pattern that forms both horizontal and vertical lines
    const testBoard = createEmptyBoard();

    // Horizontal line at row 2
    for (let i = 0; i < 5; i++) {
      testBoard[2][i].ball = { color: "red" as BallColor };
    }

    // Vertical line at column 2
    for (let i = 0; i < 5; i++) {
      testBoard[i][2].ball = { color: "red" as BallColor };
    }

    const result = handleLineDetection(testBoard, 2, 2);

    expect(result).not.toBeNull();
    expect(result?.linesFormed).toBe(true);
    // Should count all unique balls (9 total, but intersection counted once)
    expect(result?.pointsEarned).toBe(9);
  });

  it("preserves incoming balls when lines are removed", () => {
    // Create a board with incoming balls and a line
    const testBoard = createEmptyBoard();

    // Place incoming balls at specific positions
    testBoard[0][0].incomingBall = { color: "blue" as BallColor };
    testBoard[1][1].incomingBall = { color: "green" as BallColor };
    testBoard[2][2].incomingBall = { color: "yellow" as BallColor };

    // Create a horizontal line of 5 red balls
    for (let i = 0; i < 5; i++) {
      testBoard[3][i].ball = { color: "red" as BallColor };
    }

    const result = handleLineDetection(testBoard, 2, 3);

    expect(result).not.toBeNull();
    expect(result?.linesFormed).toBe(true);
    expect(result?.pointsEarned).toBe(5);

    // Check that incoming balls are preserved in their original positions
    expect(result?.newBoard[0][0].incomingBall?.color).toBe("blue");
    expect(result?.newBoard[1][1].incomingBall?.color).toBe("green");
    expect(result?.newBoard[2][2].incomingBall?.color).toBe("yellow");

    // Check that the line balls were removed
    for (let i = 0; i < 5; i++) {
      expect(result?.newBoard[3][i].ball).toBeNull();
    }
  });

  it("detects longer lines and yields more points", () => {
    // Create a horizontal line of 7 red balls
    const testBoard = createEmptyBoard();
    for (let i = 0; i < 7; i++) {
      testBoard[0][i].ball = { color: "red" as BallColor };
    }

    const result = handleLineDetection(testBoard, 3, 0);

    expect(result).not.toBeNull();
    expect(result?.linesFormed).toBe(true);
    expect(result?.pointsEarned).toBe(7);
    expect(result?.ballsRemoved).toHaveLength(7);
  });

  it("detects diagonal lines in both directions", () => {
    // Create a diagonal line going up-right
    const testBoard = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      testBoard[4 - i][i].ball = { color: "red" as BallColor };
    }

    const result = handleLineDetection(testBoard, 2, 2);

    expect(result).not.toBeNull();
    expect(result?.linesFormed).toBe(true);
    expect(result?.pointsEarned).toBe(5);
  });

  it("handles lines of minimum length", () => {
    // Create a horizontal line of exactly 5 balls (minimum length)
    const testBoard = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      testBoard[0][i].ball = { color: "red" as BallColor };
    }

    const result = handleLineDetection(testBoard, 2, 0);

    expect(result).not.toBeNull();
    expect(result?.linesFormed).toBe(true);
    expect(result?.pointsEarned).toBe(5);
  });

  it("does not detect lines shorter than minimum length", () => {
    // Create a horizontal line of only 4 balls (below minimum)
    const testBoard = createEmptyBoard();
    for (let i = 0; i < 4; i++) {
      testBoard[0][i].ball = { color: "red" as BallColor };
    }

    const result = handleLineDetection(testBoard, 2, 0);

    expect(result).toBeNull();
  });

  it("handles lines with different colors", () => {
    // Create a horizontal line of 5 blue balls
    const testBoard = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      testBoard[0][i].ball = { color: "blue" as BallColor };
    }

    const result = handleLineDetection(testBoard, 2, 0);

    expect(result).not.toBeNull();
    expect(result?.linesFormed).toBe(true);
    expect(result?.pointsEarned).toBe(5);
  });

  it("detects lines in any direction", () => {
    // Test that lines are detected in all four directions
    const directions = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
    ];

    directions.forEach(({ dx, dy }) => {
      const testBoard = createEmptyBoard();
      
      // Create a line in the specified direction
      for (let i = 0; i < 5; i++) {
        const x = 4 + i * dx;
        const y = 4 + i * dy;
        if (x >= 0 && x < 9 && y >= 0 && y < 9) {
          testBoard[y][x].ball = { color: "red" as BallColor };
        }
      }

      const result = handleLineDetection(testBoard, 4, 4);
      expect(result).not.toBeNull();
      expect(result?.linesFormed).toBe(true);
      expect(result?.pointsEarned).toBeGreaterThanOrEqual(5);
    });
  });
}); 
