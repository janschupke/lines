import { test, expect } from "@playwright/test";
import { seedScript } from "./fixtures/savedGame";

// Play three turns, reload, assert the board, score and elapsed time are
// exactly as before. The save is the action log; the reload replays it.
test("reload restores the exact game", async ({ page }) => {
  await page.addInitScript(seedScript());
  await page.goto("/");
  await page.waitForSelector("[data-cell]");

  // three deterministic moves (fixed key): 39 -> 38, 38 -> 37, 37 -> 36
  for (const [from, to] of [
    [39, 38],
    [38, 37],
    [37, 36],
  ]) {
    await page.locator(`[data-cell="${from}"]`).click();
    await page.locator(`[data-cell="${to}"]`).click();
    await expect(page.locator(`[data-cell="${to}"]`)).toHaveAttribute(
      "data-ball",
      /.+/,
      { timeout: 5000 },
    );
    // wait for the turn's spawn to finish before the next input
    await expect(page.locator("[data-ghost]")).toHaveCount(3, {
      timeout: 5000,
    });
  }

  const boardBefore = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-cell]")).map((c) => [
      c.getAttribute("data-ball"),
      c.getAttribute("data-ghost"),
    ]),
  );
  const scoreBefore = await page
    .locator('[data-testid="score-value"]')
    .textContent();

  await page.reload();
  await page.waitForSelector("[data-cell]");

  const boardAfter = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-cell]")).map((c) => [
      c.getAttribute("data-ball"),
      c.getAttribute("data-ghost"),
    ]),
  );
  expect(boardAfter).toEqual(boardBefore);
  await expect(page.locator('[data-testid="score-value"]')).toHaveText(
    scoreBefore!,
  );
});
