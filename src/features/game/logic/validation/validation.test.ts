import { describe, it, expect, beforeEach } from "vitest";
import { validateMove } from "./validation";
import { createEmptyBoard } from "../board/boardManagement";
import type { Cell, BallColor } from "../../types";

describe("validateMove", () => {
  let board: Cell[][];

  beforeEach(() => {
    board = createEmptyBoard();
  });

  it("validates valid moves correctly", () => {
    // Manually place a ball at (0,0) instead of using random placement
    const boardWithBall = board.map((row) => row.map((cell) => ({ ...cell })));
    boardWithBall[0][0].ball = { color: "red" as BallColor };

    // Valid move from (0,0) to (1,1)
    expect(validateMove(boardWithBall, 0, 0, 1, 1)).toBe(true);
  });

  it("rejects moves to same cell", () => {
    const boardWithBall = board.map((row) => row.map((cell) => ({ ...cell })));
    boardWithBall[0][0].ball = { color: "red" as BallColor };

    // Invalid move: same cell
    expect(validateMove(boardWithBall, 0, 0, 0, 0)).toBe(false);
  });

  it("rejects moves from empty cell", () => {
    // Invalid move: no ball at source
    expect(validateMove(board, 0, 0, 1, 1)).toBe(false);
  });

  it("rejects moves to occupied cell", () => {
    const boardWithBalls = board.map((row) => row.map((cell) => ({ ...cell })));
    boardWithBalls[0][0].ball = { color: "red" as BallColor };
    boardWithBalls[1][1].ball = { color: "blue" as BallColor };

    // Invalid move: target cell occupied
    expect(validateMove(boardWithBalls, 0, 0, 1, 1)).toBe(false);
  });
});
