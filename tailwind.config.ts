import type { Config } from "tailwindcss";
import {
  BALL_COLORS,
  COLORS,
  DURATIONS,
  FONTS,
  GRADIENTS,
  Z,
} from "./src/design/tokens";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Only truly dynamic classes that can't be detected by Tailwind
    "bg-game-bg-primary",
    "bg-game-bg-secondary",
    "bg-game-bg-tertiary",
    "bg-game-bg-board",
    "bg-game-bg-cell-empty",
    "bg-game-bg-cell-hover",
    "bg-game-bg-cell-path",
    "text-game-text-primary",
    "text-game-text-secondary",
    "text-game-text-accent",
    "text-game-text-success",
    "text-game-text-error",
    "border-game-border-default",
    "border-game-border-path",
    "border-game-border-error",
    "border-game-border-ball",
    "border-game-border-preview",
    "animate-move-ball",
    "animate-pop-ball",
    "animate-bounce-ball",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Preflight's default stack, pinned as an explicit decision.
        sans: FONTS.sans.split(",").map((f) => f.trim()),
      },
      colors: {
        game: {
          bg: COLORS.bg,
          text: COLORS.text,
          border: COLORS.border,
          shadow: COLORS.shadow,
          accent: COLORS.accent,
          ball: BALL_COLORS,
        },
      },
      zIndex: {
        "game-dialog": `${Z.dialog}`,
      },
      animation: {
        "move-ball": `moveBall ${DURATIONS.moveBall}ms cubic-bezier(0.4, 0.2, 0.2, 1)`,
        "pop-ball": `popBall ${DURATIONS.popBall}ms cubic-bezier(0.4, 0.2, 0.2, 1)`,
        "bounce-ball": `pulseBall ${DURATIONS.selectedBallPulse}ms ease-in-out infinite`,
        "float-score": `floatScore ${DURATIONS.floatingScore}ms ease-out forwards`,
      },
      keyframes: {
        moveBall: {
          "0%": { transform: "scale(1.2)", opacity: "0.7" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        popBall: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "80%": { transform: "scale(1.3)", opacity: "1" },
          "100%": { transform: "scale(0.5)", opacity: "0" },
        },
        pulseBall: {
          "0%, 100%": {
            transform: "scale(0.9)",
            opacity: "1",
          },
          "50%": {
            transform: "scale(1.1)",
            opacity: "0.8",
          },
        },
        floatScore: {
          "0%": {
            transform: "translate(-50%, -50%) scale(0.8)",
            opacity: "0",
          },
          "20%": {
            transform: "translate(-50%, -50%) scale(1.2)",
            opacity: "1",
          },
          "100%": {
            transform: "translate(-50%, -80px) scale(1)",
            opacity: "0",
          },
        },
      },
      backgroundImage: {
        "game-gradient-primary": GRADIENTS.primary,
        "game-gradient-secondary": GRADIENTS.secondary,
        "game-gradient-board": GRADIENTS.board,
        "game-gradient-button": GRADIENTS.button,
        "game-gradient-button-hover": GRADIENTS.buttonHover,
        "game-gradient-accent": GRADIENTS.accent,
        "game-gradient-accent-hover": GRADIENTS.accentHover,
      },
    },
  },
  plugins: [],
};

export default config;
