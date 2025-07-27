# Lines

A turn-based puzzle game where you form lines of colored balls on a 9x9 grid while preventing the board from filling up. Every time you move a ball, new balls are spawned onto the board. When a line of 5 or more balls is formed, it is removed and you score points according to the line length using a Fibonacci-based scoring system.

Play the game at [https://lines.schupke.io/](https://lines.schupke.io/).

## 🎮 Game Features

### Core Gameplay

- **9x9 grid puzzle game** with strategic ball placement
- **Line formation**: Create lines of 5+ balls to clear them and score points
- **Fibonacci scoring**: 5 balls = 5 points, 6 balls = 8 points, 7 balls = 13 points, etc.
- **Ball spawning**: 3 new balls spawn after each move
- **7 ball colors**: Red, blue, green, yellow, purple, pink, and black

### User Experience

- **Smart pathfinding**: Visual highlighting of reachable cells
- **Preview system**: See incoming balls' positions and colors before they spawn
- **Smooth animations**: Ball movement, popping, growing, and floating score effects
- **Game state persistence**: Remembers current game state when closed
- **High score tracking**: Local storage-based high score system
- **Guide**: In-game help system accessible via 'G' key

### Controls

- **Mouse/Touch**: Click/tap to select and move balls
- **Keyboard shortcuts**:
  - `G`: Toggle game guide
  - `N`: Start new game
  - `Escape`: Close dialogs/guide

## 🛠️ Development

### Getting Started

1. **Install dependencies:**

```bash
npm install
```

2. **Run the development server:**

```bash
npm run dev
```

3. **Build for production:**

```bash
npm run build
```

4. **Run tests:**

```bash
npm run test:run
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test:run` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint with auto-fix
- `npm run types` - Type checking
- `npm run check:all` - Run all quality checks

## 🏗️ Architecture

### Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom theme system
- **Vitest** + React Testing Library for testing
- **ESLint** + Prettier for code quality

### Project Structure

```
src/
├── components/
│   ├── game/          # Game-specific components
│   └── ui/            # Reusable UI components
├── game/
│   ├── logic/         # Core game logic
│   ├── state/         # State management
│   └── types/         # TypeScript type definitions
├── hooks/             # Custom React hooks
└── utils/             # Utility functions
```

## 🚀 Deployment

### Vercel Hosting

- **Automatic deployments** from master branch

### Quality Assurance

- **Pre-deployment checks**: Tests, linting, type checking
- **Code quality**: ESLint + Prettier enforcement
- **Unused exports detection**: Automated cleanup

## 🎯 Game Rules

1. **Objective**: Prevent the board from filling up while scoring points
2. **Movement**: Click a ball, then click a valid destination cell
3. **Line Formation**: Create horizontal, vertical, or diagonal lines of 5+ balls
4. **Scoring**: Longer lines score more points (Fibonacci sequence)
5. **Ball Spawning**: 3 new balls spawn after each move
6. **Game Over**: Board fills up completely

## 📊 Statistics

The game tracks statistics including:

- Total turns played
- Game duration
- Lines popped
- Longest line achieved
- High score progression
