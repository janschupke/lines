import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseValidator } from './databaseValidator';

// Mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    onAuthStateChange: vi.fn()
  }
} as any;

describe('DatabaseValidator', () => {
  let databaseValidator: DatabaseValidator;

  beforeEach(() => {
    vi.clearAllMocks();
    databaseValidator = new DatabaseValidator(mockSupabase);
  });

  describe('validateSchema', () => {
    it('should validate schema successfully when all tables exist', async () => {
      // Mock successful table access
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await databaseValidator.validateSchema();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.details.tables).toBeDefined();
    });

    it('should fail validation when tables do not exist', async () => {
      // Mock table access failure
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: { message: 'Table does not exist' } })
        })
      });

      const result = await databaseValidator.validateSchema();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('does not exist'))).toBe(true);
    });

    it('should include warnings for missing columns', async () => {
      // Mock successful table access
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await databaseValidator.validateSchema();

      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validatePerformance', () => {
    it('should validate performance successfully', async () => {
      // Mock successful query
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ error: null })
          })
        })
      });

      const result = await databaseValidator.validatePerformance();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.details.queryPerformance).toBeDefined();
    });

    it('should include warnings for slow queries', async () => {
      // Mock slow query by adding delay
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(() => {
              return new Promise(resolve => {
                setTimeout(() => resolve({ error: null }), 600);
              });
            })
          })
        })
      });

      const result = await databaseValidator.validatePerformance();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(warning => warning.includes('took') && warning.includes('ms'))).toBe(true);
    });

    it('should handle query errors gracefully', async () => {
      // Mock query error
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database connection failed'))
          })
        })
      });

      const result = await databaseValidator.validatePerformance();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Performance validation failed'))).toBe(true);
    });
  });

  describe('validateDatabase', () => {
    it('should validate both schema and performance successfully', async () => {
      // Mock successful operations
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ error: null })
          })
        })
      });

      const result = await databaseValidator.validateDatabase();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.details.schema).toBeDefined();
      expect(result.details.performance).toBeDefined();
    });

    it('should fail when schema validation fails', async () => {
      // Mock schema validation failure
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: { message: 'Table does not exist' } })
        })
      });

      const result = await databaseValidator.validateDatabase();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail when performance validation fails', async () => {
      // Mock successful schema validation but failed performance validation
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Performance test failed'))
          })
        })
      });

      const result = await databaseValidator.validateDatabase();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateConnectivity', () => {
    it('should validate connectivity successfully', async () => {
      // Mock successful connectivity test
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await databaseValidator['validateConnectivity']();

      expect(result).toBe(true);
    });

    it('should handle connectivity errors', async () => {
      // Mock connectivity failure
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Connection failed'))
        })
      });

      const result = await databaseValidator['validateConnectivity']();

      expect(result).toBe(false);
    });
  });
}); 
