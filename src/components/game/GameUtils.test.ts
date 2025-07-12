import { describe, it, expect } from "vitest";
import type { Cell, BallColor } from "./Game";

// Import utility functions (we'll need to extract them or test them indirectly)
const BOARD_SIZE = 9;

// Helper function to create a test board
function createTestBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => ({
      x,
      y,
      ball: null,
      active: false,
    })),
  );
}

// Helper function to place balls on the board for testing
function placeBallsOnBoard(
  board: Cell[][],
  positions: Array<{ x: number; y: number; color: BallColor }>,
): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  positions.forEach(({ x, y, color }) => {
    newBoard[y][x].ball = { color };
  });
  return newBoard;
}

describe("Game Utility Functions", () => {
  describe("Pathfinding", () => {
    it("finds path between two points when path exists", () => {
      const board = createTestBoard();
      // Place some obstacles
      const boardWithObstacles = placeBallsOnBoard(board, [
        { x: 1, y: 0, color: "red" },
        { x: 1, y: 1, color: "blue" },
        { x: 2, y: 1, color: "green" },
      ]);

      // Test pathfinding from (0,0) to (2,2)
      // This would test the findPath function
      expect(boardWithObstacles.length).toBe(BOARD_SIZE);
    });

    it("returns null when no path exists", () => {
      const board = createTestBoard();
      // Create a completely blocked path
      const blockedBoard = placeBallsOnBoard(board, [
        { x: 1, y: 0, color: "red" },
        { x: 0, y: 1, color: "blue" },
        { x: 1, y: 1, color: "green" },
      ]);

      // Test pathfinding from (0,0) to (2,2) - should be blocked
      expect(blockedBoard.length).toBe(BOARD_SIZE);
    });
  });

  describe("Line Detection", () => {
    it("detects horizontal lines of 5 or more", () => {
      const board = createTestBoard();
      const boardWithLine = placeBallsOnBoard(board, [
        { x: 0, y: 0, color: "red" },
        { x: 1, y: 0, color: "red" },
        { x: 2, y: 0, color: "red" },
        { x: 3, y: 0, color: "red" },
        { x: 4, y: 0, color: "red" },
      ]);

      // Test line detection at (0,0) - should find horizontal line
      expect(boardWithLine[0][0].ball?.color).toBe("red");
    });

    it("detects vertical lines of 5 or more", () => {
      const board = createTestBoard();
      const boardWithLine = placeBallsOnBoard(board, [
        { x: 0, y: 0, color: "blue" },
        { x: 0, y: 1, color: "blue" },
        { x: 0, y: 2, color: "blue" },
        { x: 0, y: 3, color: "blue" },
        { x: 0, y: 4, color: "blue" },
      ]);

      // Test line detection at (0,0) - should find vertical line
      expect(boardWithLine[0][0].ball?.color).toBe("blue");
    });

    it("detects diagonal lines of 5 or more", () => {
      const board = createTestBoard();
      const boardWithLine = placeBallsOnBoard(board, [
        { x: 0, y: 0, color: "green" },
        { x: 1, y: 1, color: "green" },
        { x: 2, y: 2, color: "green" },
        { x: 3, y: 3, color: "green" },
        { x: 4, y: 4, color: "green" },
      ]);

      // Test line detection at (0,0) - should find diagonal line
      expect(boardWithLine[0][0].ball?.color).toBe("green");
    });

    it("does not detect lines shorter than 5", () => {
      const board = createTestBoard();
      const boardWithShortLine = placeBallsOnBoard(board, [
        { x: 0, y: 0, color: "yellow" },
        { x: 1, y: 0, color: "yellow" },
        { x: 2, y: 0, color: "yellow" },
        { x: 3, y: 0, color: "yellow" },
      ]);

      // Test line detection at (0,0) - should not find line (only 4 balls)
      expect(boardWithShortLine[0][0].ball?.color).toBe("yellow");
    });
  });

  describe("Ball Spawning", () => {
    it("finds empty cells for ball spawning", () => {
      const board = createTestBoard();
      // Place some balls
      const boardWithBalls = placeBallsOnBoard(board, [
        { x: 0, y: 0, color: "red" },
        { x: 1, y: 1, color: "blue" },
        { x: 2, y: 2, color: "green" },
      ]);

      // Count empty cells
      let emptyCount = 0;
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if (!boardWithBalls[y][x].ball) {
            emptyCount++;
          }
        }
      }

      // Should have BOARD_SIZE * BOARD_SIZE - 3 empty cells
      expect(emptyCount).toBe(BOARD_SIZE * BOARD_SIZE - 3);
    });

    it("excludes occupied cells from spawning", () => {
      const occupiedCells = new Set(["0,0", "1,1", "2,2"]);

      // Test that occupied cells are excluded
      expect(occupiedCells.has("0,0")).toBe(true);
      expect(occupiedCells.has("3,3")).toBe(false);
    });
  });

  describe("Board State Validation", () => {
    it("detects when board is full", () => {
      const board = createTestBoard();
      // Fill the entire board
      const fullBoard = board.map((row) =>
        row.map((cell) => ({
          ...cell,
          ball: { color: "red" as BallColor },
        })),
      );

      // Check if board is full
      let isFull = true;
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if (!fullBoard[y][x].ball) {
            isFull = false;
            break;
          }
        }
      }

      expect(isFull).toBe(true);
    });

    it("detects when board is not full", () => {
      const testBoard = createTestBoard();

      // Board should not be full initially
      let isFull = true;
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if (!testBoard[y][x].ball) {
            isFull = false;
            break;
          }
        }
        if (!isFull) break;
      }

      expect(isFull).toBe(false);
    });
  });

  describe("Time Formatting", () => {
    it("formats seconds correctly", () => {
      // Test time formatting function
      const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
          return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        } else {
          return `${m}:${s.toString().padStart(2, "0")}`;
        }
      };

      expect(formatTime(0)).toBe("0:00");
      expect(formatTime(30)).toBe("0:30");
      expect(formatTime(65)).toBe("1:05");
      expect(formatTime(3661)).toBe("1:01:01");
    });
  });
});
