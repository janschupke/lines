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

    // Should clear only the stepped-on incoming ball
    expect(result.newBoard[2][2].incomingBall).toBeNull();
    // Should preserve other incoming balls
    expect(result.newBoard[3][3].incomingBall?.color).toBe("yellow");
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

    // Should preserve other incoming balls
    expect(result.newBoard[3][3].incomingBall?.color).toBe("yellow");
    
    // Should return next balls with stepped-on color included
    expect(result.nextBalls).toBeDefined();
    expect(result.nextBalls).toHaveLength(3); // 2 random + 1 stepped-on color
    expect(result.nextBalls).toContain("green"); // stepped-on color should be preserved
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
    expect(result.nextBalls).toHaveLength(3); // 2 random + 1 stepped-on color
    expect(result.nextBalls).toContain("green"); // stepped-on color should be preserved
  });

  it("handles normal move without stepping on incoming ball", () => {
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

    // Should not return nextBalls for normal moves
    expect(result.nextBalls).toBeUndefined();
    expect(result.linesFormed).toBe(false);
  });
}); 
