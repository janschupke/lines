import ConfigManager from './configManager';
import type { HighScore } from './configManager';

class HighScoreManager {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  getHighScores(): HighScore[] {
    return this.configManager.getHighScores();
  }

  getCurrentHighScore(): number {
    return this.configManager.getCurrentHighScore();
  }

  isNewHighScore(score: number): boolean {
    return this.configManager.isHighScore(score);
  }

  addHighScore(score: number, gameTime?: number): boolean {
    return this.configManager.addHighScore(score, gameTime);
  }

  getHighScoreDisplay(): { current: number; isNew: boolean } {
    return {
      current: this.getCurrentHighScore(),
      isNew: false // Will be set by game logic
    };
  }

  getConfig() {
    return this.configManager.getConfig();
  }
}

export default HighScoreManager; 
