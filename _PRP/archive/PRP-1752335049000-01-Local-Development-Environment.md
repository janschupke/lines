# PRP-1752335049000-01: Local Development Environment Setup

## Feature Overview

### Feature Name
Local Development Environment with Docker Compose and Hot Reload

### Brief Description
Set up a complete local development environment using Docker Compose that includes a local Supabase database instance and the React application with hot reload functionality, enabling developers to work efficiently with database integration features.

### User Value
Developers can develop and test database features locally without affecting production data, with immediate feedback through hot reload functionality and a containerized environment that mirrors production behavior.

## Functional Requirements

### Docker Compose Configuration
- [ ] Create `docker-compose.yml` with Supabase PostgreSQL service
- [ ] Configure React app service with hot reload
- [ ] Set up volume mounts for development files
- [ ] Implement health checks for database service
- [ ] Configure environment variables for local development
- [ ] Set up networking between services

### Local Database Setup
- [ ] Create PostgreSQL container with Supabase image
- [ ] Configure database initialization scripts
- [ ] Set up database schema creation
- [ ] Implement database health monitoring
- [ ] Configure database connection pooling
- [ ] Set up database backup and restore procedures

### Hot Reload Configuration
- [ ] Configure Vite dev server for containerized environment
- [ ] Set up file watching and change detection
- [ ] Implement volume mounting for source code
- [ ] Configure port forwarding for development server
- [ ] Set up environment variable injection
- [ ] Implement development-specific configurations

### Environment Variable Management
- [ ] Create `.env.development` file
- [ ] Configure local Supabase connection settings
- [ ] Set up development-specific environment variables
- [ ] Implement environment validation
- [ ] Create environment variable documentation
- [ ] Set up secure handling of local credentials

## Non-Functional Requirements

### Performance Requirements
- [ ] Development server startup time < 30 seconds
- [ ] Hot reload response time < 2 seconds
- [ ] Database connection establishment < 5 seconds
- [ ] Container resource usage optimized for development
- [ ] Memory usage < 2GB for complete environment

### Reliability Requirements
- [ ] 99% uptime for local development environment
- [ ] Automatic recovery from container failures
- [ ] Graceful handling of database connection issues
- [ ] Robust error handling and logging
- [ ] Data persistence across container restarts

### Usability Requirements
- [ ] Single command to start development environment
- [ ] Clear documentation for setup and usage
- [ ] Intuitive error messages and troubleshooting
- [ ] Consistent behavior across different operating systems
- [ ] Easy cleanup and reset procedures

## Technical Implementation

### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  supabase:
    image: supabase/postgres:15.1.0.117
    container_name: lines-game-db
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: lines_game
      POSTGRES_USER: postgres
    ports:
      - "5432:5432"
    volumes:
      - supabase_data:/var/lib/postgresql/data
      - ./src/database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d lines_game"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - lines-network

  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: lines-game-app
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - VITE_SUPABASE_URL=postgresql://postgres:postgres@supabase:5432/lines_game
      - VITE_SUPABASE_ANON_KEY=local-dev-key
      - VITE_ENVIRONMENT=development
    depends_on:
      supabase:
        condition: service_healthy
    command: npm run dev -- --host 0.0.0.0
    networks:
      - lines-network

volumes:
  supabase_data:
    driver: local

networks:
  lines-network:
    driver: bridge
```

### Development Dockerfile
```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose development port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### Environment Configuration
```bash
# .env.development
VITE_SUPABASE_URL=postgresql://postgres:postgres@localhost:5432/lines_game
VITE_SUPABASE_ANON_KEY=local-dev-key
VITE_ENVIRONMENT=development
VITE_APP_ENV=development
```

### Database Initialization Script
```sql
-- src/database/init/01_init_database.sql
-- Initialize database for local development
-- Note: The database 'lines_game' is created automatically by Docker
-- using the POSTGRES_DB environment variable in docker-compose.yml

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema_migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create high_scores table
CREATE TABLE IF NOT EXISTS high_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    game_duration INTEGER,
    balls_cleared INTEGER,
    turns_count INTEGER NOT NULL,
    individual_balls_popped INTEGER NOT NULL,
    lines_popped INTEGER NOT NULL,
    longest_line_popped INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_achieved_at ON high_scores(achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_turns ON high_scores(turns_count DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_lines ON high_scores(lines_popped DESC);

-- Enable Row Level Security
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

-- Create access policies
CREATE POLICY IF NOT EXISTS "Allow read access" ON high_scores
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert access" ON high_scores
    FOR INSERT WITH CHECK (true);

-- Insert initial migration record
INSERT INTO schema_migrations (version, name) VALUES (1, 'Create high_scores table')
ON CONFLICT (version) DO NOTHING;
```

## Testing Requirements

