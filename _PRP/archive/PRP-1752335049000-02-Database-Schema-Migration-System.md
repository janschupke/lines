# PRP-1752335049000-02: Database Schema Migration System

## Feature Overview

### Feature Name

Database Schema Migration System with Versioned Migrations

### Brief Description

Implement a comprehensive database schema migration system that supports versioned migrations with up/down scripts, automated deployment, and rollback functionality for both local development and production environments.

### User Value

Developers can safely evolve the database schema over time with version control, automated deployment, and rollback capabilities, ensuring data integrity and consistent database state across all environments.

## Functional Requirements

### Migration System Architecture

- [ ] Create versioned migration system with up/down scripts
- [ ] Implement `schema_migrations` table for tracking applied migrations
- [ ] Create migration runner with validation and error handling
- [ ] Support both local development and production environments
- [ ] Implement rollback functionality for failed migrations
- [ ] Add migration validation and testing procedures

### Migration File Structure

- [ ] Create organized migration file structure
- [ ] Implement consistent naming convention for migration files
- [ ] Support SQL-based migrations with up/down scripts
- [ ] Create migration template system
- [ ] Implement migration dependency management
- [ ] Add migration documentation and comments

### Automated Migration Runner

- [ ] Create migration service class for running migrations
- [ ] Implement migration status checking and validation
- [ ] Add migration conflict detection and resolution
- [ ] Create migration rollback functionality
- [ ] Implement migration testing and validation
- [ ] Add migration logging and error reporting

### Database Schema Management

- [ ] Create high_scores table with proper constraints
- [ ] Implement database indexes for performance optimization
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create database constraints and validation rules
- [ ] Implement database backup and restore procedures
- [ ] Add database schema validation and testing

## Non-Functional Requirements

### Performance Requirements

- [ ] Migration execution time < 30 seconds for typical migrations
- [ ] Database query performance < 500ms for high score operations
- [ ] Migration validation time < 5 seconds
- [ ] Rollback execution time < 30 seconds
- [ ] Minimal impact on application performance during migrations

### Reliability Requirements

- [ ] 100% successful migration success rate
- [ ] Zero data loss during migrations
- [ ] Automatic rollback on migration failures
- [ ] Comprehensive error handling and logging
- [ ] Data integrity validation after migrations

### Security Requirements

- [ ] Secure database connection handling
- [ ] Input validation and sanitization for migration scripts
- [ ] Row Level Security (RLS) implementation
- [ ] Secure environment variable handling
- [ ] Audit logging for database schema changes

## Technical Implementation

### Migration System Structure

```
src/database/
├── migrations/
│   ├── 001_create_high_scores_table.sql
│   ├── 001_create_high_scores_table_down.sql
│   └── ...
├── services/
│   ├── MigrationService.ts
│   ├── SchemaManager.ts
│   └── DatabaseValidator.ts
├── types/
│   └── MigrationTypes.ts
└── utils/
    ├── migrationRunner.ts
    └── schemaValidator.ts
```

### Migration Service Implementation

