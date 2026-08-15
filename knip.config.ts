import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["e2e/**/*.spec.ts", "scripts/*.ts", "src/engine/index.ts"],
  project: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}", "*.{ts,tsx,js,cjs}"],
  ignore: [
    "**/*.test.{ts,tsx}",
    "src/generated/**",
    "src/shared/names/lists/ldnoobw/index.ts",
    "coverage/**",
    "dist/**",
    ".next/**",
    "node_modules/**",
  ],
  ignoreDependencies: [
    // imported by the generated Prisma client, which knip ignores
    "@prisma/client",
  ],
  vitest: {
    config: "vitest.config.ts",
  },
  playwright: {
    config: "playwright.config.ts",
  },
};

export default config;
