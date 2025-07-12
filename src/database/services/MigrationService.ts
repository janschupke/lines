import { SupabaseClient } from "@supabase/supabase-js";
import type { Migration, MigrationStatus } from "../types/MigrationTypes";
import { MigrationLoader } from "../utils/migrationLoader";
import { MigrationConfigLoader } from "../utils/migrationConfigLoader";

export class MigrationService {
  private supabase: SupabaseClient;
  private migrations: Migration[];

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.migrations = [];
  }

  /**
   * Loads migrations dynamically from configuration file
   * This method is async to allow for dynamic loading
   */
  private async loadMigrations(): Promise<Migration[]> {
    try {
      return await MigrationConfigLoader.loadMigrationConfig();
    } catch (error) {
      console.error(
        "Failed to load migrations dynamically, falling back to hardcoded migrations:",
        error,
      );
      // Fallback to hardcoded migrations if dynamic loading fails
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
  }

  async runMigrations(): Promise<MigrationStatus[]> {
    const results: MigrationStatus[] = [];

    // Load migrations dynamically
    this.migrations = await this.loadMigrations();

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
    // Load migrations dynamically
    this.migrations = await this.loadMigrations();

    const migration = this.migrations.find((m) => m.version === version);
    if (!migration) {
      throw new Error(`Migration version ${version} not found`);
    }

    const isApplied = await this.isMigrationApplied(version);
    if (!isApplied) {
      throw new Error(`Migration version ${version} is not applied`);
    }

    const downScript = await this.loadMigrationScript(migration.downFile);

    // Use a transaction to ensure atomicity for rollback
    const { error } = await this.supabase.rpc("execute_rollback_transaction", {
      rollback_sql: downScript,
      migration_version: version,
    });

    if (error) {
      throw new Error(`Rollback execution failed: ${error.message}`);
    }
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

    // Use a transaction to ensure atomicity
    const { error } = await this.supabase.rpc("execute_migration_transaction", {
      migration_sql: upScript,
      migration_version: migration.version,
      migration_name: migration.name,
    });

    if (error) {
      throw new Error(`Migration execution failed: ${error.message}`);
    }
  }

  private async loadMigrationScript(filePath: string): Promise<string> {
    return await MigrationLoader.loadMigrationFile(filePath);
  }

  private async getMigrationAppliedAt(version: number): Promise<Date> {
    const { data, error } = await this.supabase
      .from("schema_migrations")
      .select("applied_at")
      .eq("version", version)
      .single();

    if (error) {
      throw new Error(`Failed to get migration applied date: ${error.message}`);
    }

    return new Date(data.applied_at);
  }
}
