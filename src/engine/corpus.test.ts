import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { replay, decodeMoves, keyFromHex, boardHash } from "./index";
import type { SpawnPacket, GameStats } from "./types";

interface Fixture {
  name: string;
  key: string;
  moves: string;
  packets: SpawnPacket[];
  expect: {
    score: number;
    rngDraws: number;
    boardHash: string;
    stats: GameStats;
    over: boolean;
    moveCount: number;
  };
}

const dir = join(__dirname, "__fixtures__", "replays");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

describe("golden replay corpus", () => {
  it("has a meaningful corpus", () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  for (const file of files) {
    it(`replays ${file} to its pinned outputs`, () => {
      const fixture = JSON.parse(
        readFileSync(join(dir, file), "utf8"),
      ) as Fixture;
      const moves = decodeMoves(fixture.moves);
      expect(moves).not.toBeNull();
      const result = replay(keyFromHex(fixture.key), moves!);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.state.score).toBe(fixture.expect.score);
      expect(result.rngDraws).toBe(fixture.expect.rngDraws);
      expect(boardHash(result.state)).toBe(fixture.expect.boardHash);
      expect(result.state.stats).toEqual(fixture.expect.stats);
      expect(result.state.over).toBe(fixture.expect.over);
      expect(result.state.moveCount).toBe(fixture.expect.moveCount);
      // the corpus doubles as the keyed=scripted regression set
      expect(result.packets).toEqual(fixture.packets);
    });
  }
});
