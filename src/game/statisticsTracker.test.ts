import { GameStatisticsTracker } from "./statisticsTracker";
import { vi, describe, it, expect } from "vitest";

describe("GameStatisticsTracker", () => {
  it("initializes with zeroed statistics", () => {
    const tracker = new GameStatisticsTracker();
    const stats = tracker.getCurrentStatistics();
    expect(stats.turnsCount).toBe(0);
    expect(stats.gameDuration).toBe(0);
    expect(stats.ballsCleared).toBe(0);
    expect(stats.linesPopped).toBe(0);
    expect(stats.longestLinePopped).toBe(0);
    expect(stats.individualBallsPopped).toBe(0);
    expect(stats.totalScore).toBe(0);
    expect(stats.scoreProgression).toEqual([]);
    expect(stats.lineScores).toEqual([]);
    expect(stats.averageScorePerTurn).toBe(0);
    expect(stats.ballsPerTurn).toBe(0);
    expect(stats.linesPerTurn).toBe(0);
    expect(stats.peakScore).toBe(0);
    expect(stats.consecutiveHighScores).toBe(0);
    expect(stats.strategicBonus).toBe(0);
  });

  it("records turns and updates statistics", () => {
    const tracker = new GameStatisticsTracker();
    tracker.recordTurn();
    tracker.recordTurn();
    expect(tracker.getCurrentStatistics().turnsCount).toBe(2);
  });

  it("records line pops and updates statistics", () => {
    const tracker = new GameStatisticsTracker();
    tracker.recordTurn();
    tracker.recordLinePop(5, 100);
    tracker.recordLinePop(7, 300);
    const stats = tracker.getCurrentStatistics();
    expect(stats.linesPopped).toBe(2);
    expect(stats.longestLinePopped).toBe(7);
    expect(stats.individualBallsPopped).toBe(12);
    expect(stats.totalScore).toBe(400);
    expect(stats.scoreProgression).toEqual([100, 400]);
    expect(stats.lineScores.length).toBe(2);
    expect(stats.peakScore).toBe(300);
    expect(stats.consecutiveHighScores).toBe(2);
  });

  it("resets consecutiveHighScores if line < 5", () => {
    const tracker = new GameStatisticsTracker();
    tracker.recordTurn();
    tracker.recordLinePop(5, 100);
    tracker.recordLinePop(4, 50);
    expect(tracker.getCurrentStatistics().consecutiveHighScores).toBe(0);
  });

  it("records ball pops", () => {
    const tracker = new GameStatisticsTracker();
    tracker.recordBallPop();
    tracker.recordBallPop();
    expect(tracker.getCurrentStatistics().ballsCleared).toBe(2);
  });

  it("updates score", () => {
    const tracker = new GameStatisticsTracker();
    tracker.updateScore(1234);
    expect(tracker.getCurrentStatistics().totalScore).toBe(1234);
  });

  it("records and calculates game duration", () => {
    const tracker = new GameStatisticsTracker();
    const mockStartTime = 1000000;
    const mockEndTime = mockStartTime + 5000;

    // Mock Date.now to return our controlled timestamps
    const dateNowSpy = vi.spyOn(Date, "now");
    dateNowSpy.mockReturnValueOnce(mockStartTime); // For startGame
    dateNowSpy.mockReturnValueOnce(mockEndTime); // For recordGameDuration

    tracker.startGame();
    tracker.recordGameDuration();

    expect(tracker.getCurrentStatistics().gameDuration).toBe(5);

    dateNowSpy.mockRestore();
  });

  it("resets statistics", () => {
    const tracker = new GameStatisticsTracker();
    tracker.recordTurn();
    tracker.recordLinePop(5, 100);
    tracker.recordBallPop();
    tracker.reset();
    const stats = tracker.getCurrentStatistics();
    expect(stats.turnsCount).toBe(0);
    expect(stats.linesPopped).toBe(0);
    expect(stats.ballsCleared).toBe(0);
    expect(stats.totalScore).toBe(0);
  });
});
