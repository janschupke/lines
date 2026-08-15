import { test, expect } from "@playwright/test";
import {
  seedScript,
  FIXTURE_BALLS,
  FIXTURE_GHOSTS,
} from "./fixtures/savedGame";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(seedScript());
});

test("board renders with the seeded state at every viewport", async ({
  page,
}) => {
  await page.goto("/");
  // 81 cells with data-cell hooks
  await expect(page.locator("[data-cell]")).toHaveCount(81);
  // Seeded balls and ghosts are restored exactly
  for (const [x, y, color] of FIXTURE_BALLS) {
    await expect(page.locator(`[data-cell="${y * 9 + x}"]`)).toHaveAttribute(
      "data-ball",
      color,
    );
  }
  for (const [x, y, color] of FIXTURE_GHOSTS) {
    await expect(page.locator(`[data-cell="${y * 9 + x}"]`)).toHaveAttribute(
      "data-ghost",
      color,
    );
  }
  await expect(page.locator("[data-ball]")).toHaveCount(FIXTURE_BALLS.length);
  await expect(page.locator("[data-ghost]")).toHaveCount(FIXTURE_GHOSTS.length);
});

test("selection marks data-state", async ({ page }) => {
  await page.goto("/");
  const cell = page.locator('[data-cell="10"]'); // (1,1) red ball
  await cell.click();
  await expect(cell).toHaveAttribute("data-state", "selected");
});
