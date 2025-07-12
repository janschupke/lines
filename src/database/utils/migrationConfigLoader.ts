import type { Migration } from "../types/MigrationTypes";

export interface MigrationConfig {
  migrations: Migration[];
}

export class MigrationConfigLoader {
  /**
   * Loads migration definitions from a JSON configuration file
   */
  static async loadMigrationConfig(
    configPath: string = "migrations/migrations.json",
  ): Promise<Migration[]> {
    try {
      const response = await fetch(`/src/database/${configPath}`);
      if (!response.ok) {
        throw new Error(
          `Failed to load migration config: ${response.statusText}`,
        );
      }

      const config: MigrationConfig = await response.json();
      return this.validateAndSortMigrations(config.migrations);
    } catch (error) {
      console.error("Failed to load migration configuration:", error);
      throw new Error(
        `Migration configuration loading failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Validates migration definitions and sorts them by version
   */
  private static validateAndSortMigrations(
    migrations: Migration[],
  ): Migration[] {
    if (!Array.isArray(migrations)) {
      throw new Error(
        "Migration configuration must contain an array of migrations",
      );
    }

    if (migrations.length === 0) {
      throw new Error("No migrations found in configuration");
    }

    // Validate each migration
    const validatedMigrations = migrations.map((migration, index) => {
      if (!migration.version || typeof migration.version !== "number") {
        throw new Error(
          `Migration at index ${index} must have a valid version number`,
        );
      }

      if (!migration.name || typeof migration.name !== "string") {
        throw new Error(`Migration at index ${index} must have a valid name`);
      }

      if (!migration.upFile || typeof migration.upFile !== "string") {
        throw new Error(`Migration at index ${index} must have a valid upFile`);
      }

      if (!migration.downFile || typeof migration.downFile !== "string") {
        throw new Error(
          `Migration at index ${index} must have a valid downFile`,
        );
      }

      return migration;
    });

    // Check for duplicate versions
    const versions = validatedMigrations.map((m) => m.version);
    const uniqueVersions = new Set(versions);
    if (versions.length !== uniqueVersions.size) {
      throw new Error("Migration versions must be unique");
    }

    // Sort by version number
    return validatedMigrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Loads migration definitions from a directory by scanning for migration files
   * This is an alternative approach that doesn't require a config file
   */
  static async loadMigrationsFromDirectory(): Promise<Migration[]> {
    try {
      // This would require a server-side implementation or build-time processing
      // For now, we'll use the JSON config approach as it's more practical for client-side
      throw new Error(
        "Directory-based migration loading is not implemented for client-side environments",
      );
    } catch (error) {
      console.error("Failed to load migrations from directory:", error);
      throw error;
    }
  }
}
