import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/app/main.tsx"],
  project: ["src/**/*.{ts,tsx}", "*.{ts,tsx,js,cjs}"],
  ignore: [
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}",
    "coverage/**",
    "dist/**",
    "node_modules/**",
  ],
  ignoreDependencies: [],
  vite: {
    config: "vite.config.ts",
  },
  vitest: {
    config: "vitest.config.ts",
  },
};

export default config;
