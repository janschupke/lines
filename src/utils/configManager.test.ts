import { describe, it, expect, beforeEach, vi } from "vitest";
import ConfigManager from "./configManager";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("ConfigManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance
    (ConfigManager as unknown as { instance?: ConfigManager }).instance =
      undefined;
  });

  it("should create singleton instance", () => {
    const instance1 = ConfigManager.getInstance();
    const instance2 = ConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should load default config when localStorage is empty", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const config = ConfigManager.getInstance().getConfig();
    expect(config.highScores).toEqual([]);
    expect(config.showHighScores).toBe(true);
  });

  it("should load config from localStorage", () => {
    const mockConfig = {
      highScores: [{ score: 100, date: new Date().toISOString() }],
      showHighScores: false,
      maxHighScores: 5,
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConfig));

    const config = ConfigManager.getInstance().getConfig();
    expect(config.highScores).toHaveLength(1);
    expect(config.showHighScores).toBe(false);
  });

  it("should add high score when score is higher in new session", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const manager = ConfigManager.getInstance();

    // Simulate a new session by setting yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    (
      manager as unknown as {
        config: { currentSessionDate: string; currentSessionScore: number };
      }
    ).config.currentSessionDate = yesterday.toISOString();
    (
      manager as unknown as { config: { currentSessionScore: number } }
    ).config.currentSessionScore = 50;

    const result = manager.addHighScore(100);
    expect(result).toBe(true);

    const scores = manager.getHighScores();
    expect(scores).toHaveLength(1);
    expect(scores[0].score).toBe(50); // Previous session score gets added
  });

  it("should update session score when higher in same session", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const manager = ConfigManager.getInstance();

    // First score in session
    const result1 = manager.addHighScore(50);
    expect(result1).toBe(true);

    // Higher score in same session
    const result2 = manager.addHighScore(75);
    expect(result2).toBe(true);

    // Lower score in same session
    const result3 = manager.addHighScore(25);
    expect(result3).toBe(false);

    // Check that high scores list is still empty (session score not added yet)
    const scores = manager.getHighScores();
    expect(scores).toHaveLength(0);
  });

  it("should not add high score when score is lower and list is full", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const manager = ConfigManager.getInstance();

    // Directly populate the high scores list to test the full list scenario
    const mockHighScores = Array.from({ length: 10 }, (_, i) => ({
      score: 100 - i * 10,
      date: new Date(),
      gameTime: 0,
    }));

    // Set the config directly and set current session to today
    (
      manager as unknown as {
        config: {
          highScores: typeof mockHighScores;
          currentSessionDate: string;
          currentSessionScore: number;
        };
      }
    ).config.highScores = mockHighScores;
    (
      manager as unknown as {
        config: { currentSessionDate: string; currentSessionScore: number };
      }
    ).config.currentSessionDate = new Date().toISOString();
    (
      manager as unknown as { config: { currentSessionScore: number } }
    ).config.currentSessionScore = 50;

    // Try to add a lower score
    const result = manager.addHighScore(5);

    expect(result).toBe(false);
    const scores = manager.getHighScores();
    expect(scores).toHaveLength(10);
    expect(scores[0].score).toBe(100);
    expect(scores[9].score).toBe(10);
  });

  it("should handle localStorage errors gracefully", () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error("Quota exceeded");
    });

    const manager = ConfigManager.getInstance();
    const result = manager.addHighScore(100);

    // Should not throw error
    expect(result).toBe(true);
  });
});
