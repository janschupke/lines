import { SupabaseClient } from '@supabase/supabase-js';
import type { HighScore } from './HighScoreMigrationService';

export interface HighScoreSubmission {
  player_name: string;
  score: number;
  game_duration?: number;
  balls_cleared?: number;
  turns_count: number;
  individual_balls_popped: number;
  lines_popped: number;
  longest_line_popped: number;
}

export class DatabaseHighScoreService {
  private supabase: SupabaseClient;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private retryAttempts = 0;
  private maxRetryAttempts = 3;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.initializeConnectionMonitoring();
  }

  async submitHighScore(submission: HighScoreSubmission): Promise<HighScore | null> {
    try {
      this.updateConnectionStatus('connected');
      this.retryAttempts = 0;

      const { data, error } = await this.supabase
        .from('high_scores')
        .insert({
          player_name: submission.player_name,
          score: submission.score,
          game_duration: submission.game_duration,
          balls_cleared: submission.balls_cleared,
          turns_count: submission.turns_count,
          individual_balls_popped: submission.individual_balls_popped,
          lines_popped: submission.lines_popped,
          longest_line_popped: submission.longest_line_popped
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit high score: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error submitting high score:', error);
      this.handleSubmissionError();
      return null;
    }
  }

  async getHighScores(limit: number = 10): Promise<HighScore[]> {
    try {
      this.updateConnectionStatus('connected');
      this.retryAttempts = 0;

      const { data, error } = await this.supabase
        .from('high_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch high scores: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching high scores:', error);
      this.handleFetchError();
      return [];
    }
  }

  async getPlayerHighScores(playerName: string): Promise<HighScore[]> {
    try {
      this.updateConnectionStatus('connected');
      this.retryAttempts = 0;

      const { data, error } = await this.supabase
        .from('high_scores')
        .select('*')
        .eq('player_name', playerName)
        .order('score', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch player high scores: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching player high scores:', error);
      this.handleFetchError();
      return [];
    }
  }

  subscribeToHighScoreUpdates(callback: (scores: HighScore[]) => void): () => void {
    try {
      const subscription = this.supabase
        .channel('high_scores')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'high_scores' },
          async () => {
            try {
              const scores = await this.getHighScores(10);
              callback(scores);
            } catch (error) {
              console.error('Error in high score subscription:', error);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Subscription failed:', error);
      return () => {}; // Return empty cleanup function
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('high_scores')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  async retryConnection(): Promise<boolean> {
    try {
      this.updateConnectionStatus('connecting');
      const isConnected = await this.isConnected();
      
      if (isConnected) {
        this.updateConnectionStatus('connected');
        this.retryAttempts = 0;
        return true;
      } else {
        this.updateConnectionStatus('disconnected');
        return false;
      }
    } catch {
      this.updateConnectionStatus('disconnected');
      return false;
    }
  }

  private updateConnectionStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
    this.connectionStatus = status;
    this.notifyConnectionStatusChange(status);
  }

  private handleSubmissionError(): void {
    if (this.retryAttempts < this.maxRetryAttempts) {
      this.retryAttempts++;
      this.updateConnectionStatus('connecting');
      
      setTimeout(() => {
        console.log(`Retrying high score submission (attempt ${this.retryAttempts})`);
        // Retry logic would be implemented here
      }, 1000 * this.retryAttempts);
    } else {
      this.updateConnectionStatus('disconnected');
      this.retryAttempts = 0;
    }
  }

  private handleFetchError(): void {
    if (this.retryAttempts < this.maxRetryAttempts) {
      this.retryAttempts++;
      this.updateConnectionStatus('connecting');
      
      setTimeout(() => {
        console.log(`Retrying high score fetch (attempt ${this.retryAttempts})`);
        // Retry logic would be implemented here
      }, 1000 * this.retryAttempts);
    } else {
      this.updateConnectionStatus('disconnected');
      this.retryAttempts = 0;
    }
  }

  private initializeConnectionMonitoring(): void {
    // Monitor connection status
    this.supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.updateConnectionStatus('connected');
      } else if (event === 'SIGNED_OUT') {
        this.updateConnectionStatus('disconnected');
      }
    });
  }

  private notifyConnectionStatusChange(status: string): void {
    // Dispatch custom event for connection status changes
    window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
      detail: { status }
    }));
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }
} 
