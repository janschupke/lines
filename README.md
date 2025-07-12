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
* Mobile-optimized: touch controls, responsive design, and mobile accessibility
* ...and more!

---

# Local Development Environment

## Database with Docker Compose

This project uses Docker Compose **only for the database** (Supabase/Postgres). The React app is run directly on your host machine.

**Why?**
- Vite 5+ and Node.js 18+ in containers have a known incompatibility with the `crypto.hash` API, causing the dev server to fail in Docker. Running the app on the host avoids this issue and provides a smoother developer experience.

## Getting Started

1. **Start the database with Docker Compose:**

```bash
docker-compose up -d
```

2. **Install dependencies:**

```bash
npm install
```

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

Create a `.env.development` file in the project root:

```
VITE_SUPABASE_URL=postgresql://postgres:postgres@localhost:5432/lines_game
VITE_SUPABASE_ANON_KEY=local-dev-key
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
- Supabase (Postgres)
- Vercel (hosting)
- Vitest + React Testing Library
