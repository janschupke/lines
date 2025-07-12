import { SupabaseClient } from '@supabase/supabase-js';
import type { Migration, MigrationStatus } from '../types/MigrationTypes';
import { MigrationLoader } from '../utils/migrationLoader';

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
    return await MigrationLoader.loadMigrationFile(filePath);
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
} 
