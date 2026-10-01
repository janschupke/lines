import { describe, it, expect, afterEach, vi } from "vitest";
import { rankedEnabled } from "./config";
import { POST as start } from "../../app/api/games/start/route";
import { GET as scores } from "../../app/api/scores/route";
import { GET as replay } from "../../app/api/replays/[id]/route";

// Needs no database: with ranked off, every route must answer before it
// touches Prisma or the IP salt.

const FULL = {
  DATABASE_URL: "postgresql://x:y@127.0.0.1:1/none",
  GAME_TOKEN_SECRET: "s".repeat(32),
  ENTROPY_SECRET_V1: "e".repeat(32),
  IP_HASH_SALT: "salt",
};

const stubAll = (over: Partial<Record<keyof typeof FULL, string>> = {}) => {
  for (const [name, value] of Object.entries({ ...FULL, ...over })) {
    vi.stubEnv(name, value);
  }
};

afterEach(() => vi.unstubAllEnvs());

describe("rankedEnabled", () => {
  it("is on only with the database and all three secrets", () => {
    stubAll();
    expect(rankedEnabled()).toBe(true);
  });

  it.each(Object.keys(FULL))("is off when %s is empty or blank", (name) => {
    stubAll({ [name]: "" });
    expect(rankedEnabled()).toBe(false);
    stubAll({ [name]: "   " });
    expect(rankedEnabled()).toBe(false);
  });
});

describe("ranked routes without a database", () => {
  const expectDisabled = async (res: Response) => {
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("ranked_disabled");
  };

  it("start, scores and replays refuse with 503 ranked_disabled", async () => {
    stubAll({ DATABASE_URL: "", IP_HASH_SALT: "" });
    await expectDisabled(
      await start(
        new Request("http://t/api/games/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            playerId: "00000000-0000-4000-8000-000000000042",
          }),
        }),
      ),
    );
    await expectDisabled(await scores());
    await expectDisabled(
      await replay(new Request("http://t/api/replays/x"), {
        params: Promise.resolve({ id: "x" }),
      }),
    );
  });
});