### Unit Tests
- [ ] Test Docker Compose configuration
- [ ] Test database initialization scripts
- [ ] Test environment variable loading
- [ ] Test hot reload functionality
- [ ] Test database connection establishment
- [ ] Test container health checks

### Integration Tests
- [ ] Test complete development environment startup
- [ ] Test database schema creation
- [ ] Test application hot reload
- [ ] Test database connectivity from application
- [ ] Test environment variable injection
- [ ] Test container networking

### Performance Tests
- [ ] Test development server startup time
- [ ] Test hot reload response time
- [ ] Test database connection performance
- [ ] Test container resource usage
- [ ] Test memory consumption

## Accessibility Considerations

### Development Environment Accessibility
- [ ] Ensure development server logs are accessible
- [ ] Provide clear error messages for setup issues
- [ ] Create accessible documentation for setup process
- [ ] Implement keyboard navigation for development tools
- [ ] Ensure color contrast in development interfaces

## Risk Assessment

### Technical Risks
- **Risk**: Docker container performance issues
  - **Impact**: Medium
  - **Mitigation**: Optimized Docker configuration and resource limits
  - **Probability**: Low

- **Risk**: Port conflicts with existing services
  - **Impact**: Low
  - **Mitigation**: Configurable ports and conflict detection
  - **Probability**: Medium

- **Risk**: Database initialization failures
  - **Impact**: High
  - **Mitigation**: Comprehensive error handling and retry logic
  - **Probability**: Low

### User Experience Risks
- **Risk**: Complex setup process for new developers
  - **Impact**: Medium
  - **Mitigation**: Clear documentation and automated setup scripts
  - **Probability**: Medium

## Success Metrics

### Development Metrics
- [ ] Development environment starts in < 30 seconds
- [ ] Hot reload responds in < 2 seconds
- [ ] Database connection established in < 5 seconds
- [ ] Zero setup errors for new developers
- [ ] 100% test coverage for Docker configuration

### User Experience Metrics
- [ ] Single command to start development environment
- [ ] Clear error messages for all failure scenarios
- [ ] Comprehensive documentation available
- [ ] Consistent behavior across different operating systems

## Implementation Steps

### Step 1: Create Docker Configuration
1. Create `docker-compose.yml` with Supabase and app services
2. Create `Dockerfile.dev` for development environment
3. Configure volume mounts and networking
4. Set up health checks and dependencies

### Step 2: Database Initialization
1. Create database initialization scripts
2. Set up schema creation and migration tracking
3. Configure database indexes and policies
4. Implement database health monitoring

### Step 3: Environment Configuration
1. Create `.env.development` file
2. Configure environment variable loading
3. Set up development-specific configurations
4. Implement environment validation

### Step 4: Hot Reload Setup
1. Configure Vite for containerized environment
2. Set up file watching and change detection
3. Implement volume mounting for source code
4. Configure port forwarding and networking

### Step 5: Testing and Validation
1. Test complete development environment
2. Validate hot reload functionality
3. Test database connectivity
4. Verify environment variable injection
5. Run comprehensive test suite

## Documentation Requirements

### Setup Documentation
- [ ] Step-by-step setup guide
- [ ] Troubleshooting guide
- [ ] Environment variable documentation
- [ ] Docker configuration explanation
- [ ] Development workflow guide

### Maintenance Documentation
- [ ] Container management procedures
- [ ] Database backup and restore procedures
- [ ] Environment cleanup procedures
- [ ] Performance optimization guide

## Post-Implementation

### Monitoring
- [ ] Monitor container resource usage
- [ ] Track development environment performance
- [ ] Monitor database connection health
- [ ] Track hot reload performance

### Maintenance
- [ ] Regular Docker image updates
- [ ] Database schema maintenance
- [ ] Environment variable updates
- [ ] Performance optimization

## Dependencies

### External Dependencies
- Docker and Docker Compose
- Node.js 18+ runtime
- PostgreSQL 15.1.0.117 (Supabase image)

### Internal Dependencies
- Existing React application structure
- Vite build configuration
- TypeScript configuration
- Existing test framework

## Acceptance Criteria

### Functional Acceptance
- [ ] Development environment starts with single command
- [ ] Hot reload works for all file types
- [ ] Database is accessible from application
- [ ] Environment variables are properly injected
- [ ] All tests pass in containerized environment

### Non-Functional Acceptance
- [ ] Development server starts in < 30 seconds
- [ ] Hot reload responds in < 2 seconds
- [ ] Database connection established in < 5 seconds
- [ ] Memory usage < 2GB for complete environment
- [ ] Zero setup errors for new developers

### Quality Acceptance
- [ ] 100% test coverage for Docker configuration
- [ ] All linting rules pass
- [ ] TypeScript compilation successful
- [ ] Build process works in containerized environment 
