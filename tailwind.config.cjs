/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-game-bg-primary',
    'bg-game-bg-secondary',
    'bg-game-bg-tertiary',
    'bg-game-bg-board',
    'bg-game-bg-cell-empty',
    'bg-game-bg-cell-hover',
    'bg-game-bg-cell-active',
    'bg-game-bg-cell-path',
    'text-game-text-primary',
    'text-game-text-secondary',
    'text-game-text-accent',
    'text-game-text-success',
    'text-game-text-error',
    'border-game-border-default',
    'border-game-border-path',
    'border-game-border-error',
    'border-game-border-accent',
    'border-game-border-ball',
    'border-game-border-preview',
    'bg-ball-red',
    'bg-ball-green',
    'bg-ball-blue',
    'bg-ball-yellow',
    'bg-ball-purple',
    'bg-ball-cyan',
    'bg-ball-black',
    'text-black',
    'bg-game-button-primary',
    'bg-game-button-hover',
    'bg-game-button-accent',
    'bg-game-button-accent-hover',
    'border-game-button-accent',
    'border-game-button-hover',
    'shadow-[0_0_16px_4px_theme(colors.game.shadow.glow),0_0_0_4px_theme(colors.game.shadow.glow)]',
    'shadow-[0_1px_4px_theme(colors.game.shadow.ball)]',
    'z-game-dialog',
    'animate-move-ball',
    'animate-pop-ball',
  ],
  theme: {
    extend: {
      colors: {
        // Game ball colors
        ball: {
          red: '#e74c3c',
          green: '#2ecc71',      // More vibrant green
          blue: '#2980b9',
          yellow: '#f1c40f',
          purple: '#8e44ad',
          cyan: '#00bcd4',       // More distinct teal/cyan
          black: '#222',
        },
        // Game theme colors - structured for proper Tailwind access
        game: {
          bg: {
            primary: '#1a1a1a',      // Dark grey background
            secondary: '#2d2d2d',     // Dark card backgrounds
            tertiary: '#3a3a3a',      // Dark grey backgrounds
            board: '#ffffff',          // Keep game board white
            cell: {
              empty: '#ffffff',
              hover: '#f8f9fa',
              active: '#fff3cd',
              path: '#d1ecf1',
            },
          },
          text: {
            primary: '#ffffff',        // White text on dark backgrounds
            secondary: '#cccccc',      // Light grey text
            accent: '#ffd700',         // Gold accent text
            success: '#4ade80',        // Green success text
            error: '#f87171',          // Red error text
          },
          border: {
            default: '#404040',        // Dark grey borders
            path: '#3b82f6',           // Blue path borders
            error: '#f87171',          // Red error borders
            accent: '#ffd700',         // Gold accent borders
            ball: '#6c757d',
            preview: '#adb5bd',
          },
          button: {
            primary: '#404040',        // Dark grey buttons
            hover: '#525252',          // Lighter grey on hover
            accent: '#ffd700',         // Gold accent buttons
            'accent-hover': '#fbbf24', // Darker gold on hover
          },
          shadow: {
            glow: '#ffd700',
            ball: '#00000033',
          },
        },
      },
      spacing: {
        'ball': '40px', // BALL_SIZE
        'cell': '56px', // CELL_SIZE
        'gap': '8px',   // GAP - increased from 4px
        'board-padding': '8px', // PADDING
      },
      // CSS custom properties for JavaScript access
      extend: {
        // ... existing code ...
      },
      zIndex: {
        'game-dialog': '1000',
      },
      animation: {
        'move-ball': 'moveBall 0.4s cubic-bezier(0.4, 0.2, 0.2, 1)', // Slowed from 0.25s to 0.4s
        'pop-ball': 'popBall 0.3s cubic-bezier(0.4, 0.2, 0.2, 1)',
      },
      keyframes: {
        moveBall: {
          '0%': { transform: 'scale(1.2)', opacity: '0.7' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        popBall: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '80%': { transform: 'scale(1.3)', opacity: '1' },
          '100%': { transform: 'scale(0.5)', opacity: '0' },
        },
      },
    },
  },
}; 
