import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsx: "automatic",
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/engine/__fixtures__/**",
        "src/**/*.d.ts",
      ],
      reporter: ["text", "html"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "engine",
          environment: "node",
          include: ["src/engine/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["./src/setupTests.ts"],
          include: [
            "src/**/*.test.tsx",
            "src/features/**/*.test.ts",
            "src/game/**/*.test.ts",
            "src/shared/**/*.test.ts",
          ],
          exclude: ["src/engine/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["**/*.int.test.ts"],
          exclude: ["node_modules/**", "e2e/**"],
        },
      },
    ],
  },
});
