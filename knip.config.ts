import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["e2e/**/*.spec.ts"],
  project: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}", "*.{ts,tsx,js,cjs}"],
  ignore: [
    "**/*.test.{ts,tsx}",
    "coverage/**",
    "dist/**",
    ".next/**",
    "node_modules/**",
  ],
  ignoreDependencies: [],
  vitest: {
    config: "vitest.config.ts",
  },
  playwright: {
    config: "playwright.config.ts",
  },
};

export default config;
