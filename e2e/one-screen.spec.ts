import { test, expect } from "@playwright/test";
import { seedScript } from "./fixtures/savedGame";

// The direct assertions of "one screen, no scrolling" from 14-responsive.md.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(seedScript());
  await page.goto("/");
  await page.waitForSelector("[data-cell]");
});

test("no scrolling in either axis", async ({ page }) => {
  const scroll = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    sh: document.documentElement.scrollHeight,
    ch: document.documentElement.clientHeight,
  }));
  expect(scroll.sw).toBeLessThanOrEqual(scroll.cw);
  expect(scroll.sh).toBeLessThanOrEqual(scroll.ch);
});

test("cells 0 and 80 sit fully inside the viewport", async ({
  page,
  viewport,
}) => {
  for (const idx of [0, 80]) {
    const box = await page.locator(`[data-cell="${idx}"]`).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  }
});

test("target pitch clears the WCAG 24px floor and tiles without gaps", async ({
  page,
}) => {
  const a = await page.locator('[data-cell="0"]').boundingBox();
  const b = await page.locator('[data-cell="1"]').boundingBox();
  const pitch = b!.x - a!.x;
  expect(pitch).toBeGreaterThanOrEqual(24);
  // Hit areas tile: the gap between adjacent cells is smaller than what a
  // fingertip can miss — the seam is covered by the two cells' hit rects.
  expect(b!.x - (a!.x + a!.width)).toBeLessThanOrEqual(pitch / 6);
});

test("board is square and capped at 584px content", async ({
  page,
  viewport,
}) => {
  const board = await page.locator(".game-board").boundingBox();
  expect(Math.abs(board!.width - board!.height)).toBeLessThanOrEqual(1);
  if (viewport!.width >= 768 && viewport!.height >= 700) {
    // desktop and tablet sit on the cap: 584 padding box + 2px borders
    expect(Math.round(board!.width)).toBe(586);
  } else {
    expect(board!.width).toBeLessThan(viewport!.width);
  }
});

test("a taller top panel shrinks the board instead of overflowing", async ({
  page,
  viewport,
}) => {
  // Artificially squeeze: the regression a chrome-height constant would cause.
  await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>(".top-panel");
    panel!.style.minHeight = "220px";
  });
  const scroll = await page.evaluate(() => ({
    ok:
      document.documentElement.scrollWidth <=
        document.documentElement.clientWidth &&
      document.documentElement.scrollHeight <=
        document.documentElement.clientHeight,
  }));
  expect(scroll.ok).toBe(true);
  // Container-query units settle one layout pass after the style change.
  await expect
    .poll(async () => {
      const box = await page.locator('[data-cell="80"]').boundingBox();
      return box!.y + box!.height;
    })
    .toBeLessThanOrEqual(viewport!.height);
});

test("the small-screen warning no longer exists", async ({ page }) => {
  await expect(
    page.getByText(/require a screen width of at least 600px/),
  ).toHaveCount(0);
});
