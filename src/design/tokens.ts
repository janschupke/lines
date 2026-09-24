/**
 * THE source of truth for every design value.
 *
 * Direction is TS -> CSS, never the reverse: `scripts/build-tokens.ts`
 * generates `app/tokens.generated.css` (plain vars) and
 * `app/theme.generated.css` (the Tailwind 4 @theme block + gradient
 * utilities) from this file. The effect player and node tests read these
 * numbers at runtime, which is why TS is the source.
 */

/** Animation durations in milliseconds. */
export const DURATIONS = {
  popBall: 300,
  growBall: 600, // was TS 100 / CSS 600 — CSS wins, it is what the eye sees
  moveBall: 400, // per-hop CSS animation duration; was TS(MOVING_STEP) 100 / CSS 400 — CSS wins
  movingStep: 100, // per-cell step cadence; distinct from moveBall, not a duplicate
  floatingScore: 1000, // was TS 2000 / keyframe 1000 — keyframe wins; 2000 left it invisible for 1s
  scoreFlash: 1000,
  highScoreFlash: 1000,
  fade: 300,
  buttonHover: 300,
  buttonShine: 500,
  gradientShift: 8000,
  selectedBallPulse: 1500,
} as const;

/** The seven on-screen ball colours. */
export const BALL_COLORS = {
  red: "#ef4444",
  green: "#10b981",
  blue: "#3b82f6",
  yellow: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#f472b6",
  black: "#1f2937",
} as const;

/** UI colours (bg / text / border / shadow). */
export const COLORS = {
  bg: {
    primary: "#0f172a",
    secondary: "#1e293b",
    tertiary: "#334155",
    board: "#f8fafc",
    cell: {
      empty: "#ffffff",
      hover: "#f1f5f9",
      active: "#fef3c7",
      path: "#dbeafe",
      unreachable: "#ffffff",
    },
  },
  text: {
    primary: "#f8fafc",
    secondary: "#cbd5e1",
    accent: "#fbbf24",
    success: "#34d399",
    error: "#f87171",
  },
  border: {
    default: "#475569",
    path: "#3b82f6",
    error: "#f87171",
    accent: "#fbbf24",
    ball: "#64748b",
    preview: "#94a3b8",
    // What Tailwind preflight's default border colour resolved to while
    // `border-game-border` was a dead class — kept, it is what the eye sees.
    muted: "#e5e7eb",
  },
  shadow: {
    ball: "#00000040",
  },
  accent: {
    500: "#f59e0b",
    600: "#d97706",
  },
} as const;

/** The seven gradients, defined once. */
export const GRADIENTS = {
  primary: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  secondary: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
  board: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
  button: "linear-gradient(135deg, #475569 0%, #64748b 100%)",
  buttonHover: "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
  accent: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
  accentHover: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
} as const;

/**
 * The board is proportional; only its desktop cap is a pixel value.
 * 584 = 2*8 padding + 9*56 cells + 8*8 gaps (the board's padding box;
 * its border adds 1px each side). See 14-responsive.md.
 *
 * Pre-refactor deviation, recorded: the old markup capped the panel at a
 * magic 600px, which was narrower than the board needs (620px incl. the
 * frame's padding and borders), so the rendered board was squeezed to
 * 566x586 with ~5.5px horizontal gaps. The intrinsic layout renders the
 * design-intended square board; desktop/tablet baselines were re-captured
 * once for this fix.
 */
export const BOARD_MAX_PX = 584;

/**
 * The board frame (`.game-panel p-4`, 1px border) around the board
 * (1px border): 584 + 2 + 32 + 2.
 */
export const BOARD_FRAME_MAX_PX = BOARD_MAX_PX + 36;

// The top panel and footer track BOARD_FRAME_MAX_PX (--panel-max) instead
// of the old magic 600px.

/**
 * Every inner size is a ratio, so the board scales intrinsically.
 * Denominators are exact: padding 8/584 = 1/73, gap 8/568 = 1/71,
 * ball 40/56 = 5/7, ghost 28/56 = 1/2.
 */
export const RATIOS = {
  // The board's containing block is the frame content: 586 = board outer
  // incl. its 1px borders.
  boardPadding: 8 / 586,
  gap: 8 / 568, // fraction of grid content width
  ball: 40 / 56, // fraction of cell
  incomingBall: 28 / 56, // fraction of cell
} as const;

export const BREAKPOINTS = {
  /** Dialogs render as bottom sheets below this width. No longer gates rendering. */
  sheet: 600,
  /** Below this height in landscape, the page reflows to a row layout. */
  landscapeMaxHeight: 500,
} as const;

/**
 * There is deliberately no custom font: everything renders in Tailwind
 * Preflight's default stack. Recorded here so it is a decision, not an
 * accident.
 */
export const FONTS = {
  sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
} as const;

/**
 * THE layering scale. One flat order, because there is exactly one stacking
 * context that matters: the root.
 *
 * `.board-area` is deliberately NOT sealed. `container-type: size` on it
 * computes to `contain: none` and creates neither a stacking context nor a
 * containing block, so the board's own values live in the root context
 * alongside the page chrome — and sealing it (isolation, or any z-index at
 * all, which a flex item turns into a stacking context) would trap the
 * `position: fixed` dialog sheet below the sheet breakpoint inside the board.
 *
 * That is also the bug this scale fixes: `.game-cell` sat at z-index 1 in the
 * root context while the mode popover was trapped at level 0 by the
 * `transform` on `.page-footer .panel-center`, so the board cells painted
 * over the popover. The chrome is now a declared layer above the board.
 *
 * Nothing in this app may write a z-index that does not come from here.
 */
export const LAYERS = {
  // The board's own surfaces, in the root stacking context.
  boardDecor: 0,
  boardCell: 1,
  /** A popping ball scales past its cell; the CELL lifts so it clears its neighbours. */
  boardCellRaised: 2,
  boardFloating: 3,
  boardChrome: 4,
  boardScrim: 5,
  /** The top panel and the footer, above the whole board. */
  chrome: 20,
  /** Modal surfaces, above the chrome — board-sized on desktop, a full-screen sheet below the sheet breakpoint. */
  dialog: 30,
  /** Local to the footer's own context: the mode popover over the chip. */
  chromePopover: 1,
} as const;
