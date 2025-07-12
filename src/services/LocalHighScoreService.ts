import type { ConnectionStatus, HighScore } from './HighScoreService';

export class LocalHighScoreService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private localScores: HighScore[] = [];

  constructor() {
    this.loadLocalScores();
  }

  async saveHighScore(score: HighScore): Promise<boolean> {
    try {
      // Validate required fields
      if (!score.playerName || typeof score.score !== 'number' || score.score < 0) {
        console.error('Invalid high score data:', score);
        this.connectionStatus = 'error';
        return false;
      }

      // Check for duplicate scores from the same player
      const existingScore = this.localScores.find(
        existing => existing.playerName === score.playerName && existing.score === score.score
      );
      
      if (existingScore) {
        console.warn('Duplicate score detected for player:', score.playerName);
        this.connectionStatus = 'connected';
        return true; // Return true since the score already exists
      }

      this.connectionStatus = 'connecting';
      
      // Add to local scores
      this.localScores.push(score);
      this.localScores.sort((a, b) => b.score - a.score);
      this.localScores = this.localScores.slice(0, 20); // Keep top 20
      
      // Save to localStorage
      this.saveLocalScores();
      
      this.connectionStatus = 'connected';
      return true;
    } catch (error) {
      this.connectionStatus = 'error';
      console.error('Failed to save high score:', error);
      return false;
    }
  }

  async getTopScores(limit: number = 20): Promise<HighScore[]> {
    try {
      this.loadLocalScores();
      return this.localScores.slice(0, limit);
    } catch (error) {
      this.connectionStatus = 'error';
      console.error('Failed to retrieve high scores:', error);
      return [];
    }
  }

  async getPlayerHighScores(playerName: string): Promise<HighScore[]> {
    try {
      this.loadLocalScores();
      this.connectionStatus = 'connected';
      return this.localScores.filter(score => score.playerName === playerName);
    } catch (error) {
      this.connectionStatus = 'error';
      console.error('Failed to retrieve player high scores:', error);
      return [];
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      this.connectionStatus = 'connected';
      return true;
    } catch {
      this.connectionStatus = 'error';
      return false;
    }
  }

  async retryConnection(): Promise<boolean> {
    return await this.isConnected();
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  subscribeToHighScoreUpdates(callback: (scores: HighScore[]) => void): () => void {
    // For local development, we'll use a simple interval to simulate real-time updates
    const interval = setInterval(() => {
      this.loadLocalScores();
      callback(this.localScores);
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }

  private loadLocalScores(): void {
    try {
      const stored = localStorage.getItem('lines-game-high-scores');
      if (stored) {
        this.localScores = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load local scores:', error);
      this.localScores = [];
    }
  }

  private saveLocalScores(): void {
    try {
      localStorage.setItem('lines-game-high-scores', JSON.stringify(this.localScores));
    } catch (error) {
      console.error('Failed to save local scores:', error);
    }
  }
} 
