import { SupabaseClient } from "@supabase/supabase-js";
import { MigrationService } from "./MigrationService";
import { DatabaseValidator } from "../utils/databaseValidator";

export class SchemaManager {
  private supabase: SupabaseClient;
  private migrationService: MigrationService;
  private databaseValidator: DatabaseValidator;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.migrationService = new MigrationService(supabase);
    this.databaseValidator = new DatabaseValidator(supabase);
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
    const validationResult = await this.databaseValidator.validateSchema();

    if (!validationResult.success) {
      console.error("Schema validation failed:", validationResult.errors);
      return false;
    }

    if (validationResult.warnings.length > 0) {
      console.warn("Schema validation warnings:", validationResult.warnings);
    }

    console.log("Schema validation completed successfully");
    return true;
  }

  async validatePerformance(): Promise<boolean> {
    const validationResult = await this.databaseValidator.validatePerformance();

    if (!validationResult.success) {
      console.error("Performance validation failed:", validationResult.errors);
      return false;
    }

    if (validationResult.warnings.length > 0) {
      console.warn(
        "Performance validation warnings:",
        validationResult.warnings,
      );
    }

    console.log("Performance validation completed successfully");
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
