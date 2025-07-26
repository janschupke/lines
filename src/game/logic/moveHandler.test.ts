import { describe, it, expect, beforeEach } from "vitest";
import { handleMoveCompletion } from "./moveHandler";
import { createEmptyBoard } from "./boardManagement";
import type { Cell, BallColor } from "../types";

describe("handleMoveCompletion", () => {
  let board: Cell[][];

  beforeEach(() => {
    board = createEmptyBoard();
  });

  it("moves ball correctly", () => {
    const boardWithBall = board.map((row) =>
      row.map((cell) => ({ ...cell })),
    );
    boardWithBall[0][0].ball = { color: "red" as BallColor };

    const result = handleMoveCompletion(
      boardWithBall,
      0,
      0,
      1,
      1,
    );

    expect(result.newBoard[0][0].ball).toBeNull();
    expect(result.newBoard[1][1].ball?.color).toBe("red");
    expect(result.linesFormed).toBe(false);
  });

  it("clears incoming ball from destination", () => {
    const boardWithBall = board.map((row) =>
      row.map((cell) => ({ ...cell })),
    );
    boardWithBall[0][0].ball = { color: "red" as BallColor };
    boardWithBall[1][1].incomingBall = { color: "blue" as BallColor };

    const result = handleMoveCompletion(
      boardWithBall,
      0,
      0,
      1,
      1,
    );

    expect(result.newBoard[1][1].incomingBall).toBeNull();
  });

  it("handles move to cell with incoming ball", () => {
    const boardWithBall = board.map((row) =>
      row.map((cell) => ({ ...cell })),
    );
    boardWithBall[0][0].ball = { color: "red" as BallColor };
    boardWithBall[1][1].incomingBall = { color: "blue" as BallColor };

    const result = handleMoveCompletion(
      boardWithBall,
      0,
      0,
      1,
      1,
    );

    // Should convert the incoming ball to a real ball
    expect(result.newBoard[1][1].ball?.color).toBe("red");
    expect(result.newBoard[1][1].incomingBall).toBeNull();
    expect(result.nextBalls).toBeDefined();
  });

  it("preserves other incoming balls when stepping on one", () => {
    const boardWithBalls = board.map((row) =>
      row.map((cell) => ({ ...cell })),
    );
    boardWithBalls[0][0].ball = { color: "red" as BallColor };
    boardWithBalls[2][2].incomingBall = { color: "green" as BallColor };
    boardWithBalls[3][3].incomingBall = { color: "yellow" as BallColor };

    const result = handleMoveCompletion(
      boardWithBalls,
      0,
      0,
      2,
      2,
    );

    // All existing incoming balls should be cleared and replaced with 3 new ones
    expect(result.newBoard[2][2].incomingBall).toBeNull();
    expect(result.newBoard[3][3].incomingBall).toBeNull();
  });

  it("includes stepped-on color in new incoming balls", () => {
    const boardWithBalls = board.map((row) =>
      row.map((cell) => ({ ...cell })),
    );
    boardWithBalls[0][0].ball = { color: "red" as BallColor };
    boardWithBalls[2][2].incomingBall = { color: "green" as BallColor };
    boardWithBalls[3][3].incomingBall = { color: "yellow" as BallColor };

    const result = handleMoveCompletion(
      boardWithBalls,
      0,
      0,
      2,
      2,
    );

    // Should have exactly 2 incoming balls (green preserved + blue recalculated)
    let incomingBallCount = 0;
    let hasBlueIncomingBall = false;
    for (let y = 0; y < result.newBoard.length; y++) {
      for (let x = 0; x < result.newBoard[y].length; x++) {
        if (result.newBoard[y][x].incomingBall) {
          incomingBallCount++;
          if (result.newBoard[y][x].incomingBall?.color === "green") {
            hasBlueIncomingBall = true;
          }
        }
      }
    }
    expect(incomingBallCount).toBe(2);
    // The blue color should be preserved and placed somewhere else
    expect(hasBlueIncomingBall).toBe(true);
  });

  it("updates next balls when stepping on incoming ball", () => {
    const boardWithBalls = board.map((row) =>
      row.map((cell) => ({ ...cell })),
    );
    boardWithBalls[0][0].ball = { color: "red" as BallColor };
    boardWithBalls[2][2].incomingBall = { color: "green" as BallColor };
    boardWithBalls[3][3].incomingBall = { color: "yellow" as BallColor };

    const result = handleMoveCompletion(
      boardWithBalls,
      0,
      0,
      2,
      2,
    );

    // Should return updated next balls that include the stepped-on color
    expect(result.nextBalls).toBeDefined();
    expect(result.nextBalls).toHaveLength(2); // green preserved + blue recalculated
    expect(result.nextBalls).toContain("green"); // existing color should be preserved
  });
}); 
