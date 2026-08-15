import { test, expect } from "@playwright/test";
import { seedScript } from "./fixtures/savedGame";

// Expected board for the fixed key (computed by the engine itself):
const BALLS: [number, string][] = [
  [39, "yellow"],
  [58, "purple"],
  [72, "yellow"],
  [73, "blue"],
  [79, "blue"],
];
const GHOSTS: [number, string][] = [
  [7, "red"],
  [26, "blue"],
  [34, "blue"],
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(seedScript());
});

test("board renders the deterministic new game at every viewport", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-cell]")).toHaveCount(81);
  for (const [cell, color] of BALLS) {
    await expect(page.locator(`[data-cell="${cell}"]`)).toHaveAttribute(
      "data-ball",
      color,
    );
  }
  for (const [cell, color] of GHOSTS) {
    await expect(page.locator(`[data-cell="${cell}"]`)).toHaveAttribute(
      "data-ghost",
      color,
    );
  }
  await expect(page.locator("[data-ball]")).toHaveCount(BALLS.length);
  await expect(page.locator("[data-ghost]")).toHaveCount(GHOSTS.length);
});

test("selection marks data-state; a move lands the ball", async ({ page }) => {
  await page.goto("/");
  const from = page.locator('[data-cell="39"]'); // yellow ball
  await from.click();
  await expect(from).toHaveAttribute("data-state", "selected");
  // move it one cell left (38 is empty and reachable)
  await page.locator('[data-cell="38"]').click();
  await expect(page.locator('[data-cell="38"]')).toHaveAttribute(
    "data-ball",
    "yellow",
    { timeout: 5000 },
  );
  await expect(from).not.toHaveAttribute("data-ball", "yellow");
  // no pop on this move: the three ghosts materialised and three new ones spawned
  await expect(page.locator("[data-ball]")).toHaveCount(8);
  await expect(page.locator("[data-ghost]")).toHaveCount(3);
});
