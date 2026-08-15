import { defineConfig, devices } from "@playwright/test";

// Full viewport matrix from 14-responsive.md. Every project runs chromium;
// what varies is the viewport (and touch on the phone profiles).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Visual baselines are darwin-rendered; CI (linux) runs the behavioural
  // specs and skips screenshot comparison until linux baselines exist.
  ignoreSnapshots: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    // Determinism comes from the real reduced-motion path, not a test flag.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "phone",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "phone-small",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 320, height: 568 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "phone-short",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 320, height: 480 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "phone-landscape",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 844, height: 390 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
