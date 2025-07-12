interface GameConfig {
  highScores: HighScore[];
  showHighScores: boolean;
  maxHighScores: number;
  autoSave: boolean;
  currentSessionScore?: number;
  currentSessionDate?: string;
  currentSessionGameTime?: number;
}

interface HighScore {
  score: number;
  date: Date;
  gameTime?: number;
  playerName?: string;
  turnsCount?: number;
  ballsCleared?: number;
  linesPopped?: number;
  longestLinePopped?: number;
  individualBallsPopped?: number;
}

const DEFAULT_CONFIG: GameConfig = {
  highScores: [],
  showHighScores: true,
  maxHighScores: 10,
  autoSave: true,
  currentSessionScore: 0,
  currentSessionDate: new Date().toISOString(),
};

const STORAGE_KEY = 'lines-game-config';
const CONFIG_VERSION = '1.0.0';

class ConfigManager {
  private static instance: ConfigManager;
  private config: GameConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): GameConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and migrate config if needed
        return this.validateAndMigrateConfig(parsed);
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }
    return { ...DEFAULT_CONFIG };
  }

  private validateAndMigrateConfig(parsed: unknown): GameConfig {
    // Basic validation and migration logic
    const parsedObj = parsed as Partial<GameConfig>;
    const config = { ...DEFAULT_CONFIG, ...parsedObj };
    
    // Ensure highScores is an array of valid HighScore objects
    if (!Array.isArray(config.highScores)) {
      config.highScores = [];
    } else {
      config.highScores = config.highScores
        .filter((score: unknown) => {
          const s = score as { score?: number; date?: string };
          return s && typeof s.score === 'number' && s.date;
        })
        .map((score: unknown) => {
          const s = score as { score: number; date: string; gameTime?: number };
          return {
            score: s.score,
            date: new Date(s.date),
            gameTime: s.gameTime
          };
        });
    }

    return config;
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...this.config,
        version: CONFIG_VERSION
      }));
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<GameConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getHighScores(): HighScore[] {
    return [...this.config.highScores].sort((a, b) => b.score - a.score);
  }

  addHighScore(score: number, gameTime?: number, playerName?: string, statistics?: {
    turnsCount?: number;
    ballsCleared?: number;
    linesPopped?: number;
    longestLinePopped?: number;
    individualBallsPopped?: number;
  }): boolean {
    const currentScores = this.getHighScores();
    const currentSessionScore = this.config.currentSessionScore || 0;
    
    // Check if this is a new session (different date)
    const today = new Date().toDateString();
    const sessionDate = this.config.currentSessionDate ? new Date(this.config.currentSessionDate).toDateString() : null;
    const isNewSession = sessionDate !== today;
    
    let shouldUpdate = false;
    let updatedScores = [...currentScores];
    
    if (isNewSession) {
      // New session: add current session score to high scores if it's high enough
      if (currentSessionScore > 0) {
        const sessionScore: HighScore = {
          score: currentSessionScore,
          date: new Date(this.config.currentSessionDate || new Date()),
          gameTime: this.config.currentSessionGameTime,
          playerName: playerName || 'Anonymous',
          ...statistics
        };
        
        const isSessionScoreHighEnough = currentScores.length < this.config.maxHighScores || 
                                       currentSessionScore > currentScores[currentScores.length - 1].score;
        
        if (isSessionScoreHighEnough) {
          updatedScores = [...currentScores, sessionScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, this.config.maxHighScores);
          shouldUpdate = true;
        }
      }
      
      // Start new session
      this.updateConfig({ 
        currentSessionScore: score,
        currentSessionDate: new Date().toISOString(),
        currentSessionGameTime: gameTime,
        highScores: shouldUpdate ? updatedScores : this.config.highScores
      });
      return shouldUpdate;
    } else {
      // Same session: update current session score if higher
      if (score > currentSessionScore) {
        this.updateConfig({ 
          currentSessionScore: score,
          currentSessionGameTime: gameTime
        });
        return true;
      }
    }

    return false;
  }

  getCurrentHighScore(): number {
    const scores = this.getHighScores();
    const currentSessionScore = this.config.currentSessionScore || 0;
    const highestStoredScore = scores.length > 0 ? scores[0].score : 0;
    return Math.max(highestStoredScore, currentSessionScore);
  }

  isHighScore(score: number): boolean {
    const currentHigh = this.getCurrentHighScore();
    const currentSessionScore = this.config.currentSessionScore || 0;
    
    // Check if this is a new session (different date)
    const today = new Date().toDateString();
    const sessionDate = this.config.currentSessionDate ? new Date(this.config.currentSessionDate).toDateString() : null;
    const isNewSession = sessionDate !== today;
    
    if (isNewSession) {
      // New session: compare against stored high scores
      return score > currentHigh;
    } else {
      // Same session: compare against current session score
      return score > currentSessionScore;
    }
  }

  clearHighScores(): void {
    this.updateConfig({ highScores: [] });
  }
}

export default ConfigManager;
export type { GameConfig, HighScore }; 
