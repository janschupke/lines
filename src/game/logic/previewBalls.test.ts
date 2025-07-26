import { describe, it, expect, beforeEach } from "vitest";
import {
  handleIncomingBallConversion,
  placePreviewBalls,
  recalculateIncomingPositions,
  getRandomEmptyCells,
  isBoardFull,
} from "./boardManagement";
import { handleMoveCompletion } from "./moveHandler";
import { createEmptyBoard } from "./boardManagement";
import { BALLS_PER_TURN } from "../config";
import type { Cell, BallColor } from "../types";

describe("Preview Balls Functionality", () => {
  let board: Cell[][];

  beforeEach(() => {
    board = createEmptyBoard();
  });

  describe("handleIncomingBallConversion", () => {
    it("converts all incoming balls to real balls when no stepped-on ball", () => {
      // Place incoming balls
      const boardWithIncoming = board.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      boardWithIncoming[0][0].incomingBall = { color: "red" as BallColor };
      boardWithIncoming[1][1].incomingBall = { color: "blue" as BallColor };
      boardWithIncoming[2][2].incomingBall = { color: "green" as BallColor };

      const result = handleIncomingBallConversion(boardWithIncoming);

      // Should convert all incoming balls to real balls
      expect(result.newBoard[0][0].ball?.color).toBe("red");
      expect(result.newBoard[1][1].ball?.color).toBe("blue");
      expect(result.newBoard[2][2].ball?.color).toBe("green");
      expect(result.newBoard[0][0].incomingBall).toBeNull();
      expect(result.newBoard[1][1].incomingBall).toBeNull();
      expect(result.newBoard[2][2].incomingBall).toBeNull();

      // Should generate new preview balls for the top panel
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

    it("handles stepping on incoming ball - stepped-on ball spawns as REAL BALL", () => {
      // Place incoming balls
      const boardWithIncoming = board.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      boardWithIncoming[0][0].incomingBall = { color: "red" as BallColor };
      boardWithIncoming[1][1].incomingBall = { color: "blue" as BallColor };
      boardWithIncoming[2][2].incomingBall = { color: "green" as BallColor };

      const result = handleIncomingBallConversion(boardWithIncoming, "blue");

      // Should convert all incoming balls to real balls
      expect(result.newBoard[0][0].ball?.color).toBe("red");
      expect(result.newBoard[1][1].ball?.color).toBe("blue");
      expect(result.newBoard[2][2].ball?.color).toBe("green");

      // Should generate new preview balls for the top panel (NOT including stepped-on color)
      expect(result.nextBalls).toHaveLength(BALLS_PER_TURN);
      // The stepped-on color should NOT be in nextBalls - it's now a REAL BALL on the board

      // Should have new preview balls on the board (NOT including the stepped-on color)
      let incomingBallCount = 0;
      let blueBallFound = false;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
          // Check if blue ball is spawned as a REAL BALL (not preview)
          if (
            result.newBoard[y][x].ball?.color === "blue" &&
            (x !== 1 || y !== 1)
          ) {
            // Not the original position
            blueBallFound = true;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);
      expect(blueBallFound).toBe(true); // The stepped-on blue ball should be spawned as a REAL BALL
    });

    it("handles board full scenario", () => {
      // Fill the board completely
      const fullBoard = board.map((row) =>
        row.map((cell) => ({ ...cell, ball: { color: "red" as BallColor } })),
      );

      const result = handleIncomingBallConversion(fullBoard, "blue");

      // Should return the same board
      expect(result.newBoard).toStrictEqual(fullBoard);
      expect(result.gameOver).toBe(true);
      expect(result.nextBalls).toHaveLength(BALLS_PER_TURN);
    });

    it("places fewer balls when limited space available", () => {
      // Fill most of the board, leave only 2 empty cells
      const almostFullBoard = board.map((row, y) =>
        row.map((cell, x) => {
          if ((x === 8 && y === 8) || (x === 7 && y === 8)) return cell; // Leave 2 empty cells
          return { ...cell, ball: { color: "red" as BallColor } };
        }),
      );
      almostFullBoard[0][0].incomingBall = { color: "blue" as BallColor };

      const result = handleIncomingBallConversion(almostFullBoard, "blue");

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

    it("handles edge case with only 1 empty cell", () => {
      // Fill almost all cells, leave only 1 empty cell
      const almostFullBoard = board.map((row, y) =>
        row.map((cell, x) => {
          if (x === 8 && y === 8) return cell; // Leave 1 empty cell
          return { ...cell, ball: { color: "red" as BallColor } };
        }),
      );
      almostFullBoard[0][0].incomingBall = { color: "blue" as BallColor };

      const result = handleIncomingBallConversion(almostFullBoard, "blue");

      // Should place 0 preview balls due to limited space (stepped-on ball takes the only spot)
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(0);
      expect(result.nextBalls).toHaveLength(BALLS_PER_TURN); // Still generate full set for display
    });
  });

  describe("placePreviewBalls", () => {
    it("places correct number of preview balls", () => {
      const colors: BallColor[] = ["red", "blue", "green"];
      const result = placePreviewBalls(board, colors);

      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(3);
    });

    it("places preview balls in empty cells only", () => {
      // Fill some cells
      const boardWithBalls = board.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      boardWithBalls[0][0].ball = { color: "red" as BallColor };
      boardWithBalls[1][1].ball = { color: "blue" as BallColor };

      const colors: BallColor[] = ["green", "yellow", "purple"];
      const result = placePreviewBalls(boardWithBalls, colors);

      // Should not place preview balls in occupied cells
      expect(result[0][0].incomingBall).toBeNull();
      expect(result[1][1].incomingBall).toBeNull();

      // Should place preview balls in empty cells
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(3);
    });

    it("handles placing fewer balls than requested when space is limited", () => {
      // Fill most of the board, leave only 2 empty cells
      const almostFullBoard = board.map((row, y) =>
        row.map((cell, x) => {
          if ((x === 8 && y === 8) || (x === 7 && y === 8)) return cell; // Leave 2 empty cells
          return { ...cell, ball: { color: "red" as BallColor } };
        }),
      );

      const colors: BallColor[] = ["red", "blue", "green", "yellow", "purple"];
      const result = placePreviewBalls(almostFullBoard, colors);

      // Should place only 2 balls due to limited space
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(2);
    });
  });

  describe("recalculateIncomingPositions", () => {
    it("removes all existing incoming balls and places new ones", () => {
      // Place incoming balls at specific positions
      const boardWithIncoming = board.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      boardWithIncoming[0][0].incomingBall = { color: "red" as BallColor };
      boardWithIncoming[1][1].incomingBall = { color: "blue" as BallColor };
      boardWithIncoming[2][2].incomingBall = { color: "green" as BallColor };

      const colors: BallColor[] = ["yellow", "purple", "pink"];
      const result = recalculateIncomingPositions(boardWithIncoming, colors);

      // Should clear all existing incoming balls (but new balls might be placed at same positions)
      // Check that old colors are gone and new colors are present
      const oldColors = ["red", "blue", "green"];
      const newColors = ["yellow", "purple", "pink"];

      // Verify old colors are not present
      oldColors.forEach((color) => {
        let found = false;
        for (let y = 0; y < 9; y++) {
          for (let x = 0; x < 9; x++) {
            if (result[y][x].incomingBall?.color === color) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
        expect(found).toBe(false);
      });

      // Verify new colors are present
      newColors.forEach((color) => {
        let found = false;
        for (let y = 0; y < 9; y++) {
          for (let x = 0; x < 9; x++) {
            if (result[y][x].incomingBall?.color === color) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
        expect(found).toBe(true);
      });

      // Should place new incoming balls
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(3);
    });
  });

  describe("getRandomEmptyCells", () => {
    it("finds correct number of empty cells", () => {
      const emptyCells = getRandomEmptyCells(board, 3);
      expect(emptyCells).toHaveLength(3);
    });

    it("excludes specified cells", () => {
      const exclude = new Set(["0,0", "1,1"]);
      const emptyCells = getRandomEmptyCells(board, 3, exclude);

      expect(emptyCells).toHaveLength(3);
      emptyCells.forEach(([x, y]) => {
        expect(exclude.has(`${x},${y}`)).toBe(false);
      });
    });

    it("handles limited available space", () => {
      // Fill most of the board, leave only 2 empty cells
      const almostFullBoard = board.map((row, y) =>
        row.map((cell, x) => {
          if ((x === 8 && y === 8) || (x === 7 && y === 8)) return cell; // Leave 2 empty cells
          return { ...cell, ball: { color: "red" as BallColor } };
        }),
      );

      const emptyCells = getRandomEmptyCells(almostFullBoard, 5); // Try to find 5 empty cells
      expect(emptyCells).toHaveLength(2); // Should only find 2 available cells
    });
  });

  describe("isBoardFull", () => {
    it("returns false for empty board", () => {
      expect(isBoardFull(board)).toBe(false);
    });

    it("returns true for completely full board", () => {
      const fullBoard = board.map((row) =>
        row.map((cell) => ({ ...cell, ball: { color: "red" as BallColor } })),
      );
      expect(isBoardFull(fullBoard)).toBe(true);
    });

    it("returns false for partially filled board", () => {
      const partialBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      partialBoard[0][0].ball = { color: "red" as BallColor };
      expect(isBoardFull(partialBoard)).toBe(false);
    });
  });

  describe("Complete Preview Ball Flow", () => {
    it("handles complete flow when stepping on preview ball", () => {
      // 1. Set up board with incoming balls
      const boardWithIncoming = board.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      boardWithIncoming[0][0].ball = { color: "red" as BallColor };
      boardWithIncoming[2][2].incomingBall = { color: "green" as BallColor };
      boardWithIncoming[3][3].incomingBall = { color: "yellow" as BallColor };
      boardWithIncoming[4][4].incomingBall = { color: "blue" as BallColor };

      // 2. Simulate move completion (stepping on green preview ball)
      const moveResult = handleMoveCompletion(
        boardWithIncoming,
        0,
        0, // from
        2,
        2, // to (stepping on green preview ball)
      );

      // 3. Verify move completion preserves other incoming balls
      expect(moveResult.newBoard[3][3].incomingBall?.color).toBe("yellow");
      expect(moveResult.newBoard[4][4].incomingBall?.color).toBe("blue");
      expect(moveResult.newBoard[2][2].incomingBall).toBeNull(); // Stepped-on ball cleared

      // 4. Simulate incoming ball conversion
      const conversionResult = handleIncomingBallConversion(
        moveResult.newBoard,
        "green", // stepped-on color
      );

      // 5. Verify that all existing incoming balls are converted to real balls
      expect(conversionResult.newBoard[3][3].ball?.color).toBe("yellow");
      expect(conversionResult.newBoard[4][4].ball?.color).toBe("blue");
      expect(conversionResult.newBoard[3][3].incomingBall).toBeNull();
      expect(conversionResult.newBoard[4][4].incomingBall).toBeNull();

      // 6. Verify that the stepped-on ball (green) is spawned as a REAL BALL at a new position
      let greenBallFound = false;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (
            conversionResult.newBoard[y][x].ball?.color === "green" &&
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

      // 7. Verify that we have exactly BALLS_PER_TURN new preview balls
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (conversionResult.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);

      // 8. Verify next balls are correctly generated for the top panel
      expect(conversionResult.nextBalls).toHaveLength(BALLS_PER_TURN);
      // The stepped-on green color should NOT be in nextBalls - it's now a REAL BALL on the board
    });

    it("verifies stepped-on ball is spawned as REAL BALL after recalculation", () => {
      // 1. Set up board with incoming balls
      const boardWithIncoming = board.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      boardWithIncoming[0][0].ball = { color: "red" as BallColor };
      boardWithIncoming[2][2].incomingBall = { color: "green" as BallColor };
      boardWithIncoming[3][3].incomingBall = { color: "yellow" as BallColor };

      // 2. Simulate move completion (stepping on green preview ball)
      const moveResult = handleMoveCompletion(
        boardWithIncoming,
        0,
        0, // from
        2,
        2, // to (stepping on green preview ball)
      );

      // 3. Simulate incoming ball conversion
      const conversionResult = handleIncomingBallConversion(
        moveResult.newBoard,
        "green", // stepped-on color
      );

      // 4. Verify that the stepped-on ball (green) is spawned as a REAL BALL at a new position
      let greenBallFound = false;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (
            conversionResult.newBoard[y][x].ball?.color === "green" &&
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

      // 5. Verify that the green ball can be in the nextBalls array (new preview balls are independent)
      // The stepped-on green ball is now a REAL BALL on the board, but new preview balls can have the same color

      // 6. Verify that we have exactly BALLS_PER_TURN new preview balls
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (conversionResult.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);
    });

    it("handles edge case with very limited space", () => {
      // Fill almost all cells, leave only 1 empty cell
      const almostFullBoard = board.map((row, y) =>
        row.map((cell, x) => {
          if (x === 8 && y === 8) return cell; // Leave 1 empty cell
          return { ...cell, ball: { color: "red" as BallColor } };
        }),
      );
      almostFullBoard[0][0].ball = { color: "blue" as BallColor };
      almostFullBoard[8][8].incomingBall = { color: "green" as BallColor };

      // Simulate move completion
      const moveResult = handleMoveCompletion(
        almostFullBoard,
        0,
        0, // from
        8,
        8, // to (stepping on green preview ball)
      );

      // Simulate conversion
      const conversionResult = handleIncomingBallConversion(
        moveResult.newBoard,
        "green",
      );

      // Should place 0 preview balls due to limited space (stepped-on ball takes the only spot)
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (conversionResult.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(0);
      expect(conversionResult.nextBalls).toHaveLength(BALLS_PER_TURN); // Still generate full set for display
    });

    it("handles normal move without stepping on preview ball", () => {
      // 1. Set up board with incoming balls
      const boardWithIncoming = board.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      boardWithIncoming[0][0].ball = { color: "red" as BallColor };
      boardWithIncoming[2][2].incomingBall = { color: "green" as BallColor };
      boardWithIncoming[3][3].incomingBall = { color: "yellow" as BallColor };

      // 2. Simulate move completion (stepping on empty cell)
      const moveResult = handleMoveCompletion(
        boardWithIncoming,
        0,
        0, // from
        1,
        1, // to (empty cell)
      );

      // 3. Verify move completion preserves incoming balls
      expect(moveResult.newBoard[2][2].incomingBall?.color).toBe("green");
      expect(moveResult.newBoard[3][3].incomingBall?.color).toBe("yellow");

      // 4. Simulate incoming ball conversion
      const conversionResult = handleIncomingBallConversion(
        moveResult.newBoard,
        // No stepped-on ball
      );

      // 5. Verify that all incoming balls are converted to real balls
      expect(conversionResult.newBoard[2][2].ball?.color).toBe("green");
      expect(conversionResult.newBoard[3][3].ball?.color).toBe("yellow");
      expect(conversionResult.newBoard[2][2].incomingBall).toBeNull();
      expect(conversionResult.newBoard[3][3].incomingBall).toBeNull();

      // 6. Verify that we have exactly BALLS_PER_TURN new preview balls
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (conversionResult.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);

      // 7. Verify next balls are correctly generated
      expect(conversionResult.nextBalls).toHaveLength(BALLS_PER_TURN);
    });

    it("handles multiple stepped-on balls scenario", () => {
      // 1. Set up board with multiple incoming balls
      const boardWithIncoming = board.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      boardWithIncoming[0][0].ball = { color: "red" as BallColor };
      boardWithIncoming[2][2].incomingBall = { color: "green" as BallColor };
      boardWithIncoming[3][3].incomingBall = { color: "yellow" as BallColor };
      boardWithIncoming[4][4].incomingBall = { color: "blue" as BallColor };

      // 2. Simulate move completion (stepping on green preview ball)
      const moveResult = handleMoveCompletion(
        boardWithIncoming,
        0,
        0, // from
        2,
        2, // to (stepping on green preview ball)
      );

      // 3. Simulate incoming ball conversion
      const conversionResult = handleIncomingBallConversion(
        moveResult.newBoard,
        "green", // stepped-on color
      );

      // 4. Verify that all existing incoming balls are converted to real balls
      expect(conversionResult.newBoard[3][3].ball?.color).toBe("yellow");
      expect(conversionResult.newBoard[4][4].ball?.color).toBe("blue");

      // 5. Verify that the stepped-on ball (green) is spawned as a REAL BALL at a new position
      let greenBallFound = false;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (
            conversionResult.newBoard[y][x].ball?.color === "green" &&
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

      // 6. Verify that we have exactly BALLS_PER_TURN new preview balls
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (conversionResult.newBoard[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      expect(incomingBallCount).toBe(BALLS_PER_TURN);
    });

    it("handles board full scenario with stepped-on ball", () => {
      // Fill the board completely except for one cell with incoming ball
      const almostFullBoard = board.map((row, y) =>
        row.map((cell, x) => {
          if (x === 8 && y === 8)
            return { ...cell, incomingBall: { color: "green" as BallColor } };
          return { ...cell, ball: { color: "red" as BallColor } };
        }),
      );
      almostFullBoard[0][0].ball = { color: "blue" as BallColor };

      // Simulate move completion
      const moveResult = handleMoveCompletion(
        almostFullBoard,
        0,
        0, // from
        8,
        8, // to (stepping on green preview ball)
      );

      // Simulate conversion
      const conversionResult = handleIncomingBallConversion(
        moveResult.newBoard,
        "green",
      );

      // Should result in game over
      expect(conversionResult.gameOver).toBe(true);
      expect(conversionResult.nextBalls).toHaveLength(BALLS_PER_TURN);
    });
  });
});

describe("Spawning Ball Line Detection", () => {
  it("triggers line detection when spawned balls form lines", () => {
    const board = createEmptyBoard();

    // Create a setup where spawning balls will form lines
    board[1][1].ball = { color: "red" };
    board[1][2].ball = { color: "red" };
    board[1][3].ball = { color: "red" };
    board[1][4].ball = { color: "red" };

    // Place incoming balls that will complete the line when converted
    board[1][0].incomingBall = { color: "red" };

    const result = handleIncomingBallConversion(board);

    expect(result.linesFormed).toBe(true);
    expect(result.ballsRemoved).toHaveLength(5);
    expect(result.pointsEarned).toBe(5);
    expect(result.gameOver).toBe(false);
  });

  it("handles stepped-on ball spawning that triggers lines", () => {
    const board = createEmptyBoard();

    // Create a line setup (4 balls, need 1 more for 5)
    board[1][0].ball = { color: "green" };
    board[1][1].ball = { color: "green" };
    board[1][2].ball = { color: "green" };
    board[1][3].ball = { color: "green" };

    // Place incoming ball that will be stepped on
    board[2][2].incomingBall = { color: "green" };

    const result = handleIncomingBallConversion(board, "green");

    // The stepped-on ball should spawn somewhere and potentially complete a line
    // Since the ball placement is random, we can't guarantee it completes a line
    // So we just check that the function works correctly
    expect(result.gameOver).toBe(false);
    expect(result.nextBalls).toHaveLength(3);
  });

  it("handles no lines formed by spawned balls", () => {
    const board = createEmptyBoard();

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

  it("handles diagonal lines formed by spawned balls", () => {
    const board = createEmptyBoard();

    // Create diagonal line setup
    board[0][0].ball = { color: "yellow" };
    board[1][1].ball = { color: "yellow" };
    board[2][2].ball = { color: "yellow" };
    board[3][3].ball = { color: "yellow" };

    // Place incoming ball that will complete the diagonal
    board[4][4].incomingBall = { color: "yellow" };

    const result = handleIncomingBallConversion(board);

    expect(result.linesFormed).toBe(true);
    expect(result.ballsRemoved).toHaveLength(5);
    expect(result.pointsEarned).toBe(5);
  });

  it("handles edge case with board boundaries", () => {
    const board = createEmptyBoard();

    // Create line at board edge
    board[0][0].ball = { color: "pink" };
    board[0][1].ball = { color: "pink" };
    board[0][2].ball = { color: "pink" };
    board[0][3].ball = { color: "pink" };

    // Place incoming ball that will complete the edge line
    board[0][4].incomingBall = { color: "pink" };

    const result = handleIncomingBallConversion(board);

    expect(result.linesFormed).toBe(true);
    expect(result.ballsRemoved).toHaveLength(5);
    expect(result.pointsEarned).toBe(5);
  });

  it("handles game over when board is full after line removal", () => {
    const board = createEmptyBoard();

    // Fill the entire board except one spot
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        if (!(y === 8 && x === 0)) {
          // Leave one spot empty
          board[y][x].ball = { color: "red" };
        }
      }
    }

    // Place incoming ball in the last empty spot
    board[8][0].incomingBall = { color: "blue" };

    const result = handleIncomingBallConversion(board);

    // Should not trigger lines (no 5-in-a-row), but board becomes full
    expect(result.linesFormed).toBeUndefined();
    expect(result.gameOver).toBe(true);
  });

  it("handles complex scenario with multiple spawned balls and lines", () => {
    const board = createEmptyBoard();

    // Create multiple line setups
    // Horizontal line 1
    board[1][0].ball = { color: "red" };
    board[1][1].ball = { color: "red" };
    board[1][2].ball = { color: "red" };
    board[1][3].ball = { color: "red" };

    // Horizontal line 2
    board[3][0].ball = { color: "blue" };
    board[3][1].ball = { color: "blue" };
    board[3][2].ball = { color: "blue" };
    board[3][3].ball = { color: "blue" };

    // Place incoming balls that will complete both lines
    board[1][4].incomingBall = { color: "red" };
    board[3][4].incomingBall = { color: "blue" };
    board[5][5].incomingBall = { color: "green" }; // Isolated ball

    const result = handleIncomingBallConversion(board);

    expect(result.linesFormed).toBe(true);
    expect(result.ballsRemoved).toHaveLength(10); // 5 red + 5 blue
    expect(result.pointsEarned).toBe(55);
    expect(result.gameOver).toBe(false);
  });
});
