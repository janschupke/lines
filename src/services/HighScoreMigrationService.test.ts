import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HighScoreMigrationService } from './HighScoreMigrationService';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    onAuthStateChange: vi.fn()
  }
} as any;

describe('HighScoreMigrationService', () => {
  let migrationService: HighScoreMigrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    migrationService = new HighScoreMigrationService(mockSupabase);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('migrateFromLocalStorage', () => {
    it('should return no migration needed when no local data exists', async () => {
      const localStorage = window.localStorage as any;
      localStorage.getItem.mockReturnValue(null);

      const result = await migrationService.migrateFromLocalStorage();

      expect(result.isComplete).toBe(true);
      expect(result.currentStep).toBe('No local data to migrate');
      expect(result.totalRecords).toBe(0);
    });

    it('should migrate valid local data successfully', async () => {
      const testData = [
        {
          player_name: 'test_player',
          score: 1000,
          turns_count: 10,
          individual_balls_popped: 5,
          lines_popped: 2,
          longest_line_popped: 5
        }
      ];

      const localStorage = window.localStorage as any;
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      const result = await migrationService.migrateFromLocalStorage();

      expect(result.isComplete).toBe(true);
      expect(result.currentStep).toBe('Migration completed');
      expect(result.totalRecords).toBe(1);
      expect(result.processedRecords).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
    });

    it('should handle invalid local data gracefully', async () => {
      const invalidData = [
        { invalid_field: 'test' },
        { player_name: '', score: 0 },
        { player_name: 'valid', score: 100, turns_count: 5, individual_balls_popped: 3, lines_popped: 1, longest_line_popped: 3 }
      ];

      const localStorage = window.localStorage as any;
      localStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = await migrationService.migrateFromLocalStorage();

      expect(result.isComplete).toBe(true);
      expect(result.totalRecords).toBe(3);
      expect(result.processedRecords).toBe(1); // Only the valid one
    });

    it('should handle database errors during migration', async () => {
      const testData = [
        {
          player_name: 'test_player',
          score: 1000,
          turns_count: 10,
          individual_balls_popped: 5,
          lines_popped: 2,
          longest_line_popped: 5
        }
      ];

      const localStorage = window.localStorage as any;
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'Database error' } })
      });

      const result = await migrationService.migrateFromLocalStorage();

      expect(result.isComplete).toBe(true);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
    });

    it('should clean up local data after successful migration', async () => {
      const testData = [
        {
          player_name: 'test_player',
          score: 1000,
          turns_count: 10,
          individual_balls_popped: 5,
          lines_popped: 2,
          longest_line_popped: 5
        }
      ];

      const localStorage = window.localStorage as any;
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      await migrationService.migrateFromLocalStorage();

      expect(localStorage.removeItem).toHaveBeenCalledWith('lines-game-high-scores');
    });

    it('should not clean up local data if migration has errors', async () => {
      const testData = [
        {
          player_name: 'test_player',
          score: 1000,
          turns_count: 10,
          individual_balls_popped: 5,
          lines_popped: 2,
          longest_line_popped: 5
        }
      ];

      const localStorage = window.localStorage as any;
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'Database error' } })
      });

      await migrationService.migrateFromLocalStorage();

      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', async () => {
      const localStorage = window.localStorage as any;
      localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await migrationService.migrateFromLocalStorage();

      expect(result.isComplete).toBe(true);
      expect(result.currentStep).toBe('No local data to migrate');
    });
  });

  describe('data validation', () => {
    it('should validate required fields correctly', async () => {
      const testData = [
        {
          player_name: 'valid_player',
          score: 1000,
          turns_count: 10,
          individual_balls_popped: 5,
          lines_popped: 2,
          longest_line_popped: 5
        },
        {
          player_name: '', // Invalid: empty name
          score: 1000,
          turns_count: 10,
          individual_balls_popped: 5,
          lines_popped: 2,
          longest_line_popped: 5
        },
        {
          player_name: 'valid_player_2',
          score: -100, // Invalid: negative score
          turns_count: 10,
          individual_balls_popped: 5,
          lines_popped: 2,
          longest_line_popped: 5
        }
      ];

      const localStorage = window.localStorage as any;
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));

      const result = await migrationService.migrateFromLocalStorage();

      expect(result.totalRecords).toBe(3);
      expect(result.processedRecords).toBe(1); // Only the first valid record
    });
  });
}); 