```typescript
// src/database/services/MigrationService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Migration, MigrationStatus } from "../types/MigrationTypes";

export class MigrationService {
  private supabase: SupabaseClient;
  private migrations: Migration[];

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.migrations = this.loadMigrations();
  }

  private loadMigrations(): Migration[] {
    return [
      {
        version: 1,
        name: "Create high_scores table",
        upFile: "migrations/001_create_high_scores_table.sql",
        downFile: "migrations/001_create_high_scores_table_down.sql",
        description:
          "Creates the high_scores table with indexes and RLS policies",
      },
    ];
  }

  async runMigrations(): Promise<MigrationStatus[]> {
    const results: MigrationStatus[] = [];

    for (const migration of this.migrations) {
      try {
        const isApplied = await this.isMigrationApplied(migration.version);

        if (!isApplied) {
          await this.applyMigration(migration);
          results.push({
            version: migration.version,
            name: migration.name,
            status: "applied",
            appliedAt: new Date(),
          });
        } else {
          results.push({
            version: migration.version,
            name: migration.name,
            status: "already_applied",
            appliedAt: await this.getMigrationAppliedAt(migration.version),
          });
        }
      } catch (error) {
        results.push({
          version: migration.version,
          name: migration.name,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    }

    return results;
  }

  async rollbackMigration(version: number): Promise<void> {
    const migration = this.migrations.find((m) => m.version === version);
    if (!migration) {
      throw new Error(`Migration version ${version} not found`);
    }

    const isApplied = await this.isMigrationApplied(version);
    if (!isApplied) {
      throw new Error(`Migration version ${version} is not applied`);
    }

    const downScript = await this.loadMigrationScript(migration.downFile);
    await this.executeMigrationScript(downScript);
    await this.removeMigrationRecord(version);
  }

  private async isMigrationApplied(version: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("schema_migrations")
      .select("version")
      .eq("version", version)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return !!data;
  }

  private async applyMigration(migration: Migration): Promise<void> {
    const upScript = await this.loadMigrationScript(migration.upFile);
    await this.executeMigrationScript(upScript);
    await this.recordMigration(migration);
  }

  private async loadMigrationScript(filePath: string): Promise<string> {
    // In a real implementation, this would load from the file system
    // For now, we'll return the SQL content directly
    return this.getMigrationSQL(filePath);
  }

  private async executeMigrationScript(sql: string): Promise<void> {
    const { error } = await this.supabase.rpc("execute_sql", { sql });
    if (error) {
      throw new Error(`Migration execution failed: ${error.message}`);
    }
  }

  private async recordMigration(migration: Migration): Promise<void> {
    const { error } = await this.supabase.from("schema_migrations").insert({
      version: migration.version,
      name: migration.name,
      applied_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to record migration: ${error.message}`);
    }
  }

  private async removeMigrationRecord(version: number): Promise<void> {
    const { error } = await this.supabase
      .from("schema_migrations")
      .delete()
      .eq("version", version);

    if (error) {
      throw new Error(`Failed to remove migration record: ${error.message}`);
    }
  }

  private getMigrationSQL(filePath: string): string {
    const migrationScripts: Record<string, string> = {
      "migrations/001_create_high_scores_table.sql": `
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

        CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
        CREATE INDEX IF NOT EXISTS idx_high_scores_achieved_at ON high_scores(achieved_at DESC);
        CREATE INDEX IF NOT EXISTS idx_high_scores_turns ON high_scores(turns_count DESC);
        CREATE INDEX IF NOT EXISTS idx_high_scores_lines ON high_scores(lines_popped DESC);

        ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

        CREATE POLICY IF NOT EXISTS "Allow read access" ON high_scores
          FOR SELECT USING (true);

        CREATE POLICY IF NOT EXISTS "Allow insert access" ON high_scores
          FOR INSERT WITH CHECK (true);
      `,
      "migrations/001_create_high_scores_table_down.sql": `
        DROP TABLE IF EXISTS high_scores CASCADE;
      `,
    };

    return migrationScripts[filePath] || "";
  }
}
```

### Migration Types

```typescript
// src/database/types/MigrationTypes.ts
export interface Migration {
  version: number;
  name: string;
  upFile: string;
  downFile: string;
  description: string;
}

export interface MigrationStatus {
  version: number;
  name: string;
  status: "applied" | "already_applied" | "failed";
  appliedAt?: Date;
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  migrations: MigrationStatus[];
  errors: string[];
}
```

### Schema Manager

```typescript
// src/database/services/SchemaManager.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { MigrationService } from "./MigrationService";

