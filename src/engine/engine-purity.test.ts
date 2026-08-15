import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ENGINE_DIR = join(__dirname);

const sourceFiles = readdirSync(ENGINE_DIR).filter(
  (f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && f !== "testutil.ts",
);

describe("engine purity", () => {
  it("no impure globals in any engine source file", () => {
    for (const file of sourceFiles) {
      const src = readFileSync(join(ENGINE_DIR, file), "utf8");
      expect(
        /\bMath\.random\b|\bDate\.now\b|new Date\(|\bcrypto\./.test(src),
        `${file} uses an impure global`,
      ).toBe(false);
      expect(/\bMath\./.test(src), `${file} uses Math`).toBe(false);
      expect(
        /\b(window|document|localStorage|fetch)\b/.test(src),
        `${file} references a DOM/global API`,
      ).toBe(false);
    }
  });

  it("the transitive import graph stays inside src/engine/", () => {
    for (const file of sourceFiles) {
      const src = readFileSync(join(ENGINE_DIR, file), "utf8");
      const imports = [...src.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]!);
      for (const imp of imports) {
        expect(
          imp.startsWith("./"),
          `${file} imports outside the engine: ${imp}`,
        ).toBe(true);
      }
    }
  });

  it("no react / next / app imports anywhere", () => {
    for (const file of sourceFiles) {
      const src = readFileSync(join(ENGINE_DIR, file), "utf8");
      expect(/from\s+"(react|next|@\/app)/.test(src), file).toBe(false);
    }
  });
});
