import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LAYERS } from "./tokens";
import { themeCss, tokensCss } from "./tokens.css";

/**
 * The layer order that actually decides paint order: every one of these
 * competes in the ROOT stacking context, because `.board-area` is
 * deliberately left unsealed (see the LAYERS doc comment).
 */
const ROOT_ORDER = [
  "boardDecor",
  "boardCell",
  "boardCellRaised",
  "boardFloating",
  "boardChrome",
  "boardScrim",
  "chrome",
  "dialog",
] as const;

/** Layers scoped to an ancestor's own stacking context, ordered only there. */
const LOCAL_LAYERS = ["chromePopover"] as const;

describe("LAYERS", () => {
  it("places every layer in the root order or marks it local", () => {
    // A new layer must be given a position, not just a number: this is the
    // assertion that stops the scale drifting back into magic values.
    expect(Object.keys(LAYERS).sort()).toEqual(
      [...ROOT_ORDER, ...LOCAL_LAYERS].sort(),
    );
  });

  it("is strictly increasing across the root order", () => {
    const values = ROOT_ORDER.map((name) => LAYERS[name]);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(new Set(values).size).toBe(values.length);
  });

  it("puts the chrome above every board surface and dialogs above chrome", () => {
    const board = ROOT_ORDER.filter((n) => n.startsWith("board")).map(
      (n) => LAYERS[n],
    );
    expect(Math.max(...board)).toBeLessThan(LAYERS.chrome);
    expect(LAYERS.chrome).toBeLessThan(LAYERS.dialog);
  });
});

describe("layer codegen", () => {
  it("emits a custom property for every layer", () => {
    const css = tokensCss();
    expect(css).toContain("--z-board-cell-raised: 2;");
    for (const name of Object.keys(LAYERS)) {
      const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      expect(css).toContain(`--z-${kebab}:`);
    }
  });

  it("emits a named utility for every layer", () => {
    const css = themeCss();
    for (const name of Object.keys(LAYERS)) {
      const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      expect(css).toContain(`@utility z-${kebab} {`);
      expect(css).toContain(`z-index: var(--z-${kebab});`);
    }
  });

  it("never emits a utility name Tailwind's own numeric scale owns", () => {
    // A numerically-named layer utility would shadow one of Tailwind's own.
    // Note the names are never spelled out in this file: the class scanner
    // reads comments, and spelling one is enough to emit the utility.
    expect(themeCss()).not.toMatch(/@utility z-\d/);
  });
});

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
};

describe("no raw z-index escapes the scale", () => {
  // This file is the one legitimate exception: it has to spell the patterns
  // it forbids, so scanning it would always fail.
  const self = relative(process.cwd(), fileURLToPath(import.meta.url));
  const files = [
    ...walk("src").filter((f) => /\.tsx?$/.test(f)),
    ...walk("app").filter(
      (f) => /\.(tsx?|css)$/.test(f) && !f.includes(".generated."),
    ),
  ].filter((f) => f !== self);

  it("scans a plausible number of files", () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it.each(files)("%s", (file) => {
    const source = readFileSync(file, "utf8");
    // A numerically-named Tailwind z utility, or an arbitrary-value one.
    expect(source).not.toMatch(/(?<![\w-])z-(\d|\[)/);
    // A literal z-index in CSS or a style object. `z-index: var(--z-…)` is
    // the only accepted form.
    expect(source).not.toMatch(/z-index:\s*\d/);
    expect(source).not.toMatch(/zIndex:\s*["']?\d/);
  });
});
