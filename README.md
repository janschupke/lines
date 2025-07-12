# Lines

A turn-based puzzle game where you form lines of colored balls on a two-dimensional grid while preventing the board from filling up. Every time you move a ball, new balls are spawned onto the board. When a line is formed, it is removed and you score points according to the line length.

React app is up at [https://lines.schupke.io/](https://lines.schupke.io/).

## Features

* Highlighting of reachable cells within the board
* Incoming balls' positions and colors hint
* Remembers current game state when closed
* Extensive Game Guide available through the game menu
* High score table with persistent, cross-device storage (Supabase)
* Seamless migration of high scores from localStorage to Supabase
* Real-time high score synchronization and connection status monitoring
* Offline support with local caching and automatic recovery
* Mobile-optimized: touch controls, responsive design, and mobile accessibility
* >80% automated test coverage, all tests and builds must pass for every deployment
* ...and more!

---

# Local Development Environment

## Development Modes

This project supports two development modes:

### **Local Development (Default)**
- Uses localStorage for high scores
- No database required
- Faster startup and development
- High scores persist in browser only

### **Database Development (Optional)**
- Uses Docker Compose for PostgreSQL database
- Full Supabase functionality
- Cross-device high score sharing
- Requires proper Supabase configuration

## Database with Docker Compose (Optional)

If you want to use the full database functionality locally, this project uses Docker Compose **only for the database** (Supabase/Postgres). The React app is run directly on your host machine.

**Why?**
- Vite 5+ and Node.js 18+ in containers have a known incompatibility with the `crypto.hash` API, causing the dev server to fail in Docker. Running the app on the host avoids this issue and provides a smoother developer experience.

## Getting Started

### **Quick Start (Local Development)**

1. **Install dependencies:**

```bash
npm install
```

2. **Run the development server:**

```bash
npm run dev
```

That's it! The app will use localStorage for high scores and work immediately.

### **Full Database Setup (Optional)**

If you want to use the full database functionality:

1. **Start the database with Docker Compose:**

```bash
docker-compose up -d
```

2. **Configure environment variables** (see Environment Variables section below)

3. **Run the development server:**

```bash
npm run dev
```

4. **Build for production:**

```bash
npm run build
```

5. **Run tests:**

```bash
npm run test:run
```

## Environment Variables

### **Local Development (Default)**
No environment variables needed! The app will automatically use localStorage for high scores.

### **Database Development (Optional)**
Create a `.env.development` file in the project root:

```
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_ENVIRONMENT=development
VITE_APP_ENV=development
```

## Troubleshooting

### Docker Compose Orphan Container Warning

If you see a warning like this:

```
WARN[0000] Found orphan containers ([lines-game-app]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up.
```

Run:

```bash
docker-compose up -d --remove-orphans
```

This will remove any containers that are no longer defined in your `docker-compose.yml` (such as the old app container).

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

# Production Deployment

## Vercel Hosting

Production is deployed via [Vercel](https://vercel.com/). The `vercel.json` configures static builds, routes, and environment variable mapping. Automatic deployments are triggered from the main branch. Custom domain and SSL are managed via the Vercel dashboard.

## Supabase Production Database

A dedicated Supabase project is used for production. The schema is managed via automated migrations. Row Level Security (RLS) and production indexes are enforced. Backups and monitoring are configured in the Supabase dashboard.

## Environment Variables

Production environment variables are set in the Vercel dashboard:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_ENVIRONMENT=production
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

## Automated Database Migrations

Schema migrations are run automatically on deployment using the migration system in `src/database/services/`. Migrations are versioned, support up/down, and are validated post-deploy. See the migration system documentation for details.

## Health Checks & Validation

Production deployments include health checks for database connectivity, schema, and application endpoints. Automated tests and build verification are required for every deployment.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS (with theme classes, no hardcoded colors)
- Supabase (Postgres, real-time sync, persistent high scores, migration from localStorage)
- Vercel (hosting)
- Vitest + React Testing Library (with >80% coverage required)
