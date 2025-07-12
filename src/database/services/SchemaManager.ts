import { SupabaseClient } from '@supabase/supabase-js';
import { MigrationService } from './MigrationService';

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
      
      console.log('Schema deployment completed successfully');
      console.log('Migration results:', results);
    } catch (error) {
      console.error('Schema deployment failed:', error);
      throw error;
    }
  }

  async validateSchema(): Promise<boolean> {
    const requiredTables = ['high_scores', 'schema_migrations', 'user_preferences'];

    for (const table of requiredTables) {
      const { error } = await this.supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`Table ${table} does not exist or is not accessible`);
        return false;
      }
    }

    // Validate indexes (this would require a more complex query in Supabase)
    console.log('Schema validation completed successfully');
    return true;
  }

  private async createMigrationsTable(): Promise<void> {
    const { error } = await this.supabase.rpc('create_migrations_table_if_not_exists');
    if (error) {
      console.warn('Failed to create migrations table:', error);
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

    const { error } = await this.supabase.rpc('execute_sql', { sql: createTableSQL });
    if (error) {
      throw new Error(`Failed to create migrations table: ${error.message}`);
    }
  }
} 
