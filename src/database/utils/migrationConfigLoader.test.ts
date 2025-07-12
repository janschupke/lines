import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MigrationConfigLoader } from './migrationConfigLoader';

// Mock fetch globally
global.fetch = vi.fn();

describe('MigrationConfigLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loadMigrationConfig', () => {
    it('should load and validate migration configuration successfully', async () => {
      const mockConfig = {
        migrations: [
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
            description: 'Adds user preferences table'
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      const result = await MigrationConfigLoader.loadMigrationConfig();

      expect(fetch).toHaveBeenCalledWith('/src/database/migrations/migrations.json');
      expect(result).toHaveLength(2);
      expect(result[0].version).toBe(1);
      expect(result[1].version).toBe(2);
      // Should be sorted by version
      expect(result[0].version).toBeLessThan(result[1].version);
    });

    it('should throw error when fetch fails', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(MigrationConfigLoader.loadMigrationConfig()).rejects.toThrow(
        'Migration configuration loading failed: Failed to load migration config: Not Found'
      );
    });

    it('should throw error when fetch throws', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(MigrationConfigLoader.loadMigrationConfig()).rejects.toThrow(
        'Migration configuration loading failed: Network error'
      );
    });

    it('should throw error when migrations array is missing', async () => {
      const mockConfig = {};

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      await expect(MigrationConfigLoader.loadMigrationConfig()).rejects.toThrow(
        'Migration configuration loading failed: Migration configuration must contain an array of migrations'
      );
    });

    it('should throw error when migrations array is empty', async () => {
      const mockConfig = { migrations: [] };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      await expect(MigrationConfigLoader.loadMigrationConfig()).rejects.toThrow(
        'Migration configuration loading failed: No migrations found in configuration'
      );
    });

    it('should throw error when migration is missing version', async () => {
      const mockConfig = {
        migrations: [
          {
            name: 'Create high_scores table',
            upFile: 'migrations/001_create_high_scores_table.sql',
            downFile: 'migrations/001_create_high_scores_table_down.sql',
            description: 'Creates the high_scores table'
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      await expect(MigrationConfigLoader.loadMigrationConfig()).rejects.toThrow(
        'Migration configuration loading failed: Migration at index 0 must have a valid version number'
      );
    });

    it('should throw error when migration is missing name', async () => {
      const mockConfig = {
        migrations: [
          {
            version: 1,
            upFile: 'migrations/001_create_high_scores_table.sql',
            downFile: 'migrations/001_create_high_scores_table_down.sql',
            description: 'Creates the high_scores table'
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      await expect(MigrationConfigLoader.loadMigrationConfig()).rejects.toThrow(
        'Migration configuration loading failed: Migration at index 0 must have a valid name'
      );
    });

    it('should throw error when migration is missing upFile', async () => {
      const mockConfig = {
        migrations: [
          {
            version: 1,
            name: 'Create high_scores table',
            downFile: 'migrations/001_create_high_scores_table_down.sql',
            description: 'Creates the high_scores table'
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      await expect(MigrationConfigLoader.loadMigrationConfig()).rejects.toThrow(
        'Migration configuration loading failed: Migration at index 0 must have a valid upFile'
      );
    });

    it('should throw error when migration is missing downFile', async () => {
      const mockConfig = {
        migrations: [
          {
            version: 1,
            name: 'Create high_scores table',
            upFile: 'migrations/001_create_high_scores_table.sql',
            description: 'Creates the high_scores table'
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      await expect(MigrationConfigLoader.loadMigrationConfig()).rejects.toThrow(
        'Migration configuration loading failed: Migration at index 0 must have a valid downFile'
      );
    });

    it('should throw error when migrations have duplicate versions', async () => {
      const mockConfig = {
        migrations: [
          {
            version: 1,
            name: 'Create high_scores table',
            upFile: 'migrations/001_create_high_scores_table.sql',
            downFile: 'migrations/001_create_high_scores_table_down.sql',
            description: 'Creates the high_scores table'
          },
          {
            version: 1,
            name: 'Create another table',
            upFile: 'migrations/002_create_another_table.sql',
            downFile: 'migrations/002_create_another_table_down.sql',
            description: 'Creates another table'
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      await expect(MigrationConfigLoader.loadMigrationConfig()).rejects.toThrow(
        'Migration configuration loading failed: Migration versions must be unique'
      );
    });

    it('should sort migrations by version number', async () => {
      const mockConfig = {
        migrations: [
          {
            version: 3,
            name: 'Third migration',
            upFile: 'migrations/003_third_migration.sql',
            downFile: 'migrations/003_third_migration_down.sql',
            description: 'Third migration'
          },
          {
            version: 1,
            name: 'First migration',
            upFile: 'migrations/001_first_migration.sql',
            downFile: 'migrations/001_first_migration_down.sql',
            description: 'First migration'
          },
          {
            version: 2,
            name: 'Second migration',
            upFile: 'migrations/002_second_migration.sql',
            downFile: 'migrations/002_second_migration_down.sql',
            description: 'Second migration'
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      const result = await MigrationConfigLoader.loadMigrationConfig();

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(1);
      expect(result[1].version).toBe(2);
      expect(result[2].version).toBe(3);
    });
  });

  describe('loadMigrationsFromDirectory', () => {
    it('should throw error for unimplemented directory loading', async () => {
      await expect(MigrationConfigLoader.loadMigrationsFromDirectory()).rejects.toThrow(
        'Directory-based migration loading is not implemented for client-side environments'
      );
    });
  });
}); 