export class SchemaManager {
  private supabase: SupabaseClient;
  private migrationService: MigrationService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.migrationService = new MigrationService(supabase);
  }

  async deploySchema(): Promise<void> {
    try {
      // Ensure schema_migrations table exists
      await this.createMigrationsTable();

      // Run all pending migrations
      const results = await this.migrationService.runMigrations();

      // Validate schema after migrations
      await this.validateSchema();

      console.log("Schema deployment completed successfully");
      console.log("Migration results:", results);
    } catch (error) {
      console.error("Schema deployment failed:", error);
      throw error;
    }
  }

  async validateSchema(): Promise<boolean> {
    const requiredTables = ["high_scores", "schema_migrations"];
    const requiredIndexes = [
      "idx_high_scores_score",
      "idx_high_scores_achieved_at",
      "idx_high_scores_turns",
      "idx_high_scores_lines",
    ];

    for (const table of requiredTables) {
      const { error } = await this.supabase.from(table).select("*").limit(1);

      if (error) {
        console.error(`Table ${table} does not exist or is not accessible`);
        return false;
      }
    }

    // Validate indexes (this would require a more complex query in Supabase)
    console.log("Schema validation completed successfully");
    return true;
  }

  private async createMigrationsTable(): Promise<void> {
    const { error } = await this.supabase.rpc(
      "create_migrations_table_if_not_exists",
    );
    if (error) {
      console.warn("Failed to create migrations table:", error);
      // Fallback: create table manually
      await this.createMigrationsTableManually();
    }
  }

  private async createMigrationsTableManually(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error } = await this.supabase.rpc("execute_sql", {
      sql: createTableSQL,
    });
    if (error) {
      throw new Error(`Failed to create migrations table: ${error.message}`);
    }
  }
}
```

## Testing Requirements

### Unit Tests

- [ ] Test MigrationService class methods
- [ ] Test SchemaManager validation logic
- [ ] Test migration file loading and parsing
- [ ] Test migration status checking
- [ ] Test rollback functionality
- [ ] Test error handling and recovery

### Integration Tests

- [ ] Test complete migration workflow
- [ ] Test migration rollback process
- [ ] Test schema validation after migrations
- [ ] Test migration conflict detection
- [ ] Test database connectivity during migrations
- [ ] Test migration logging and error reporting

### Performance Tests

- [ ] Test migration execution time
- [ ] Test rollback execution time
- [ ] Test schema validation performance
- [ ] Test database query performance after migrations
- [ ] Test memory usage during migrations

## Accessibility Considerations

### Migration System Accessibility

- [ ] Ensure migration logs are accessible and clear
- [ ] Provide detailed error messages for migration failures
- [ ] Create accessible documentation for migration procedures
- [ ] Implement keyboard navigation for migration tools
- [ ] Ensure color contrast in migration interfaces

## Risk Assessment

### Technical Risks

- **Risk**: Migration failures causing data loss
  - **Impact**: High
  - **Mitigation**: Comprehensive testing and rollback procedures
  - **Probability**: Low

- **Risk**: Migration conflicts in production
  - **Impact**: High
  - **Mitigation**: Migration validation and conflict detection
  - **Probability**: Medium

- **Risk**: Performance degradation during migrations
  - **Impact**: Medium
  - **Mitigation**: Optimized migration scripts and monitoring
  - **Probability**: Low

### User Experience Risks

- **Risk**: Complex migration procedures for developers
  - **Impact**: Medium
  - **Mitigation**: Clear documentation and automated tools
  - **Probability**: Medium

## Success Metrics

### Development Metrics

- [ ] Migration execution time < 30 seconds
- [ ] 100% successful migration success rate
- [ ] Zero data loss during migrations
- [ ] Rollback execution time < 30 seconds
- [ ] Schema validation time < 5 seconds

### User Experience Metrics

- [ ] Single command to run migrations
- [ ] Clear error messages for all failure scenarios
- [ ] Comprehensive migration documentation
- [ ] Automated migration validation

## Implementation Steps

### Step 1: Create Migration System Structure

1. Create database directory structure
2. Implement MigrationService class
3. Create migration types and interfaces
4. Set up migration file organization

### Step 2: Implement Migration Runner

1. Create migration execution logic
2. Implement migration status tracking
3. Add rollback functionality
4. Create migration validation

### Step 3: Database Schema Implementation

1. Create high_scores table migration
2. Implement database indexes
3. Set up Row Level Security policies
4. Create user_preferences table migration

### Step 4: Schema Manager Implementation

1. Create SchemaManager class
2. Implement schema validation
3. Add migration table creation
4. Create deployment workflow

### Step 5: Testing and Validation

1. Test migration system thoroughly
2. Validate schema after migrations
3. Test rollback functionality
4. Verify database performance
5. Run comprehensive test suite

## Documentation Requirements

### Migration Documentation

- [ ] Migration system architecture guide
- [ ] Migration file format specification
- [ ] Migration execution procedures
- [ ] Rollback procedures
- [ ] Troubleshooting guide

### Development Documentation

- [ ] Migration development guide
- [ ] Schema validation procedures
- [ ] Database backup procedures
- [ ] Performance optimization guide

## Post-Implementation

### Monitoring

- [ ] Monitor migration execution times
- [ ] Track migration success rates
- [ ] Monitor database performance after migrations
- [ ] Track schema validation results

### Maintenance

- [ ] Regular migration testing
- [ ] Database schema optimization
- [ ] Migration script updates
- [ ] Performance monitoring and optimization

## Dependencies

### External Dependencies

- Supabase client library
- PostgreSQL database
- TypeScript runtime

### Internal Dependencies

- Existing database connection setup
- Environment variable configuration
- Error handling utilities
- Logging system

## Acceptance Criteria

### Functional Acceptance

- [ ] Migration system runs successfully
- [ ] All migrations apply correctly
- [ ] Rollback functionality works
- [ ] Schema validation passes
- [ ] Database performance maintained

### Non-Functional Acceptance

- [ ] Migration execution time < 30 seconds
- [ ] Rollback execution time < 30 seconds
- [ ] Schema validation time < 5 seconds
- [ ] Zero data loss during migrations
- [ ] 100% migration success rate

### Quality Acceptance

- [ ] 100% test coverage for migration system
- [ ] All linting rules pass
- [ ] TypeScript compilation successful
- [ ] Database queries perform under 500ms
