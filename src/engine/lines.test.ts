import { describe, it, expect } from "vitest";
import { detectLines, resolveLines } from "./lines";
import { scoreForLength } from "./config";
import { indexOf } from "./board";
import { board } from "./testutil";

const empty = () => new Uint8Array(81);

describe("detection & scoring (D matrix)", () => {
  it("D1: 5 in a row on each of the 4 axes", () => {
    // horizontal
    const h = empty();
    for (let x = 2; x < 7; x++) h[indexOf(x, 4)] = 1;
    // vertical
    const v = empty();
    for (let y = 1; y < 6; y++) v[indexOf(3, y)] = 2;
    // diagonal down
    const d = empty();
    for (let k = 0; k < 5; k++) d[indexOf(2 + k, 2 + k)] = 3;
    // diagonal up
    const u = empty();
    for (let k = 0; k < 5; k++) u[indexOf(1 + k, 6 - k)] = 4;
    for (const [b, axis] of [
      [h, 0],
      [v, 1],
      [d, 2],
      [u, 3],
    ] as const) {
      const lines = detectLines(b);
      expect(lines).toHaveLength(1);
      expect(lines[0]!.length).toBe(5);
      expect(lines[0]!.points).toBe(5);
      expect(lines[0]!.cells).toHaveLength(5);
      expect(lines[0]!.axis).toBe(axis);
    }
  });

  it("D2: lengths 6-9 score 8/13/21/34", () => {
    for (const [len, points] of [
      [6, 8],
      [7, 13],
      [8, 21],
      [9, 34],
    ] as const) {
      const b = empty();
      for (let x = 0; x < len; x++) b[indexOf(x, 0)] = 5;
      const lines = detectLines(b);
      expect(lines).toHaveLength(1);
      expect(lines[0]!.points).toBe(points);
    }
  });

  it("D3: length 4 detects nothing", () => {
    const b = empty();
    for (let x = 0; x < 4; x++) b[indexOf(x, 0)] = 1;
    expect(detectLines(b)).toHaveLength(0);
  });

  it("D4: table lookup clamps above 9", () => {
    expect(scoreForLength(10)).toBe(34);
    expect(scoreForLength(99)).toBe(34);
  });

  it("D5: two parallel disjoint 5-lines", () => {
    const b = empty();
    for (let x = 0; x < 5; x++) {
      b[indexOf(x, 0)] = 1;
      b[indexOf(x, 2)] = 1;
    }
    const lines = detectLines(b);
    expect(lines).toHaveLength(2);
    const { rounds } = resolveLines(b);
    expect(rounds[0]!.points).toBe(10);
    expect(rounds[0]!.cells).toHaveLength(10);
  });

  it("D6: two 5-lines crossing at one cell — 10 points, 9 cells", () => {
    const b = empty();
    for (let x = 0; x < 5; x++) b[indexOf(x, 2)] = 1; // H through (2,2)
    for (let y = 0; y < 5; y++) b[indexOf(2, y)] = 1; // V through (2,2)
    const lines = detectLines(b);
    expect(lines).toHaveLength(2);
    const { rounds, balls } = resolveLines(b);
    expect(rounds).toHaveLength(1);
    expect(rounds[0]!.points).toBe(10);
    expect(rounds[0]!.cells).toHaveLength(9);
    expect(detectLines(balls)).toHaveLength(0);
  });

  it("D7: three lines through one cell — 15 points, 13 cells", () => {
    const b = empty();
    for (let k = 0; k < 5; k++) {
      b[indexOf(k, 2)] = 1; // H row 2, x 0..4; centre (2,2)
      b[indexOf(2, k)] = 1; // V col 2, y 0..4
      b[indexOf(k, k)] = 1; // D-down through (2,2)
    }
    const lines = detectLines(b);
    expect(lines).toHaveLength(3);
    const { rounds } = resolveLines(b);
    expect(rounds[0]!.points).toBe(15);
    expect(rounds[0]!.cells).toHaveLength(13);
  });

  it("D8: bent 4+4 sharing a corner pops nothing", () => {
    const b = empty();
    for (let x = 0; x < 4; x++) b[indexOf(x, 0)] = 1;
    for (let y = 0; y < 4; y++) b[indexOf(3, y)] = 1;
    expect(detectLines(b)).toHaveLength(0);
  });

  it("D9: bent 5+5 sharing a corner is two lines, 10 points, 9 cells", () => {
    const b = empty();
    for (let x = 0; x < 5; x++) b[indexOf(x, 0)] = 1;
    for (let y = 0; y < 5; y++) b[indexOf(4, y)] = 1;
    const lines = detectLines(b);
    expect(lines).toHaveLength(2);
    const { rounds } = resolveLines(b);
    expect(rounds[0]!.points).toBe(10);
    expect(rounds[0]!.cells).toHaveLength(9);
  });

  it("D10: diagonal run near a board corner", () => {
    const b = empty();
    for (let k = 0; k < 5; k++) b[indexOf(k, k)] = 6; // main diagonal from (0,0)
    const lines = detectLines(b);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.axis).toBe(2);
    expect(lines[0]!.length).toBe(5);
  });

  it("D11: a 9-long run is ONE line of 34", () => {
    const b = empty();
    for (let x = 0; x < 9; x++) b[indexOf(x, 5)] = 2;
    const lines = detectLines(b);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.length).toBe(9);
    expect(lines[0]!.points).toBe(34);
  });

  it("D12: adjacent but not collinear detects nothing", () => {
    const b = board(`
      . . . . . . . . .
      . R R . . . . . .
      . R R . . . . . .
      . R . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
      . . . . . . . . .
    `);
    expect(detectLines(b)).toHaveLength(0);
  });

  it("D13: a 5-run interrupted by a ghost cell detects nothing", () => {
    const b = empty();
    for (const x of [0, 1, 3, 4]) b[indexOf(x, 0)] = 1;
    // (2,0) holds only a ghost — detection sees balls only, so passing the
    // balls array with a hole is exactly the semantics.
    expect(detectLines(b)).toHaveLength(0);
  });

  it("D14: canonical detection order (H, V, D-down, D-up; ascending)", () => {
    const b = empty();
    for (let x = 0; x < 5; x++) b[indexOf(x, 8)] = 1; // H bottom row
    for (let y = 0; y < 5; y++) b[indexOf(8, y)] = 2; // V last column
    for (let x = 0; x < 5; x++) b[indexOf(x, 0)] = 3; // H top row
    const lines = detectLines(b);
    expect(lines.map((l) => l.axis)).toEqual([0, 0, 1]);
    // within an axis, ascending traversal: row 0 before row 8
    expect(lines[0]!.cells[0]).toBe(indexOf(0, 0));
    expect(lines[1]!.cells[0]).toBe(indexOf(0, 8));
  });

  it("D15: removal happens only after all lines are collected (regression)", () => {
    // The D6 crossing case loses no line even though removing the first
    // line would break the second's contiguity.
    const b = empty();
    for (let x = 0; x < 5; x++) b[indexOf(x, 2)] = 1;
    for (let y = 0; y < 5; y++) b[indexOf(2, y)] = 1;
    const { rounds } = resolveLines(b);
    expect(rounds[0]!.lines).toHaveLength(2);
  });

  it("resolveLines leaves no line on the board and is pure", () => {
    const b = empty();
    for (let x = 0; x < 5; x++) b[indexOf(x, 0)] = 1;
    const before = b.slice();
    const { balls } = resolveLines(b);
    expect(detectLines(balls)).toHaveLength(0);
    expect(b).toEqual(before);
  });
});
