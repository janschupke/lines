import { test, expect } from "@playwright/test";

// The full journey: play a ranked game to game over, submit, see the row on
// the leaderboard, watch the replay. Desktop only; the logic is
// viewport-free and the game takes ~30 turns.
test.skip(({ viewport }) => viewport!.width !== 1280, "desktop only");
test.setTimeout(180_000);

const seenIntro = `localStorage.setItem("lines:seenModeIntro:v1", "1");`;

test("game-over-submit, leaderboard row, replay", async ({ page }) => {
  await page.addInitScript(seenIntro);
  await page.goto("/");
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "ranked",
    { timeout: 10_000 },
  );

  // Drive the game to completion: repeatedly play a ball to an adjacent
  // empty cell (adjacency guarantees reachability).
  for (let turn = 0; turn < 120; turn++) {
    const dialogOpen = await page
      .locator(
        '[data-testid="submission-form"], [data-testid="submission-not-qualified"], [data-testid="submission-checking"]',
      )
      .count();
    if (dialogOpen > 0) break;
    const pair = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll("[data-cell]"));
      const at = (i: number) =>
        cells.find((c) => c.getAttribute("data-cell") === String(i));
      for (const cell of cells) {
        if (!cell.hasAttribute("data-ball")) continue;
        const i = Number(cell.getAttribute("data-cell"));
        const x = i % 9;
        const neighbours = [
          x > 0 ? i - 1 : -1,
          x < 8 ? i + 1 : -1,
          i - 9,
          i + 9,
        ];
        for (const n of neighbours) {
          if (n < 0 || n > 80) continue;
          const target = at(n);
          if (target && !target.hasAttribute("data-ball")) {
            return { from: i, to: n };
          }
        }
      }
      return null;
    });
    if (!pair) break;
    await page.locator(`[data-cell="${pair.from}"]`).click();
    await page.locator(`[data-cell="${pair.to}"]`).click();
    // wait for the turn to settle (spawn applied or dialog opened)
    await page.waitForTimeout(150);
  }

  // Game over: the board is empty of moves; the dialog offers the form
  // (empty leaderboard -> any score qualifies).
  await expect(page.locator('[data-testid="submission-form"]')).toBeVisible({
    timeout: 30_000,
  });
  await page.locator("#score-name").fill("Playwright");
  await page.locator('[data-testid="submit-score"]').click();
  await expect(page.locator('[data-testid="submission-accepted"]')).toBeVisible(
    { timeout: 10_000 },
  );

  // Leaderboard shows the row; the page source carries no private fields.
  await page.getByText("See the board").click();
  await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("Playwright").first()).toBeVisible();
  const source = await page.content();
  expect(source).not.toContain("playerId");
  expect(source.replace(/keyVersion/g, "")).not.toMatch(/entropy/i);

  // Replay: scrub to the end; the final score matches the row's score.
  const rowScore = await page
    .locator('[data-testid="leaderboard"] tbody tr td:nth-child(3)')
    .first()
    .textContent();
  await page.getByText("Replay", { exact: true }).first().click();
  await expect(page.locator('[data-testid="replay-board"]')).toBeVisible({
    timeout: 10_000,
  });
  const scrubber = page.locator('[data-testid="replay-scrubber"]');
  await scrubber.evaluate((el: HTMLInputElement) => {
    el.value = el.max;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator('[data-testid="replay-score"]')).toHaveText(
    rowScore!.trim(),
  );
});
