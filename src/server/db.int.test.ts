import "dotenv/config";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { Client } from "pg";
import { prisma } from "./db";

const hasDb = !!process.env["DATABASE_URL"];

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const IP_HASH = "0".repeat(64);

describe.skipIf(!hasDb)("database foundation", () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "Score", "GameSession", "SubmissionAttempt" RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("round-trips the three models", async () => {
    await prisma.score.create({
      data: {
        gameId: uuid(1),
        playerId: uuid(2),
        name: "Tester",
        score: 42,
        durationMs: 60_000,
        moveCount: 30,
        linesPopped: 5,
        longestLine: 5,
        ballsCleared: 25,
        keyVersion: 1,
        moves: "AAB",
        engineVersion: 1,
        boardHash: "deadbeef",
        ipHash: IP_HASH,
      },
    });
    await prisma.gameSession.create({
      data: {
        gameId: uuid(3),
        playerId: uuid(2),
        keyVersion: 1,
        balls: Buffer.alloc(81),
        ghosts: Buffer.alloc(81),
        boardHash: "deadbeef",
        stats: { turns: 0 },
        engineVersion: 1,
        ipHash: IP_HASH,
      },
    });
    await prisma.submissionAttempt.create({
      data: { playerId: uuid(2), ipHash: IP_HASH, outcome: "accepted" },
    });
    expect(await prisma.score.count()).toBe(1);
    expect(await prisma.gameSession.count()).toBe(1);
    expect(await prisma.submissionAttempt.count()).toBe(1);
    // Score.gameId is unique => idempotent submits
    await expect(
      prisma.score.create({
        data: {
          gameId: uuid(1),
          playerId: uuid(2),
          name: "Dup",
          score: 1,
          durationMs: 1,
          moveCount: 1,
          linesPopped: 0,
          longestLine: 0,
          ballsCleared: 0,
          keyVersion: 1,
          moves: "",
          engineVersion: 1,
          boardHash: "deadbeef",
          ipHash: IP_HASH,
        },
      }),
    ).rejects.toThrow();
  });

  it("RLS: the anon role cannot read any table", async () => {
    const client = new Client({
      connectionString: process.env["DATABASE_URL"],
    });
    await client.connect();
    try {
      await client.query("SET ROLE anon");
      for (const table of ["Score", "SubmissionAttempt", "GameSession"]) {
        await expect(
          client.query(`SELECT * FROM "${table}" LIMIT 1`),
        ).rejects.toThrow(/permission denied/);
      }
    } finally {
      await client.end();
    }
  });

  it("TTL sweep removes a 25-hour-old session and leaves a fresh one", async () => {
    const old = new Date(Date.now() - 25 * 3600 * 1000);
    await prisma.gameSession.create({
      data: {
        gameId: uuid(10),
        playerId: uuid(2),
        keyVersion: 1,
        balls: Buffer.alloc(81),
        ghosts: Buffer.alloc(81),
        boardHash: "00000000",
        stats: {},
        engineVersion: 1,
        ipHash: IP_HASH,
        createdAt: old,
      },
    });
    await prisma.gameSession.create({
      data: {
        gameId: uuid(11),
        playerId: uuid(2),
        keyVersion: 1,
        balls: Buffer.alloc(81),
        ghosts: Buffer.alloc(81),
        boardHash: "00000000",
        stats: {},
        engineVersion: 1,
        ipHash: IP_HASH,
      },
    });
    await prisma.$executeRawUnsafe(
      `DELETE FROM "GameSession" WHERE "createdAt" < now() - interval '24 hours'`,
    );
    const remaining = await prisma.gameSession.findMany();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.gameId).toBe(uuid(11));
  });
});
