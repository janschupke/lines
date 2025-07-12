import { describe, it, expect } from "vitest";
import { MigrationLoader } from "./migrationLoader";

describe("MigrationLoader", () => {
  describe("loadMigrationFile", () => {
    it("should load high scores table migration successfully", async () => {
      const content = await MigrationLoader.loadMigrationFile(
        "migrations/001_create_high_scores_table.sql",
      );

      expect(content).toContain("CREATE TABLE IF NOT EXISTS high_scores");
      expect(content).toContain(
        "CREATE INDEX IF NOT EXISTS idx_high_scores_score",
      );
      expect(content).toContain(
        "ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY",
      );
    });

    it("should load down migration files successfully", async () => {
      const content = await MigrationLoader.loadMigrationFile(
        "migrations/001_create_high_scores_table_down.sql",
      );

      expect(content).toContain("DROP TABLE IF EXISTS high_scores CASCADE");
    });

    it("should throw error for non-existent migration file", async () => {
      await expect(
        MigrationLoader.loadMigrationFile(
          "migrations/999_nonexistent_migration.sql",
        ),
      ).rejects.toThrow(
        "Migration file not found: migrations/999_nonexistent_migration.sql",
      );
    });
  });

  describe("validateMigrationContent", () => {
    it("should validate valid SQL content", () => {
      const validSQL = "CREATE TABLE test_table (id INTEGER PRIMARY KEY);";
      const isValid = MigrationLoader.validateMigrationContent(validSQL);
      expect(isValid).toBe(true);
    });

    it("should reject empty content", () => {
      const emptyContent = "";
      const isValid = MigrationLoader.validateMigrationContent(emptyContent);
      expect(isValid).toBe(false);
    });

    it("should reject whitespace-only content", () => {
      const whitespaceContent = "   \n\t   ";
      const isValid =
        MigrationLoader.validateMigrationContent(whitespaceContent);
      expect(isValid).toBe(false);
    });

    it("should reject content without SQL keywords", () => {
      const invalidContent = "This is not SQL content";
      const isValid = MigrationLoader.validateMigrationContent(invalidContent);
      expect(isValid).toBe(false);
    });

    it("should accept content with different SQL keywords", () => {
      const createSQL = "CREATE TABLE test (id INTEGER);";
      const dropSQL = "DROP TABLE test;";
      const alterSQL = "ALTER TABLE test ADD COLUMN name TEXT;";
      const insertSQL = "INSERT INTO test VALUES (1);";
      const updateSQL = 'UPDATE test SET name = "test";';
      const deleteSQL = "DELETE FROM test WHERE id = 1;";
      const selectSQL = "SELECT * FROM test;";

      expect(MigrationLoader.validateMigrationContent(createSQL)).toBe(true);
      expect(MigrationLoader.validateMigrationContent(dropSQL)).toBe(true);
      expect(MigrationLoader.validateMigrationContent(alterSQL)).toBe(true);
      expect(MigrationLoader.validateMigrationContent(insertSQL)).toBe(true);
      expect(MigrationLoader.validateMigrationContent(updateSQL)).toBe(true);
      expect(MigrationLoader.validateMigrationContent(deleteSQL)).toBe(true);
      expect(MigrationLoader.validateMigrationContent(selectSQL)).toBe(true);
    });
  });

  describe("getAvailableMigrations", () => {
    it("should return list of available migration files", () => {
      const migrations = MigrationLoader.getAvailableMigrations();

      expect(migrations).toHaveLength(2);
      expect(migrations).toContain(
        "migrations/001_create_high_scores_table.sql",
      );
      expect(migrations).toContain(
        "migrations/001_create_high_scores_table_down.sql",
      );
    });

    it("should return unique migration files", () => {
      const migrations = MigrationLoader.getAvailableMigrations();
      const uniqueMigrations = new Set(migrations);

      expect(migrations.length).toBe(uniqueMigrations.size);
    });
  });
});
