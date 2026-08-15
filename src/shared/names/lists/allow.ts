/**
 * False-positive allowlist, checked first and short-circuiting. Grow it
 * from real rejections — every rejected_name outcome is logged (as an
 * outcome code only, never the string).
 */
export const ALLOW: readonly string[] = [
  "scunthorpe",
  "penistone",
  "lightwater",
  "assassin",
  "assess",
  "assume",
  "class",
  "bass",
  "pass",
  "cockburn",
  "hancock",
  "analysis",
  "analyst",
  "shiitake",
  "kanto",
  "matsushita",
  "dickens",
  "cummings",
  "titan",
];
