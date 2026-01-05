import { describe, it, expect, beforeEach } from "vitest";
import { LineDetectionEngine } from "./lineDetectionEngine";
import { LineDirection } from "../../types/enums";
import { BallColor as BallColorEnum, MIN_LINE_LENGTH } from "../../config";
import { createEmptyBoard } from "../board/boardManagement";

describe("LineDetectionEngine", () => {
  let engine: LineDetectionEngine;
  let board: ReturnType<typeof createEmptyBoard>;

  beforeEach(() => {
    engine = new LineDetectionEngine();
    board = createEmptyBoard();
  });

  describe("detectLinesAtPosition", () => {
    it("detects horizontal line", () => {
      // Create horizontal line of 5 red balls
      for (let x = 0; x < 5; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }

      const result = engine.detectLinesAtPosition(board, [2, 0]);

      expect(result).not.toBeNull();
      expect(result?.lines.length).toBeGreaterThan(0);
      expect(result?.lines[0].direction).toBe(LineDirection.Horizontal);
      expect(result?.ballsToRemove.length).toBe(5);
    });

    it("detects vertical line", () => {
      // Create vertical line of 5 blue balls
      for (let y = 0; y < 5; y++) {
        board[y][0].ball = { color: BallColorEnum.Blue };
      }

      const result = engine.detectLinesAtPosition(board, [0, 2]);

      expect(result).not.toBeNull();
      expect(result?.lines[0].direction).toBe(LineDirection.Vertical);
      expect(result?.ballsToRemove.length).toBe(5);
    });

    it("detects diagonal down line", () => {
      // Create diagonal line
      for (let i = 0; i < 5; i++) {
        board[i][i].ball = { color: BallColorEnum.Green };
      }

      const result = engine.detectLinesAtPosition(board, [2, 2]);

      expect(result).not.toBeNull();
      expect(result?.lines[0].direction).toBe(LineDirection.DiagonalDown);
      expect(result?.ballsToRemove.length).toBe(5);
    });

    it("detects diagonal up line", () => {
      // Create diagonal up line
      for (let i = 0; i < 5; i++) {
        board[4 - i][i].ball = { color: BallColorEnum.Yellow };
      }

      const result = engine.detectLinesAtPosition(board, [2, 2]);

      expect(result).not.toBeNull();
      expect(result?.lines[0].direction).toBe(LineDirection.DiagonalUp);
      expect(result?.ballsToRemove.length).toBe(5);
    });

    it("returns null if no lines detected", () => {
      board[0][0].ball = { color: BallColorEnum.Red };
      board[0][1].ball = { color: BallColorEnum.Blue };

      const result = engine.detectLinesAtPosition(board, [0, 0]);

      expect(result).toBeNull();
    });

    it("returns null if line is too short", () => {
      // Create line of 4 balls (less than minimum)
      for (let x = 0; x < 4; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }

      const result = engine.detectLinesAtPosition(board, [1, 0]);

      expect(result).toBeNull();
    });

    it("detects multiple lines at same position", () => {
      // Create both horizontal and vertical lines intersecting
      for (let x = 0; x < 5; x++) {
        board[4][x].ball = { color: BallColorEnum.Red };
      }
      for (let y = 0; y < 5; y++) {
        board[y][4].ball = { color: BallColorEnum.Red };
      }

      const result = engine.detectLinesAtPosition(board, [4, 4]);

      expect(result).not.toBeNull();
      expect(result?.lines.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("detectLinesAtPositions", () => {
    it("detects lines at multiple positions", () => {
      // Create horizontal line
      for (let x = 0; x < 5; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }
      // Create vertical line
      for (let y = 0; y < 5; y++) {
        board[y][5].ball = { color: BallColorEnum.Blue };
      }

      const result = engine.detectLinesAtPositions(board, [
        [2, 0],
        [5, 2],
      ]);

      expect(result).not.toBeNull();
      expect(result?.lines.length).toBeGreaterThanOrEqual(2);
      expect(result?.ballsToRemove.length).toBe(10); // 5 + 5
    });

    it("deduplicates overlapping lines", () => {
      // Create overlapping lines
      for (let x = 0; x < 5; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }
      // Same line detected from two positions
      const result = engine.detectLinesAtPositions(board, [
        [1, 0],
        [2, 0],
      ]);

      expect(result).not.toBeNull();
      // Should only count line once
      expect(result?.lines.length).toBe(1);
      expect(result?.ballsToRemove.length).toBe(5);
    });
  });

  describe("line validation and scoring", () => {
    it("only detects lines of minimum length", () => {
      // Create line of 4 balls (less than minimum)
      for (let x = 0; x < 4; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }

      const result = engine.detectLinesAtPosition(board, [1, 0]);

      expect(result).toBeNull();
    });

    it("calculates correct score for line of 5", () => {
      // Create line of 5 balls
      for (let x = 0; x < 5; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }

      const result = engine.detectLinesAtPosition(board, [2, 0]);

      expect(result).not.toBeNull();
      expect(result?.score).toBe(5);
    });

    it("calculates correct score for line of 9", () => {
      // Create line of 9 balls
      for (let x = 0; x < 9; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }

      const result = engine.detectLinesAtPosition(board, [4, 0]);

      expect(result).not.toBeNull();
      expect(result?.score).toBe(34);
    });
  });

  describe("line continuity validation", () => {
    it("does not detect line with gap in middle", () => {
      // Create balls at positions 0,1,2,4,5 (gap at position 3)
      board[0][0].ball = { color: BallColorEnum.Red };
      board[0][1].ball = { color: BallColorEnum.Red };
      board[0][2].ball = { color: BallColorEnum.Red };
      // Gap at [0][3]
      board[0][4].ball = { color: BallColorEnum.Red };
      board[0][5].ball = { color: BallColorEnum.Red };

      const result = engine.detectLinesAtPosition(board, [2, 0]);

      // Should not detect a line because of the gap
      expect(result).toBeNull();
    });

    it("does not detect line when balls are not touching", () => {
      // Create balls that are in same direction but not adjacent
      board[0][0].ball = { color: BallColorEnum.Red };
      board[0][2].ball = { color: BallColorEnum.Red }; // Skip position 1
      board[0][3].ball = { color: BallColorEnum.Red };
      board[0][4].ball = { color: BallColorEnum.Red };
      board[0][5].ball = { color: BallColorEnum.Red };

      const result = engine.detectLinesAtPosition(board, [3, 0]);

      // Should not detect a line because balls at 0 and 2 are not touching
      expect(result).toBeNull();
    });

    it("detects only continuous lines", () => {
      // Create a continuous line of 5 balls
      for (let x = 0; x < 5; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }
      // Add a disconnected ball in the same row
      board[0][7].ball = { color: BallColorEnum.Red };

      const result = engine.detectLinesAtPosition(board, [2, 0]);

      // Should detect the continuous line of 5, not including the disconnected ball
      expect(result).not.toBeNull();
      expect(result?.ballsToRemove.length).toBe(5);
      // Verify the disconnected ball is not included
      const removedPositions = result?.ballsToRemove.map(
        ([x, y]) => `${x},${y}`,
      );
      expect(removedPositions).not.toContain("7,0");
    });

    it("does not detect line when direction changes", () => {
      // Create an L-shape pattern (not a straight line)
      board[0][0].ball = { color: BallColorEnum.Red };
      board[0][1].ball = { color: BallColorEnum.Red };
      board[0][2].ball = { color: BallColorEnum.Red };
      board[1][2].ball = { color: BallColorEnum.Red };
      board[2][2].ball = { color: BallColorEnum.Red };

      const result = engine.detectLinesAtPosition(board, [2, 0]);

      // Should not detect a line because it's not straight
      expect(result).toBeNull();
    });

    it("handles diagonal lines with gaps correctly", () => {
      // Create diagonal pattern with gap
      board[0][0].ball = { color: BallColorEnum.Red };
      board[1][1].ball = { color: BallColorEnum.Red };
      board[2][2].ball = { color: BallColorEnum.Red };
      // Gap at [3][3]
      board[4][4].ball = { color: BallColorEnum.Red };
      board[5][5].ball = { color: BallColorEnum.Red };

      const result = engine.detectLinesAtPosition(board, [2, 2]);

      // Should not detect a line because of the gap
      expect(result).toBeNull();
    });

    it("detects continuous diagonal line correctly", () => {
      // Create continuous diagonal line
      for (let i = 0; i < 5; i++) {
        board[i][i].ball = { color: BallColorEnum.Red };
      }

      const result = engine.detectLinesAtPosition(board, [2, 2]);

      // Should detect the continuous line
      expect(result).not.toBeNull();
      expect(result?.ballsToRemove.length).toBe(5);
    });
  });
});
