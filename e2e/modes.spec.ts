import { test, expect } from "@playwright/test";

// Mode selection, the chip, manual switching and the reconnect flow.
// Only the desktop project needs to run these — the logic is viewport-free.
test.skip(({ viewport }) => viewport!.width !== 1280, "desktop only");

const seenIntro = `localStorage.setItem("lines:seenModeIntro:v1", "1");`;

test("mode-default-good: fast /start -> Ranked, connection looks good", async ({
  page,
}) => {
  await page.addInitScript(seenIntro);
  await page.goto("/");
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "ranked",
    { timeout: 10_000 },
  );
  await expect(page.locator('[data-testid="mode-reason"]')).toHaveText(
    "your connection looks good",
  );
});

test("mode-default-slow: unreachable /start -> Casual, playable with zero further requests", async ({
  page,
}) => {
  await page.addInitScript(seenIntro);
  await page.route("**/api/games/start", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "casual",
    { timeout: 10_000 },
  );
  await expect(page.locator('[data-testid="mode-reason"]')).toHaveText(
    "couldn't reach the server",
  );
  // the game is fully playable offline
  let requests = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/")) requests++;
  });
  const ball = page.locator("[data-ball]").first();
  const cell = await ball.getAttribute("data-cell");
  await ball.click();
  await expect(page.locator(`[data-cell="${cell}"]`)).toHaveAttribute(
    "data-state",
    "selected",
  );
  expect(requests).toBe(0);
});

test("mode-default-offline: navigator offline -> Casual, you're offline", async ({
  page,
}) => {
  await page.addInitScript(seenIntro);
  await page.addInitScript(
    `Object.defineProperty(Navigator.prototype, "onLine", { get: () => false });`,
  );
  await page.goto("/");
  await expect(page.locator('[data-testid="mode-reason"]')).toHaveText(
    "you're offline",
    { timeout: 10_000 },
  );
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "casual",
  );
});

test("mode-sticky: a casual preference survives reload as 'your choice'", async ({
  page,
}) => {
  await page.addInitScript(seenIntro);
  await page.addInitScript(
    `localStorage.setItem("lines:modePref:v1", "casual");`,
  );
  await page.goto("/");
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "casual",
  );
  await expect(page.locator('[data-testid="mode-reason"]')).toHaveText(
    "your choice",
  );
  await page.reload();
  await expect(page.locator('[data-testid="mode-reason"]')).toHaveText(
    "your choice",
  );
});

test("mode-intro: shown once, dismissed forever", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-testid="mode-intro"]')).toBeVisible({
    timeout: 10_000,
  });
  await page.getByText("Got it").click();
  await expect(page.locator('[data-testid="mode-intro"]')).toHaveCount(0);
  await page.reload();
  await page.waitForSelector('[data-testid="mode-chip"]');
  await expect(page.locator('[data-testid="mode-intro"]')).toHaveCount(0);
});

test("mode-manual-switch: gate names the score; Escape keeps Ranked; confirm switches", async ({
  page,
}) => {
  await page.addInitScript(seenIntro);
  await page.goto("/");
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "ranked",
    { timeout: 10_000 },
  );
  // play one turn so the switch is confirm-gated
  const ball = page.locator("[data-ball]").first();
  const from = await ball.getAttribute("data-cell");
  await ball.click();
  const empty = page
    .locator("[data-cell]:not([data-ball]):not([data-ghost])")
    .first();
  await empty.click();
  await expect(page.locator("[data-ghost]")).toHaveCount(3, {
    timeout: 10_000,
  });
  expect(from).not.toBeNull();

  await page.locator('[data-testid="mode-switch"]').click();
  await expect(page.locator('[data-testid="confirm-gate"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-testid="confirm-gate"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "ranked",
  );

  await page.locator('[data-testid="mode-switch"]').click();
  let laterRequests = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/")) laterRequests++;
  });
  await page.locator('[data-testid="gate-switch"]').click();
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "casual",
  );
  await expect(page.locator('[data-testid="mode-reason"]')).toHaveText(
    "your choice",
  );
  // play continues with no further requests
  const ball2 = page.locator("[data-ball]").first();
  await ball2.click();
  const empty2 = page
    .locator("[data-cell]:not([data-ball]):not([data-ghost])")
    .first();
  await empty2.click();
  await expect(page.locator("[data-ghost]")).toHaveCount(3, {
    timeout: 10_000,
  });
  expect(laterRequests).toBe(0);
});

test("mode-casual-to-ranked-blocked mid-game, with the reason visible", async ({
  page,
}) => {
  await page.addInitScript(seenIntro);
  await page.addInitScript(
    `localStorage.setItem("lines:modePref:v1", "casual");`,
  );
  await page.goto("/");
  await page.waitForSelector("[data-ball]");
  // one move makes it mid-game
  const ball = page.locator("[data-ball]").first();
  await ball.click();
  await page
    .locator("[data-cell]:not([data-ball]):not([data-ghost])")
    .first()
    .click();
  await expect(page.locator("[data-ghost]")).toHaveCount(3, {
    timeout: 10_000,
  });
  const switchButton = page.locator('[data-testid="mode-switch"]');
  await expect(switchButton).toHaveAttribute("aria-disabled", "true");
  await expect(switchButton).toHaveAttribute(
    "title",
    "Ranked games have to start from the beginning.",
  );
});

test("mid-game-drop and recovery: reconnect panel, frozen input, then completion", async ({
  page,
}) => {
  await page.addInitScript(seenIntro);
  await page.goto("/");
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "ranked",
    { timeout: 10_000 },
  );
  await page.route("**/api/games/*/move", (route) => route.abort());
  const ball = page.locator("[data-ball]").first();
  await ball.click();
  await page
    .locator("[data-cell]:not([data-ball]):not([data-ghost])")
    .first()
    .click();
  await expect(page.locator('[data-testid="reconnect-panel"]')).toBeVisible({
    timeout: 10_000,
  });
  // recovery: unroute and wait for the retry to succeed
  await page.unroute("**/api/games/*/move");
  await expect(page.locator('[data-testid="reconnect-panel"]')).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(page.locator('[data-testid="mode-chip"]')).toHaveAttribute(
    "data-mode",
    "ranked",
  );
  await expect(page.locator("[data-ghost]")).toHaveCount(3, {
    timeout: 10_000,
  });
});
