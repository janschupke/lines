import { describe, it, expect, beforeEach } from "vitest";
import { findPath } from "./pathfinding";
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
