import { HighScoreService } from './HighScoreService';
import { LocalHighScoreService } from './LocalHighScoreService';
import type { ConnectionStatus, HighScore } from './HighScoreService';

export interface HighScoreServiceInterface {
  saveHighScore(score: HighScore): Promise<boolean>;
  getTopScores(limit?: number): Promise<HighScore[]>;
  getPlayerHighScores(playerName: string): Promise<HighScore[]>;
  isConnected(): Promise<boolean>;
  retryConnection(): Promise<boolean>;
  getConnectionStatus(): ConnectionStatus;
  subscribeToHighScoreUpdates(callback: (scores: HighScore[]) => void): () => void;
}

export class HighScoreServiceFactory {
  static createService(): HighScoreServiceInterface {
    const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Use local service for development if Supabase is not properly configured
    if (environment === 'development' && (!supabaseUrl || !supabaseKey || supabaseUrl.includes('postgresql://'))) {
      console.log('Using LocalHighScoreService for development');
      return new LocalHighScoreService();
    }

    // Use remote service for production or properly configured development
    try {
      console.log('Using HighScoreService with Supabase');
      return new HighScoreService();
    } catch (error) {
      console.warn('Failed to create HighScoreService, falling back to LocalHighScoreService:', error);
      return new LocalHighScoreService();
    }
  }
} 
