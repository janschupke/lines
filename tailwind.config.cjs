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
  ],
  theme: {
    extend: {
      colors: {
        // Game ball colors
        ball: {
          red: '#e74c3c',
          green: '#27ae60',
          blue: '#2980b9',
          yellow: '#f1c40f',
          purple: '#8e44ad',
          cyan: '#1abc9c',
          black: '#222',
        },
        // Game theme colors - structured for proper Tailwind access
        game: {
          bg: {
            primary: '#f5f5f5',      // Light grey background
            secondary: '#ffffff',     // White card backgrounds
            tertiary: '#f8f9fa',     // Light grey backgrounds
            board: '#ffffff',         // White game board background
            cell: {
              empty: '#ffffff',
              hover: '#f8f9fa',
              active: '#fff3cd',
              path: '#d1ecf1',
            },
          },
          text: {
            primary: '#212529',
            secondary: '#6c757d',
            accent: '#495057',
            success: '#28a745',
            error: '#dc3545',
          },
          border: {
            default: '#dee2e6',
            path: '#007bff',
            error: '#dc3545',
            accent: '#ffc107',
            ball: '#6c757d',
            preview: '#adb5bd',
          },
          button: {
            primary: '#6c757d',
            hover: '#5a6268',
            accent: '#ffc107',
            'accent-hover': '#e0a800',
          },
          shadow: {
            glow: '#ffc107',
            ball: '#00000033',
          },
        },
      },
      spacing: {
        'ball': '40px', // BALL_SIZE
        'cell': '56px', // CELL_SIZE
        'gap': '4px',   // GAP
        'board-padding': '8px', // PADDING
      },
      zIndex: {
        'game-dialog': '1000',
      },
      animation: {
        'move-ball': 'moveBall 0.25s cubic-bezier(0.4, 0.2, 0.2, 1)',
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
