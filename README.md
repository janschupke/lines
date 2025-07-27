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

## 🤝 Contributing

There are several ways you can help improve the game:

### Reporting Issues

If you find a bug or have a feature request, please [file an issue on GitHub](https://github.com/janschupke/lines/issues). When reporting issues, please include:

- A clear description of the problem
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser/device information (if relevant)

### Making Changes

If you'd like to contribute code changes:

1. **Fork the repository** on GitHub
2. **Create a feature branch** from `master`
3. **Make your changes** with clear, well-documented code
4. **Add tests** for any new functionality
5. **Run the test suite** to ensure everything works
6. **Submit a pull request** to the `master` branch

### Development Guidelines

- Follow the existing code style and conventions
- Add appropriate tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting
- Run `npm run check:all` to run all code checks

## 📄 License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

### GPL-3.0 License Terms

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see [https://www.gnu.org/licenses/](https://www.gnu.org/licenses/).

### What This Means

- **Freedom to use**: You can run the game for any purpose
- **Freedom to study**: You can examine the source code
- **Freedom to modify**: You can change the code to suit your needs
- **Freedom to distribute**: You can share the original or modified versions
- **Copyleft**: If you distribute modified versions, you must also license them under GPL-3.0
