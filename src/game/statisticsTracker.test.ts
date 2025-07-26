import { StatisticsTracker } from "./statisticsTracker";
import { vi, describe, it, expect } from "vitest";

describe("StatisticsTracker", () => {
  it("initializes with zeroed statistics", () => {
    const tracker = new StatisticsTracker();
    const stats = tracker.getCurrentStatistics();
    expect(stats.turnsCount).toBe(0);
    expect(stats.gameDuration).toBe(0);
    expect(stats.linesPopped).toBe(0);
    expect(stats.individualBallsPopped).toBe(0);
    expect(stats.longestLinePopped).toBe(0);
    expect(stats.averageScorePerTurn).toBe(0);
    expect(stats.totalScore).toBe(0);
    expect(stats.scoreProgression).toEqual([]);
    expect(stats.lineScores).toEqual([]);
    expect(stats.peakScore).toBe(0);
    expect(stats.consecutiveHighScores).toBe(0);
    expect(stats.ballsCleared).toBe(0);
  });

  it("records turns and updates statistics", () => {
    const tracker = new StatisticsTracker();
    tracker.recordTurn();
    tracker.recordTurn();
    expect(tracker.getCurrentStatistics().turnsCount).toBe(2);
  });

  it("records line pops and updates statistics", () => {
    const tracker = new StatisticsTracker();
    tracker.recordTurn();
    tracker.recordLinePop(5, 100);
    tracker.recordLinePop(7, 300);
    const stats = tracker.getCurrentStatistics();
    expect(stats.linesPopped).toBe(2);
    expect(stats.individualBallsPopped).toBe(12);
    expect(stats.scoreProgression).toEqual([100, 300]);
    expect(stats.lineScores.length).toBe(2);
    expect(stats.peakScore).toBe(300);
    expect(stats.consecutiveHighScores).toBe(0);
  });

  it("resets consecutiveHighScores if line < 5", () => {
    const tracker = new StatisticsTracker();
    tracker.recordTurn();
    tracker.recordLinePop(5, 100);
    tracker.recordLinePop(4, 50);
    expect(tracker.getCurrentStatistics().consecutiveHighScores).toBe(0);
  });

  it("records ball pops", () => {
    const tracker = new StatisticsTracker();
    tracker.recordBallClear();
    tracker.recordBallClear();
    expect(tracker.getCurrentStatistics().ballsCleared).toBe(2);
  });

  it("updates score", () => {
    const tracker = new StatisticsTracker();
    tracker.updateScore(1234);
    expect(tracker.getCurrentStatistics().totalScore).toBe(1234);
  });

  it("records and calculates game duration", () => {
    const mockStartTime = 1000000;
    const mockEndTime = mockStartTime + 5000;
    
    // Mock Date.now to control timing
    const originalNow = Date.now;
    Date.now = vi.fn(() => mockStartTime);
    
    const tracker2 = new StatisticsTracker();
    Date.now = vi.fn(() => mockEndTime);
    
    expect(tracker2.getGameDuration()).toBe(5);
    
    // Restore original Date.now
    Date.now = originalNow;
  });

  it("resets statistics", () => {
    const tracker = new StatisticsTracker();
    tracker.recordTurn();
    tracker.recordLinePop(5, 100);
    tracker.updateScore(100);
    tracker.recordBallClear();
    
    tracker.reset();
    
    const stats = tracker.getCurrentStatistics();
    expect(stats.turnsCount).toBe(0);
    expect(stats.linesPopped).toBe(0);
    expect(stats.totalScore).toBe(0);
    expect(stats.ballsCleared).toBe(0);
  });
});
