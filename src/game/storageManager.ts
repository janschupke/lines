import type { GameState, Cell, BallColor } from "./types";
import { HIGH_SCORE_STORAGE_KEY } from "./config";

// Storage key for the complete game state
const GAME_STATE_STORAGE_KEY = "lines-game-state";

// Interface for the persisted game state (simplified version of GameState)
export interface PersistedGameState {
  board: Cell[][];
  score: number;
  highScore: number;
  nextBalls: BallColor[];
  timer: number;
  timerActive: boolean;
  gameOver: boolean;
  statistics: {
    turnsCount: number;
    linesPopped: number;
    longestLinePopped: number;
  };
}

export class StorageManager {
  /**
   * Save the complete game state to localStorage
   */
  static saveGameState(gameState: GameState): void {
    try {
      // Update high score if current score is higher
      const updatedHighScore = gameState.isNewHighScore
        ? gameState.score
        : gameState.highScore;

      const persistedState: PersistedGameState = {
        board: gameState.board,
        score: gameState.score,
        highScore: updatedHighScore,
        nextBalls: gameState.nextBalls,
        timer: gameState.timer,
        timerActive: gameState.timerActive,
        gameOver: gameState.gameOver,
        statistics: gameState.statistics,
      };

      localStorage.setItem(
        GAME_STATE_STORAGE_KEY,
        JSON.stringify(persistedState),
      );
    } catch (error) {
      console.warn("Failed to save game state to localStorage:", error);
    }
  }

  /**
   * Load the game state from localStorage
   */
  static loadGameState(): PersistedGameState | null {
    try {
      const stored = localStorage.getItem(GAME_STATE_STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);

      // Validate the structure
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.board) &&
        typeof parsed.score === "number" &&
        Array.isArray(parsed.nextBalls) &&
        typeof parsed.timer === "number" &&
        typeof parsed.gameOver === "boolean" &&
        parsed.statistics &&
        typeof parsed.statistics === "object"
      ) {
        // Handle legacy saved states that don't have timerActive or highScore
        const result = parsed as PersistedGameState;
        if (typeof result.timerActive !== "boolean") {
          result.timerActive = false; // Default to false for legacy states
        }
        if (typeof result.highScore !== "number") {
          // For legacy states without highScore, try to load from separate storage
          result.highScore = this.loadHighScore();
        }
        return result;
      }

      console.warn("Invalid game state structure in localStorage");
      return null;
    } catch (error) {
      console.warn("Failed to load game state from localStorage:", error);
      return null;
    }
  }

  /**
   * Clear the saved game state
   */
  static clearGameState(): void {
    try {
      localStorage.removeItem(GAME_STATE_STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear game state from localStorage:", error);
    }
  }

  /**
   * Check if a saved game state exists
   */
  static hasSavedGameState(): boolean {
    try {
      return localStorage.getItem(GAME_STATE_STORAGE_KEY) !== null;
    } catch (error) {
      console.warn("Failed to check for saved game state:", error);
      return false;
    }
  }

  /**
   * Save high score to localStorage
   */
  static saveHighScore(score: number): void {
    try {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, score.toString());
    } catch (error) {
      console.warn("Failed to save high score to localStorage:", error);
    }
  }

  /**
   * Load high score from localStorage
   */
  static loadHighScore(): number {
    try {
      const stored = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      if (stored) {
        const score = parseInt(stored, 10);
        if (!isNaN(score)) {
          return score;
        }
      }
    } catch (error) {
      console.warn("Failed to load high score from localStorage:", error);
    }
    return 0;
  }
}
