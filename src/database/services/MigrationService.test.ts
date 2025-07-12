import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MigrationService } from './MigrationService';

// Mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    onAuthStateChange: vi.fn()
  }
} as any;

describe('MigrationService', () => {
  let migrationService: MigrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    migrationService = new MigrationService(mockSupabase);
  });

  describe('runMigrations', () => {
    it('should run all pending migrations successfully', async () => {
      // Mock successful migration execution
      mockSupabase.rpc.mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        }),
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      const results = await migrationService.runMigrations();

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('applied');
      expect(results[1].status).toBe('applied');
    });

    it('should handle migration failures gracefully', async () => {
      // Mock migration failure
      mockSupabase.rpc.mockRejectedValue(new Error('Database connection failed'));

      await expect(migrationService.runMigrations()).rejects.toThrow('Database connection failed');
    });

    it('should skip already applied migrations', async () => {
      // Mock already applied migration
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { version: 1 }, 
              error: null 
            })
          })
        })
      });

      const results = await migrationService.runMigrations();

      expect(results[0].status).toBe('already_applied');
    });
  });

  describe('rollbackMigration', () => {
    it('should rollback migration successfully', async () => {
      // Mock successful rollback
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { version: 1 }, 
              error: null 
            })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });
      mockSupabase.rpc.mockResolvedValue({ error: null });

      await expect(migrationService.rollbackMigration(1)).resolves.not.toThrow();
    });

    it('should throw error for non-existent migration', async () => {
      await expect(migrationService.rollbackMigration(999)).rejects.toThrow('Migration version 999 not found');
    });
  });
}); 
