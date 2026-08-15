import { describe, it, expect } from "vitest";
import { findPath, reachableFrom } from "./path";
import { indexOf } from "./board";

const empty = () => new Uint8Array(81);

describe("pathfinding", () => {
  it("M9: BFS returns the identical path for the same board, repeatedly", () => {
    const balls = empty();
    balls[indexOf(0, 0)] = 1;
    balls[indexOf(3, 1)] = 2;
    balls[indexOf(1, 3)] = 3;
    const a = findPath(balls, indexOf(0, 0), indexOf(5, 5));
    const b = findPath(balls, indexOf(0, 0), indexOf(5, 5));
    expect(a).toEqual(b);
    expect(a).not.toBeNull();
  });

  it("neighbour order is up, right, down, left", () => {
    // On an empty board, path from (4,4) to (4,2) goes straight up.
    const p = findPath(empty(), indexOf(4, 4), indexOf(4, 2));
    expect(p).toEqual([indexOf(4, 4), indexOf(4, 3), indexOf(4, 2)]);
  });

  it("walls of balls block; ghosts are invisible to it", () => {
    const balls = empty();
    for (let y = 0; y < 9; y++) balls[indexOf(4, y)] = 1; // full wall
    expect(findPath(balls, indexOf(0, 0), indexOf(8, 0))).toBeNull();
    balls[indexOf(4, 8)] = 0; // gap
    expect(findPath(balls, indexOf(0, 0), indexOf(8, 0))).not.toBeNull();
  });

  it("reachableFrom marks the reachable component", () => {
    const balls = empty();
    for (let y = 0; y < 9; y++) balls[indexOf(4, y)] = 1;
    const reach = reachableFrom(balls, indexOf(0, 0));
    expect(reach[indexOf(3, 3)]).toBe(1);
    expect(reach[indexOf(5, 3)]).toBe(0);
  });
});
