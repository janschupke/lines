module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
        // UI theme colors
        game: {
          // Background colors
          bg: {
            primary: '#1e1e2e',      // Main app background
            secondary: '#23272f',     // Card/dialog backgrounds
            tertiary: '#2a2e38',      // High score backgrounds
            board: '#bbb',            // Game board background
            cell: {
              empty: '#eee',
              hover: '#bbb',
              active: '#ffe082',
              path: '#b3d1ff',
            },
          },
          // Text colors
          text: {
            primary: '#fff',
            secondary: '#ccc',
            accent: '#ffe082',
            success: '#8bc34a',
            error: '#e74c3c',
          },
          // Border colors
          border: {
            default: '#888',
            path: '#1976d2',
            error: '#e74c3c',
            accent: '#ffe082',
            ball: '#555',
            preview: '#666',
          },
          // Button colors
          button: {
            primary: '#444',
            hover: '#555',
            accent: '#ffe082',
            'accent-hover': '#ffb300',
          },
          // Shadow colors
          shadow: {
            glow: '#ffe082',
            ball: '#0003',
          },
        },
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
  plugins: [],
}; 
