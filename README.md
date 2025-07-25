# Lines

A turn-based puzzle game where you form lines of colored balls on a two-dimensional grid while preventing the board from filling up. Every time you move a ball, new balls are spawned onto the board. When a line is formed, it is removed and you score points according to the line length.

React app is up at [https://lines.schupke.io/](https://lines.schupke.io/).

## Features

- Highlighting of reachable cells within the board
- Incoming balls' positions and colors hint
- Remembers current game state when closed
- Extensive Game Guide available through the game menu
- Simple high score system with localStorage persistence
- Mobile-optimized: touch controls, responsive design, and mobile accessibility
- > 80% automated test coverage, all tests and builds must pass for every deployment
- ...and more!

---

# Local Development Environment

## Getting Started

1. **Install dependencies:**

```bash
npm install
```

2. **Run the development server:**

```bash
npm run dev
```

That's it! The app will use localStorage for high scores and work immediately.

3. **Build for production:**

```bash
npm run build
```

4. **Run tests:**

```bash
npm run test:run
```

## High Score System

The game uses a simple localStorage-based high score system:

- High scores are stored locally in the browser
- Only the highest score is tracked (as a single number)
- High scores persist between browser sessions
- No external dependencies or database required

## ESLint Configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules.

# Production Deployment

## Vercel Hosting

Production is deployed via [Vercel](https://vercel.com/). The `vercel.json` configures static builds, routes, and environment variable mapping. Automatic deployments are triggered from the main branch. Custom domain and SSL are managed via the Vercel dashboard.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS (with theme classes, no hardcoded colors)
- Vercel (hosting)
- Vitest + React Testing Library (with >80% coverage required)
