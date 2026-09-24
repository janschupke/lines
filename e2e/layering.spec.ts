import { test, expect, type Page } from "@playwright/test";

// Paint order. jsdom has no layout, so this is the only tier that can see a
// z-index regression at all — and it runs on every viewport, because the
// responsive blocks change which ancestors create a stacking context.

const seenIntro = `localStorage.setItem("lines:seenModeIntro:v1", "1");`;

/**
 * Every point where `selector` overlaps a board cell, hit-tested. Returns the
 * winning element's classes so a failure names what painted on top.
 */
const overlapHits = (page: Page, selector: string) =>
  page.evaluate((selector) => {
    const surface = document.querySelector(selector);
    if (!surface) throw new Error(`no element for ${selector}`);
    const sb = surface.getBoundingClientRect();
    const hits: { cell: string | null; winner: string; covered: boolean }[] =
      [];
    for (const cell of document.querySelectorAll(".game-cell")) {
      const cb = cell.getBoundingClientRect();
      const x0 = Math.max(sb.left, cb.left);
      const x1 = Math.min(sb.right, cb.right);
      const y0 = Math.max(sb.top, cb.top);
      const y1 = Math.min(sb.bottom, cb.bottom);
      if (x1 - x0 < 2 || y1 - y0 < 2) continue;
      const won = document.elementFromPoint((x0 + x1) / 2, (y0 + y1) / 2);
      hits.push({
        cell: cell.getAttribute("data-cell"),
        winner: won ? won.className.toString() : "null",
        covered: surface.contains(won),
      });
    }
    return hits;
  }, selector);

test("layer-popover: the mode popover paints over the board", async ({
  page,
}) => {
  await page.addInitScript(seenIntro);
  await page.goto("/");
  await page.waitForSelector('[data-testid="mode-chip"]');
  await page.click('[aria-label="About game modes"]');

  const popover = page.locator(
    '[role="dialog"][aria-label="About game modes"]',
  );
  await expect(popover).toBeVisible();

  // The popover opens upward over the board. Wherever it overlaps a cell, it
  // must win the hit test: the cells carry a z-index of their own, and the
  // popover is anchored inside a transformed ancestor, so this is exactly the
  // pairing that used to lose.
  const hits = await overlapHits(
    page,
    '[role="dialog"][aria-label="About game modes"]',
  );
  expect(hits.filter((h) => !h.covered)).toEqual([]);
});

test("layer-dialog: the guide paints over the board", async ({ page }) => {
  await page.addInitScript(seenIntro);
  await page.goto("/");
  await page.waitForSelector('[data-testid="mode-chip"]');
  await page.keyboard.press("g");

  const guide = page.locator('[role="dialog"][aria-label="Game guide"]');
  await expect(guide).toBeVisible();
  const hits = await overlapHits(
    page,
    '[role="dialog"][aria-label="Game guide"]',
  );
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.filter((h) => !h.covered)).toEqual([]);
});

test("layer-sheet: below the sheet breakpoint the guide covers the chrome", async ({
  page,
  viewport,
}) => {
  test.skip(viewport!.width >= 600, "sheet breakpoint only");
  await page.addInitScript(seenIntro);
  await page.goto("/");
  await page.waitForSelector('[data-testid="mode-chip"]');
  await page.keyboard.press("g");
  await expect(
    page.locator('[role="dialog"][aria-label="Game guide"]'),
  ).toBeVisible();

  // `position: fixed` really does reach the viewport here — which is why
  // .board-area must never be given a z-index or `isolation`.
  const sheet = await page.evaluate(() => {
    const guide = document.querySelector(
      '[role="dialog"][aria-label="Game guide"]',
    )!;
    const box = guide.getBoundingClientRect();
    const covers = (selector: string) => {
      const r = document.querySelector(selector)!.getBoundingClientRect();
      const at = document.elementFromPoint(
        (r.left + r.right) / 2,
        (r.top + r.bottom) / 2,
      );
      return guide.contains(at);
    };
    return {
      fillsViewport:
        Math.round(box.width) === window.innerWidth &&
        Math.round(box.height) === window.innerHeight,
      coversTopPanel: covers(".top-panel"),
      coversFooter: covers(".page-footer"),
    };
  });
  expect(sheet).toEqual({
    fillsViewport: true,
    coversTopPanel: true,
    coversFooter: true,
  });
});

test("layer-cell: a popping cell outranks its neighbours", async ({ page }) => {
  await page.addInitScript(seenIntro);
  await page.goto("/");
  await page.waitForSelector('[data-testid="mode-chip"]');

  // The pop state is transient and server-driven, so the rule is asserted
  // against the cascade rather than by racing a real pop.
  //
  // toHaveCSS, not a bare getComputedStyle: the computed value does not
  // settle in the task that sets the attribute, so a direct read reports the
  // idle layer and fails against a stylesheet that is perfectly correct.
  // The expected values come from the scale itself, never hardcoded here.
  const layer = (name: string) =>
    page.evaluate(
      (n) =>
        getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
      name,
    );
  const idle = await layer("--z-board-cell");
  const raised = await layer("--z-board-cell-raised");
  expect(Number(raised)).toBeGreaterThan(Number(idle));

  const cell = page.locator(".game-cell").first();
  await expect(cell).toHaveCSS("z-index", idle);
  await cell.evaluate((el) => el.setAttribute("data-state", "popping"));
  await expect(cell).toHaveCSS("z-index", raised);
});
