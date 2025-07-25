/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "bg-game-bg-primary",
    "bg-game-bg-secondary",
    "bg-game-bg-tertiary",
    "bg-game-bg-board",
    "bg-game-bg-cell-empty",
    "bg-game-bg-cell-hover",
    "bg-game-bg-cell-active",
    "bg-game-bg-cell-path",
    "text-game-text-primary",
    "text-game-text-secondary",
    "text-game-text-accent",
    "text-game-text-success",
    "text-game-text-error",
    "border-game-border-default",
    "border-game-border-path",
    "border-game-border-error",
    "border-game-border-accent",
    "border-game-border-ball",
    "border-game-border-preview",
    "bg-ball-red",
    "bg-ball-green",
    "bg-ball-blue",
    "bg-ball-yellow",
    "bg-ball-purple",
    "bg-ball-cyan",
    "bg-ball-black",
    "text-black",
    "bg-game-button-primary",
    "bg-game-button-hover",
    "bg-game-button-accent",
    "bg-game-button-accent-hover",
    "border-game-button-accent",
    "border-game-button-hover",
    "shadow-[0_0_16px_4px_theme(colors.game.shadow.glow),0_0_0_4px_theme(colors.game.shadow.glow)]",
    "shadow-[0_1px_4px_theme(colors.game.shadow.ball)]",
    "z-game-dialog",
    "animate-move-ball",
    "animate-pop-ball",
    "animate-bounce-ball",
    "animate-pulse-glow",
    // Mobile responsive classes
    "w-12",
    "h-12",
    "w-9",
    "h-9",
    "w-4",
    "h-4",
    "text-lg",
    "text-xl",
    "text-xs",
    "text-sm",
    "px-2",
    "px-3",
    "py-2",
    "py-3",
    "py-4",
    "gap-1",
    "gap-2",
    "space-y-4",
    "space-x-3",
    "max-w-full",
    "px-4",
    "py-4",
    "min-h-[44px]",
    "min-w-[44px]",
    "touch-manipulation",
    "active:bg-game-button-hover",
    "active:bg-game-button-accent-hover",
    "focus:ring-2",
    "focus:ring-game-border-accent",
    "shadow-lg",
    "z-50",
    "w-[18px]",
    "h-[18px]",
    "w-[28px]",
    "h-[28px]",
    // Design token utilities
    "w-cell",
    "h-cell",
    "w-ball",
    "h-ball",
    "gap-gap",
    "p-board-padding",
    "min-h-touch-target",
    "min-w-touch-target",
    "duration-game",
  ],
  theme: {
    extend: {
      colors: {
        // Game ball colors - enhanced with better contrast
        ball: {
          red: "#ef4444", // More vibrant red
          green: "#10b981", // More vibrant green
          blue: "#3b82f6", // More vibrant blue
          yellow: "#f59e0b", // More vibrant yellow
          purple: "#8b5cf6", // More vibrant purple
          cyan: "#06b6d4", // More vibrant cyan
          black: "#1f2937", // Darker, more sophisticated black
        },
        // Game theme colors - enhanced with gradients and better contrast
        game: {
          bg: {
            primary: "#0f172a", // Darker, more sophisticated background
            secondary: "#1e293b", // Enhanced card backgrounds
            tertiary: "#334155", // Enhanced tertiary backgrounds
            board: "#f8fafc", // Subtle off-white for board
            cell: {
              empty: "#ffffff",
              hover: "#f1f5f9", // Subtle hover state
              active: "#fef3c7", // Warm active state
              path: "#dbeafe", // Subtle blue path
            },
          },
          text: {
            primary: "#f8fafc", // Brighter white text
            secondary: "#cbd5e1", // Enhanced light grey text
            accent: "#fbbf24", // Warmer gold accent
            success: "#34d399", // Enhanced green success
            error: "#f87171", // Enhanced red error
          },
          border: {
            default: "#475569", // Enhanced dark grey borders
            path: "#3b82f6", // Enhanced blue path borders
            error: "#f87171", // Enhanced red error borders
            accent: "#fbbf24", // Enhanced gold accent borders
            ball: "#64748b", // Enhanced ball borders
            preview: "#94a3b8", // Enhanced preview borders
          },
          button: {
            primary: "#475569", // Enhanced dark grey buttons
            hover: "#64748b", // Enhanced lighter grey on hover
            accent: "#fbbf24", // Enhanced gold accent buttons
            "accent-hover": "#f59e0b", // Enhanced darker gold on hover
          },
          shadow: {
            glow: "#fbbf24", // Enhanced glow color
            ball: "#00000040", // Enhanced ball shadow
          },
          // New gradient definitions
          gradient: {
            primary: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            secondary: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            board: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            button: "linear-gradient(135deg, #475569 0%, #64748b 100%)",
            buttonHover: "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
            accent: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            accentHover: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          },
        },
      },
      spacing: {
        ball: "40px", // BALL_SIZE
        cell: "56px", // CELL_SIZE
        gap: "8px", // GAP - increased from 4px
        "board-padding": "8px", // PADDING
        "touch-target": "44px", // Touch target size
      },
      transitionDuration: {
        game: "300ms",
      },
      zIndex: {
        "game-dialog": "1000",
      },
      animation: {
        "move-ball": "moveBall 0.4s cubic-bezier(0.4, 0.2, 0.2, 1)", // Slowed from 0.25s to 0.4s
        "pop-ball": "popBall 0.3s cubic-bezier(0.4, 0.2, 0.2, 1)",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "bounce-ball": "bounceBall 1s ease-in-out infinite",
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
        pulseGlow: {
          "0%, 100%": { 
            boxShadow: "0 0 16px 4px theme(colors.game.shadow.glow), 0 0 0 4px theme(colors.game.shadow.glow)",
            opacity: "1"
          },
          "50%": { 
            boxShadow: "0 0 24px 6px theme(colors.game.shadow.glow), 0 0 0 6px theme(colors.game.shadow.glow)",
            opacity: "0.8"
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        bounceBall: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backgroundImage: {
        "game-gradient-primary": "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        "game-gradient-secondary": "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        "game-gradient-board": "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        "game-gradient-button": "linear-gradient(135deg, #475569 0%, #64748b 100%)",
        "game-gradient-button-hover": "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
        "game-gradient-accent": "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        "game-gradient-accent-hover": "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      },
    },
  },
  plugins: [
    function ({ addBase, theme }) {
      addBase({
        ":root": {
          "--cell-size": theme("spacing.cell"),
          "--gap-size": theme("spacing.gap"),
          "--ball-size": theme("spacing.ball"),
          "--board-padding": theme("spacing.board-padding"),
          "--touch-target-size": theme("spacing.touch-target"),
          "--game-animation-duration": theme("transitionDuration.game"),
        },
        "@media (max-width: 768px)": {
          ":root": {
            "--cell-size": "48px",
            "--gap-size": "4px",
            "--ball-size": "36px",
            "--board-padding": "8px",
          },
        },
        "@media (min-width: 769px) and (max-width: 1024px)": {
          ":root": {
            "--cell-size": "64px",
            "--gap-size": "6px",
            "--ball-size": "48px",
            "--board-padding": "12px",
          },
        },
      });
    },
  ],
};
