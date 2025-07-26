import { describe, it, expect, beforeEach } from "vitest";
import {
  handleLineDetection,
  handleMultiPositionLineDetection,
} from "./lineDetection";
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
    const boardWithBall = board.map((row) => row.map((cell) => ({ ...cell })));
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
    expect(result?.pointsEarned).toBe(34);
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
    expect(result?.pointsEarned).toBe(13);
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

describe("handleMultiPositionLineDetection", () => {
  it("handles multiple positions with overlapping lines", () => {
    // Create a board with balls that will form lines when new balls are added
    const board = createEmptyBoard();

    // Place balls to create potential lines (4 balls each, need 1 more for 5)
    board[1][1].ball = { color: "red" };
    board[1][2].ball = { color: "red" };
    board[1][3].ball = { color: "red" };
    board[1][4].ball = { color: "red" };
    board[2][1].ball = { color: "blue" };
    board[2][2].ball = { color: "blue" };
    board[2][3].ball = { color: "blue" };
    board[2][4].ball = { color: "blue" };

    // Add balls at positions that will complete lines
    board[1][0].ball = { color: "red" };
    board[2][0].ball = { color: "blue" };

    const positions: [number, number][] = [
      [0, 1],
      [0, 2],
    ];
    const result = handleMultiPositionLineDetection(board, positions);

    expect(result).not.toBeNull();
    expect(result!.linesFormed).toBe(true);
    expect(result!.ballsRemoved).toHaveLength(10); // 5 red + 5 blue
    expect(result!.pointsEarned).toBe(34); // Capped at maximum Fibonacci value
  });

  it("handles multiple positions with no lines", () => {
    const board = createEmptyBoard();

    // Place isolated balls
    board[1][1].ball = { color: "red" };
    board[2][2].ball = { color: "blue" };

    const positions: [number, number][] = [
      [1, 1],
      [2, 2],
    ];
    const result = handleMultiPositionLineDetection(board, positions);

    expect(result).toBeNull();
  });

  it("handles diagonal lines correctly", () => {
    const board = createEmptyBoard();

    // Create diagonal line (4 balls, need 1 more for 5)
    board[0][0].ball = { color: "green" };
    board[1][1].ball = { color: "green" };
    board[2][2].ball = { color: "green" };
    board[3][3].ball = { color: "green" };

    // Add ball that completes diagonal
    board[4][4].ball = { color: "green" };

    const positions: [number, number][] = [[4, 4]];
    const result = handleMultiPositionLineDetection(board, positions);

    expect(result).not.toBeNull();
    expect(result!.linesFormed).toBe(true);
    expect(result!.ballsRemoved).toHaveLength(5);
    expect(result!.pointsEarned).toBe(5);
  });

  it("handles edge cases with board boundaries", () => {
    const board = createEmptyBoard();

    // Create line at board edge (4 balls, need 1 more for 5)
    board[0][0].ball = { color: "yellow" };
    board[0][1].ball = { color: "yellow" };
    board[0][2].ball = { color: "yellow" };
    board[0][3].ball = { color: "yellow" };

    // Add ball that completes edge line
    board[0][4].ball = { color: "yellow" };

    const positions: [number, number][] = [[4, 0]];
    const result = handleMultiPositionLineDetection(board, positions);

    expect(result).not.toBeNull();
    expect(result!.linesFormed).toBe(true);
    expect(result!.ballsRemoved).toHaveLength(5);
    expect(result!.pointsEarned).toBe(5);
  });

  it("handles positions with no balls", () => {
    const board = createEmptyBoard();

    // Place some balls
    board[1][1].ball = { color: "red" };
    board[1][2].ball = { color: "red" };
    board[1][3].ball = { color: "red" };

    // Include position with no ball
    const positions: [number, number][] = [
      [1, 1],
      [5, 5],
    ]; // [5,5] has no ball
    const result = handleMultiPositionLineDetection(board, positions);

    expect(result).toBeNull(); // No line formed because [5,5] has no ball
  });

  it("prevents duplicate line detection", () => {
    const board = createEmptyBoard();

    // Create a line (4 balls, need 1 more for 5)
    board[1][0].ball = { color: "green" };
    board[1][1].ball = { color: "green" };
    board[1][2].ball = { color: "green" };
    board[1][3].ball = { color: "green" };
    board[1][4].ball = { color: "green" };

    // Check both ends of the same line
    const positions: [number, number][] = [
      [0, 1],
      [4, 1],
    ];
    const result = handleMultiPositionLineDetection(board, positions);

    expect(result).not.toBeNull();
    expect(result!.linesFormed).toBe(true);
    expect(result!.ballsRemoved).toHaveLength(5); // Should not count balls twice
    expect(result!.pointsEarned).toBe(5);
  });

  it("debug: test single line detection", () => {
    const board = createEmptyBoard();

    // Create horizontal line (4 balls, need 1 more for 5)
    board[2][0].ball = { color: "red" };
    board[2][1].ball = { color: "red" };
    board[2][2].ball = { color: "red" };
    board[2][3].ball = { color: "red" };
    board[2][4].ball = { color: "red" };

    const positions: [number, number][] = [[2, 2]];
    const result = handleMultiPositionLineDetection(board, positions);

    expect(result).not.toBeNull();
    expect(result!.linesFormed).toBe(true);
    expect(result!.ballsRemoved).toHaveLength(5);
    expect(result!.pointsEarned).toBe(5);
  });

  it("debug: test vertical line detection", () => {
    const board = createEmptyBoard();

    // Create vertical line (4 balls, need 1 more for 5)
    board[0][2].ball = { color: "blue" };
    board[1][2].ball = { color: "blue" };
    board[2][2].ball = { color: "blue" };
    board[3][2].ball = { color: "blue" };
    board[4][2].ball = { color: "blue" };

    const positions: [number, number][] = [[2, 2]];
    const result = handleMultiPositionLineDetection(board, positions);

    expect(result).not.toBeNull();
    expect(result!.linesFormed).toBe(true);
    expect(result!.ballsRemoved).toHaveLength(5);
    expect(result!.pointsEarned).toBe(5);
  });
});
