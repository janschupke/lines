import {
  BALL_COLORS,
  BOARD_FRAME_MAX_PX,
  BOARD_MAX_PX,
  BREAKPOINTS,
  COLORS,
  DURATIONS,
  GRADIENTS,
  RATIOS,
} from "./tokens";

const kebab = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Pure function: tokens -> CSS text for app/tokens.generated.css. */
export function tokensCss(): string {
  const lines: string[] = [
    "/* GENERATED, do not edit. Run `npm run tokens`. Source: src/design/tokens.ts */",
    ":root {",
  ];

  for (const [name, ms] of Object.entries(DURATIONS)) {
    lines.push(`  --duration-${kebab(name)}: ${ms}ms;`);
  }
  for (const [name, hex] of Object.entries(BALL_COLORS)) {
    lines.push(`  --ball-${name}: ${hex};`);
  }

  const flat = (obj: Record<string, unknown>, prefix: string) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        lines.push(`  ${prefix}-${kebab(key)}: ${value};`);
      } else {
        flat(value as Record<string, unknown>, `${prefix}-${kebab(key)}`);
      }
    }
  };
  flat(COLORS, "  --color".trim());

  for (const [name, value] of Object.entries(GRADIENTS)) {
    lines.push(`  --gradient-${kebab(name)}: ${value};`);
  }

  lines.push(`  --board-max: ${BOARD_MAX_PX}px;`);
  lines.push(`  --board-frame-max: ${BOARD_FRAME_MAX_PX}px;`);
  lines.push(`  --panel-max: ${BOARD_FRAME_MAX_PX}px;`);
  const pct = (r: number) => `${(r * 100).toFixed(5)}%`;
  lines.push(
    `  --board-padding-pct: ${pct(RATIOS.boardPadding)}; /* 8 / 586 */`,
  );
  lines.push(`  --grid-gap-pct: ${pct(RATIOS.gap)}; /* 8 / 568 */`);
  lines.push(`  --ball-pct: ${pct(RATIOS.ball)}; /* 40 / 56 */`);
  lines.push(`  --ghost-pct: ${pct(RATIOS.incomingBall)}; /* 28 / 56 */`);
  lines.push(`  --breakpoint-sheet: ${BREAKPOINTS.sheet}px;`);
  lines.push(
    `  --breakpoint-landscape-max-h: ${BREAKPOINTS.landscapeMaxHeight}px;`,
  );
  lines.push("}");
  return lines.join("\n") + "\n";
}
