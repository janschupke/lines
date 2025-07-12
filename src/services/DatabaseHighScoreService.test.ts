import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DatabaseHighScoreService } from './DatabaseHighScoreService';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    onAuthStateChange: vi.fn()
  },
  channel: vi.fn()
} as any;

describe('DatabaseHighScoreService', () => {
  let highScoreService: DatabaseHighScoreService;

  beforeEach(() => {
    vi.clearAllMocks();
    highScoreService = new DatabaseHighScoreService(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitHighScore', () => {
    it('should submit high score successfully', async () => {
      const testSubmission = {
        player_name: 'test_player',
        score: 1000,
        turns_count: 10,
        individual_balls_popped: 5,
        lines_popped: 2,
        longest_line_popped: 5
      };

      const mockData = {
        id: '123',
        player_name: 'test_player',
        score: 1000,
        achieved_at: new Date().toISOString(),
        turns_count: 10,
        individual_balls_popped: 5,
        lines_popped: 2,
        longest_line_popped: 5
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      });

      const result = await highScoreService.submitHighScore(testSubmission);

      expect(result).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith('high_scores');
    });

    it('should handle database errors during submission', async () => {
      const testSubmission = {
        player_name: 'test_player',
        score: 1000,
        turns_count: 10,
        individual_balls_popped: 5,
        lines_popped: 2,
        longest_line_popped: 5
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          })
        })
      });

      const result = await highScoreService.submitHighScore(testSubmission);

      expect(result).toBeNull();
    });

    it('should handle exceptions during submission', async () => {
      const testSubmission = {
        player_name: 'test_player',
        score: 1000,
        turns_count: 10,
        individual_balls_popped: 5,
        lines_popped: 2,
        longest_line_popped: 5
      };

      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await highScoreService.submitHighScore(testSubmission);

      expect(result).toBeNull();
    });
  });

  describe('getHighScores', () => {
    it('should retrieve high scores successfully', async () => {
      const mockScores = [
        {
          id: '1',
          player_name: 'player1',
          score: 1000,
          achieved_at: new Date().toISOString(),
          turns_count: 10,
          individual_balls_popped: 5,
          lines_popped: 2,
          longest_line_popped: 5
        },
        {
          id: '2',
          player_name: 'player2',
          score: 800,
          achieved_at: new Date().toISOString(),
          turns_count: 8,
          individual_balls_popped: 4,
          lines_popped: 1,
          longest_line_popped: 4
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: mockScores, error: null })
          })
        })
      });

      const result = await highScoreService.getHighScores(10);

      expect(result).toEqual(mockScores);
      expect(mockSupabase.from).toHaveBeenCalledWith('high_scores');
    });

    it('should handle database errors during retrieval', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          })
        })
      });

      const result = await highScoreService.getHighScores(10);

      expect(result).toEqual([]);
    });

    it('should return empty array on exceptions', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await highScoreService.getHighScores(10);

      expect(result).toEqual([]);
    });
  });

  describe('getPlayerHighScores', () => {
    it('should retrieve player high scores successfully', async () => {
      const mockScores = [
        {
          id: '1',
          player_name: 'test_player',
          score: 1000,
          achieved_at: new Date().toISOString(),
          turns_count: 10,
          individual_balls_popped: 5,
          lines_popped: 2,
          longest_line_popped: 5
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockScores, error: null })
          })
        })
      });

      const result = await highScoreService.getPlayerHighScores('test_player');

      expect(result).toEqual(mockScores);
    });

    it('should handle database errors during player score retrieval', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          })
        })
      });

      const result = await highScoreService.getPlayerHighScores('test_player');

      expect(result).toEqual([]);
    });

    it('should return empty array on exceptions for player scores', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await highScoreService.getPlayerHighScores('test_player');

      expect(result).toEqual([]);
    });
  });

  describe('real-time subscriptions', () => {
    it('should subscribe to high score updates', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis()
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const callback = vi.fn();
      const unsubscribe = highScoreService.subscribeToHighScoreUpdates(callback);

      expect(mockSupabase.channel).toHaveBeenCalledWith('high_scores');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'high_scores' },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();

      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle subscription errors', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation(() => {
          throw new Error('Subscription failed');
        })
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const callback = vi.fn();
      const unsubscribe = highScoreService.subscribeToHighScoreUpdates(callback);

      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('connection status', () => {
    it('should check connection status', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const isConnected = await highScoreService.isConnected();

      expect(isConnected).toBe(true);
    });

    it('should return false on connection error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } })
        })
      });

      const isConnected = await highScoreService.isConnected();

      expect(isConnected).toBe(false);
    });

    it('should return false on exception', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const isConnected = await highScoreService.isConnected();

      expect(isConnected).toBe(false);
    });
  });

  describe('retry connection', () => {
    it('should retry connection successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const success = await highScoreService.retryConnection();

      expect(success).toBe(true);
    });

    it('should fail retry on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } })
        })
      });

      const success = await highScoreService.retryConnection();

      expect(success).toBe(false);
    });
  });
}); 
