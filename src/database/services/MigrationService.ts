import { SupabaseClient } from '@supabase/supabase-js';
import type { Migration, MigrationStatus } from '../types/MigrationTypes';

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
        name: 'Create high_scores table',
        upFile: 'migrations/001_create_high_scores_table.sql',
        downFile: 'migrations/001_create_high_scores_table_down.sql',
        description: 'Creates the high_scores table with indexes and RLS policies'
      },
      {
        version: 2,
        name: 'Add user preferences table',
        upFile: 'migrations/002_add_user_preferences_table.sql',
        downFile: 'migrations/002_add_user_preferences_table_down.sql',
        description: 'Creates user_preferences table for storing user settings'
      }
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
            status: 'applied',
            appliedAt: new Date()
          });
        } else {
          results.push({
            version: migration.version,
            name: migration.name,
            status: 'already_applied',
            appliedAt: await this.getMigrationAppliedAt(migration.version)
          });
        }
      } catch (error) {
        results.push({
          version: migration.version,
          name: migration.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }
    
    return results;
  }

  async rollbackMigration(version: number): Promise<void> {
    const migration = this.migrations.find(m => m.version === version);
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
      .from('schema_migrations')
      .select('version')
      .eq('version', version)
      .single();

    if (error && error.code !== 'PGRST116') {
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
    const { error } = await this.supabase.rpc('execute_sql', { sql });
    if (error) {
      throw new Error(`Migration execution failed: ${error.message}`);
    }
  }

  private async recordMigration(migration: Migration): Promise<void> {
    const { error } = await this.supabase
      .from('schema_migrations')
      .insert({
        version: migration.version,
        name: migration.name,
        applied_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to record migration: ${error.message}`);
    }
  }

  private async removeMigrationRecord(version: number): Promise<void> {
    const { error } = await this.supabase
      .from('schema_migrations')
      .delete()
      .eq('version', version);

    if (error) {
      throw new Error(`Failed to remove migration record: ${error.message}`);
    }
  }

  private async getMigrationAppliedAt(version: number): Promise<Date> {
    const { data, error } = await this.supabase
      .from('schema_migrations')
      .select('applied_at')
      .eq('version', version)
      .single();

    if (error) {
      throw new Error(`Failed to get migration applied date: ${error.message}`);
    }

    return new Date(data.applied_at);
  }

  private getMigrationSQL(filePath: string): string {
    const migrationScripts: Record<string, string> = {
      'migrations/001_create_high_scores_table.sql': `
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
      'migrations/001_create_high_scores_table_down.sql': `
        DROP TABLE IF EXISTS high_scores CASCADE;
      `,
      'migrations/002_add_user_preferences_table.sql': `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          player_name TEXT UNIQUE NOT NULL,
          board_size INTEGER DEFAULT 9,
          time_limit INTEGER DEFAULT 0,
          sound_enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_user_preferences_player_name ON user_preferences(player_name);

        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

        CREATE POLICY IF NOT EXISTS "Allow read access" ON user_preferences
          FOR SELECT USING (true);

        CREATE POLICY IF NOT EXISTS "Allow insert access" ON user_preferences
          FOR INSERT WITH CHECK (true);

        CREATE POLICY IF NOT EXISTS "Allow update access" ON user_preferences
          FOR UPDATE USING (true);
      `,
      'migrations/002_add_user_preferences_table_down.sql': `
        DROP TABLE IF EXISTS user_preferences CASCADE;
      `
    };

    return migrationScripts[filePath] || '';
  }
} 
