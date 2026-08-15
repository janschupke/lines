import { test, expect } from "@playwright/test";
import { seedScript } from "./fixtures/savedGame";

// Visual baseline across the full viewport matrix.
// `animations: 'disabled'` freezes the 8s gradientShift at its first frame,
// deterministically. Sub-600px baselines capture the warning screen — the
// correct baseline until Phase 2 removes the gate.
test("baseline @ every viewport", async ({ page }) => {
  await page.addInitScript(seedScript());
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("baseline.png", {
    animations: "disabled",
    fullPage: false,
  });
});
