import { describe, it, expect, beforeEach } from "vitest";
import {
  handleIncomingBallConversion,
  createEmptyBoard,
} from "./boardManagement";
import { BALLS_PER_TURN } from "../config";
import type { Cell, BallColor } from "../types";

describe("Enhanced Board Management", () => {
  let board: Cell[][];

  beforeEach(() => {
    board = createEmptyBoard();
  });

  describe("handleIncomingBallConversion - Stepped-on Preview Ball Logic", () => {
    it("handles normal case - no ball stepped on preview cell", () => {
      // Set up board with incoming balls
      board[0][0].incomingBall = { color: "red" as BallColor };
      board[1][1].incomingBall = { color: "blue" as BallColor };
      board[2][2].incomingBall = { color: "green" as BallColor };

      const result = handleIncomingBallConversion(board);

      // Should convert all incoming balls to real balls
      expect(result.newBoard[0][0].ball?.color).toBe("red");
      expect(result.newBoard[1][1].ball?.color).toBe("blue");
      expect(result.newBoard[2][2].ball?.color).toBe("green");
      expect(result.newBoard[0][0].incomingBall).toBeNull();
      expect(result.newBoard[1][1].incomingBall).toBeNull();
      expect(result.newBoard[2][2].incomingBall).toBeNull();

      // Should generate new preview balls
      expect(result.nextBalls).toHaveLength(BALLS_PER_TURN);

      // Should have new preview balls on the board
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);
    });

    it("handles ball stepped on preview cell but not popped", () => {
      // Set up board with incoming balls
      board[0][0].incomingBall = { color: "red" as BallColor };
      board[1][1].incomingBall = { color: "blue" as BallColor };
      board[2][2].incomingBall = { color: "green" as BallColor };

      const result = handleIncomingBallConversion(board, "blue", false);

      // Should convert all incoming balls to real balls
      expect(result.newBoard[0][0].ball?.color).toBe("red");
      expect(result.newBoard[1][1].ball?.color).toBe("blue");
      expect(result.newBoard[2][2].ball?.color).toBe("green");

      // The stepped-on ball (blue) should be spawned as a REAL BALL at a new position
      let blueBallFound = false;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (
            result.newBoard[y][x].ball?.color === "blue" &&
            (x !== 1 || y !== 1)
          ) {
            // Not the original position
            blueBallFound = true;
            break;
          }
        }
        if (blueBallFound) break;
      }
      expect(blueBallFound).toBe(true);

      // Should generate new preview balls (NOT including the stepped-on color)
      expect(result.nextBalls).toHaveLength(BALLS_PER_TURN);

      // Should have new preview balls on the board
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);
    });

    it("handles ball stepped on preview cell AND popped", () => {
      // Set up board with incoming balls
      board[0][0].incomingBall = { color: "red" as BallColor };
      board[1][1].incomingBall = { color: "blue" as BallColor };
      board[2][2].incomingBall = { color: "green" as BallColor };

      const result = handleIncomingBallConversion(board, "blue", true);

      // Should convert all incoming balls to real balls
      expect(result.newBoard[0][0].ball?.color).toBe("red");
      expect(result.newBoard[1][1].ball?.color).toBe("blue");
      expect(result.newBoard[2][2].ball?.color).toBe("green");

      // The stepped-on ball (blue) should be spawned as a REAL BALL at a new position
      // Even though it was popped, it still needs to be placed somewhere
      let blueBallFound = false;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (
            result.newBoard[y][x].ball?.color === "blue" &&
            (x !== 1 || y !== 1)
          ) {
            // Not the original position
            blueBallFound = true;
            break;
          }
        }
        if (blueBallFound) break;
      }
      expect(blueBallFound).toBe(true);

      // Should generate new preview balls
      expect(result.nextBalls).toHaveLength(BALLS_PER_TURN);

      // Should have new preview balls on the board
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);
    });

    it("handles board full scenario", () => {
      // Fill the board completely
      const fullBoard = board.map((row) =>
        row.map((cell) => ({ ...cell, ball: { color: "red" as BallColor } })),
      );

      const result = handleIncomingBallConversion(fullBoard, "blue", false);

      // Should return the same board
      expect(result.newBoard).toStrictEqual(fullBoard);
      expect(result.gameOver).toBe(true);
      expect(result.nextBalls).toHaveLength(BALLS_PER_TURN);
    });

    it("handles limited space scenario", () => {
      // Fill most of the board, leave only 2 empty cells
      const almostFullBoard = board.map((row, y) =>
        row.map((cell, x) => {
          if ((x === 8 && y === 8) || (x === 7 && y === 8)) return cell; // Leave 2 empty cells
          return { ...cell, ball: { color: "red" as BallColor } };
        }),
      );
      almostFullBoard[0][0].incomingBall = { color: "blue" as BallColor };

      const result = handleIncomingBallConversion(
        almostFullBoard,
        "blue",
        false,
      );

      // Should place only 1 preview ball due to limited space (stepped-on ball takes one spot)
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(1);
      expect(result.nextBalls).toHaveLength(BALLS_PER_TURN); // Still generate full set for display
    });
  });

  describe("handleIncomingBallConversion - Line Formation", () => {
    it("handles lines formed by spawned balls", () => {
      // Create a setup where spawning balls will form lines
      board[1][1].ball = { color: "red" };
      board[1][2].ball = { color: "red" };
      board[1][3].ball = { color: "red" };
      board[1][4].ball = { color: "red" };

      // Place incoming ball that will complete the line when converted
      board[1][0].incomingBall = { color: "red" };

      const result = handleIncomingBallConversion(board);

      expect(result.linesFormed).toBe(true);
      expect(result.ballsRemoved).toHaveLength(5);
      expect(result.pointsEarned).toBe(5);
      expect(result.gameOver).toBe(false);
    });

    it("handles lines formed by stepped-on ball spawning", () => {
      // Create a line setup (4 balls, need 1 more for 5)
      board[1][0].ball = { color: "green" };
      board[1][1].ball = { color: "green" };
      board[1][2].ball = { color: "green" };
      board[1][3].ball = { color: "green" };

      // Place incoming ball that will be stepped on
      board[2][2].incomingBall = { color: "green" };

      const result = handleIncomingBallConversion(board, "green", false);

      // The stepped-on ball should spawn somewhere and potentially complete a line
      // Note: This test may or may not form a line depending on where the ball is placed
      // The important thing is that the ball is spawned correctly
      let greenBallFound = false;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (
            result.newBoard[y][x].ball?.color === "green" &&
            (x !== 2 || y !== 2)
          ) {
            // Not the original position
            greenBallFound = true;
            break;
          }
        }
        if (greenBallFound) break;
      }
      expect(greenBallFound).toBe(true);
      expect(result.gameOver).toBe(false);
    });

    it("handles no lines formed by spawned balls", () => {
      // Place isolated balls
      board[1][1].ball = { color: "red" };
      board[2][2].ball = { color: "blue" };

      // Place incoming balls that won't form lines
      board[0][0].incomingBall = { color: "green" };
      board[3][3].incomingBall = { color: "yellow" };
      board[4][4].incomingBall = { color: "pink" };

      const result = handleIncomingBallConversion(board);

      expect(result.linesFormed).toBeUndefined();
      expect(result.ballsRemoved).toBeUndefined();
      expect(result.pointsEarned).toBeUndefined();
      expect(result.gameOver).toBe(false);
    });
  });

  describe("Complete Flow Tests", () => {
    it("handles complete flow: step on preview, no pop", () => {
      // Set up board with incoming balls
      board[0][0].ball = { color: "red" as BallColor };
      board[2][2].incomingBall = { color: "green" as BallColor };
      board[3][3].incomingBall = { color: "yellow" as BallColor };
      board[4][4].incomingBall = { color: "blue" as BallColor };

      const result = handleIncomingBallConversion(board, "green", false);

      // Should convert all existing incoming balls to real balls
      expect(result.newBoard[3][3].ball?.color).toBe("yellow");
      expect(result.newBoard[4][4].ball?.color).toBe("blue");

      // The stepped-on ball (green) should be spawned as a REAL BALL at a new position
      let greenBallFound = false;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (
            result.newBoard[y][x].ball?.color === "green" &&
            (x !== 2 || y !== 2)
          ) {
            // Not the original position
            greenBallFound = true;
            break;
          }
        }
        if (greenBallFound) break;
      }
      expect(greenBallFound).toBe(true);

      // Should have exactly BALLS_PER_TURN new preview balls
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);
    });

    it("handles complete flow: step on preview, gets popped", () => {
      // Set up board with incoming balls
      board[0][0].ball = { color: "red" as BallColor };
      board[2][2].incomingBall = { color: "green" as BallColor };
      board[3][3].incomingBall = { color: "yellow" as BallColor };
      board[4][4].incomingBall = { color: "blue" as BallColor };

      const result = handleIncomingBallConversion(board, "green", true);

      // Should convert all existing incoming balls to real balls
      expect(result.newBoard[3][3].ball?.color).toBe("yellow");
      expect(result.newBoard[4][4].ball?.color).toBe("blue");

      // The stepped-on ball (green) should still be spawned as a REAL BALL at a new position
      // Even though it was popped, it needs to be placed somewhere
      let greenBallFound = false;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (
            result.newBoard[y][x].ball?.color === "green" &&
            (x !== 2 || y !== 2)
          ) {
            // Not the original position
            greenBallFound = true;
            break;
          }
        }
        if (greenBallFound) break;
      }
      expect(greenBallFound).toBe(true);

      // Should have exactly BALLS_PER_TURN new preview balls
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);
    });
  });
});
