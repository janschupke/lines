# Lines

A turn-based puzzle game where you form lines of colored balls on a two-dimensional grid while preventing the board from filling up. Every time you move a ball, new balls are spawned onto the board. When a line is formed, it is removed and you score points according to the line length.

React app is up at [https://lines.schupke.io/](https://lines.schupke.io/).

## Features

* Customizable board size
* Highlighting of reachable cells within the board
* Incoming balls' positions and colors hint
* Optional turn time limit
* Remembers current game state when closed
* Extensive Game Guide available through the game menu
* High score table with session-based tracking
* ...and more!

---

# React + TypeScript + Vite

This project uses React, TypeScript, and Vite for a modern, fast development experience. ESLint is set up for code quality.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## ESLint Configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules.
