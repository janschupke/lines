import { describe, it, expect, beforeEach } from "vitest";
import { findPath, findUnreachableCells } from "./pathfinding";
import { createEmptyBoard } from "./boardManagement";
import type { Cell, BallColor } from "../types";

describe("findPath", () => {
  let board: Cell[][];

  beforeEach(() => {
    board = createEmptyBoard();
  });

  it("finds direct path when no obstacles", () => {
    const path = findPath(board, { x: 0, y: 0 }, { x: 2, y: 2 });

    expect(path).not.toBeNull();
    // BFS finds shortest path with all intermediate steps
    expect(path!.length).toBeGreaterThanOrEqual(3);
    expect(path![0]).toEqual([0, 0]);
    expect(path![path!.length - 1]).toEqual([2, 2]);
  });

  it("finds path around single obstacle", () => {
    // Place only one obstacle
    board[1][1].ball = { color: "red" as BallColor };

    const path = findPath(board, { x: 0, y: 0 }, { x: 2, y: 2 });

    expect(path).not.toBeNull();
    expect(path![0]).toEqual([0, 0]);
    expect(path![path!.length - 1]).toEqual([2, 2]);

    // Should not go through the obstacle
    const pathSet = new Set(path!.map(([x, y]) => `${x},${y}`));
    expect(pathSet.has("1,1")).toBe(false);
  });

  it("returns null for same start and end", () => {
    const path = findPath(board, { x: 0, y: 0 }, { x: 0, y: 0 });
    expect(path).toBeNull();
  });

  it("returns null when no path exists", () => {
    // Block all possible paths
    for (let i = 0; i < 9; i++) {
      board[1][i].ball = { color: "red" as BallColor };
    }

    const path = findPath(board, { x: 0, y: 0 }, { x: 4, y: 2 });
    expect(path).toBeNull();
  });

  it("finds shortest path", () => {
    const path = findPath(board, { x: 0, y: 0 }, { x: 1, y: 1 });

    expect(path).not.toBeNull();
    // BFS includes all steps, so diagonal path will have intermediate steps
    expect(path!.length).toBeGreaterThanOrEqual(2);
    expect(path![0]).toEqual([0, 0]);
    expect(path![path!.length - 1]).toEqual([1, 1]);
  });

  it("handles edge cases", () => {
    // Test from corner to corner
    const path = findPath(board, { x: 0, y: 0 }, { x: 8, y: 8 });

    expect(path).not.toBeNull();
    expect(path![0]).toEqual([0, 0]);
    expect(path![path!.length - 1]).toEqual([8, 8]);
  });

  it("finds path with diagonal obstacles", () => {
    // Place obstacles in a diagonal pattern
    board[1][1].ball = { color: "red" as BallColor };
    board[2][2].ball = { color: "blue" as BallColor };

    const path = findPath(board, { x: 0, y: 0 }, { x: 3, y: 3 });

    expect(path).not.toBeNull();
    expect(path![0]).toEqual([0, 0]);
    expect(path![path!.length - 1]).toEqual([3, 3]);

    // Should not go through the obstacles
    const pathSet = new Set(path!.map(([x, y]) => `${x},${y}`));
    expect(pathSet.has("1,1")).toBe(false);
    expect(pathSet.has("2,2")).toBe(false);
  });
});

describe("findUnreachableCells", () => {
  let board: Cell[][];

  beforeEach(() => {
    board = createEmptyBoard();
  });

  it("finds no unreachable cells on empty board", () => {
    const unreachable = findUnreachableCells(board, { x: 0, y: 0 });
    expect(unreachable).toEqual([]);
  });

  it("finds unreachable cells when blocked by obstacles", () => {
    // Create a wall that blocks access to half the board
    for (let i = 0; i < 9; i++) {
      board[4][i].ball = { color: "red" as BallColor };
    }

    const unreachable = findUnreachableCells(board, { x: 0, y: 0 });

    // Should find cells on the other side of the wall
    expect(unreachable.length).toBeGreaterThan(0);

    // All unreachable cells should be on the other side of the wall
    unreachable.forEach(([x, y]) => {
      expect(y).toBeGreaterThan(4);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(9);
    });
  });

  it("finds unreachable cells in isolated areas", () => {
    // Create a wall that completely blocks access to some cells
    for (let i = 0; i < 9; i++) {
      board[3][i].ball = { color: "red" as BallColor };
    }
    // Also block the left and right edges
    for (let i = 0; i < 9; i++) {
      board[i][3].ball = { color: "blue" as BallColor };
    }

    const unreachable = findUnreachableCells(board, { x: 0, y: 0 });

    // Should find some unreachable cells
    expect(unreachable.length).toBeGreaterThan(0);

    // Cells in the isolated area should be unreachable
    const unreachableSet = new Set(unreachable.map(([x, y]) => `${x},${y}`));
    expect(unreachableSet.has("4,4")).toBe(true);
  });

  it("handles edge cases", () => {
    // Test from corner position
    const unreachable = findUnreachableCells(board, { x: 8, y: 8 });
    expect(unreachable).toEqual([]);
  });
});
