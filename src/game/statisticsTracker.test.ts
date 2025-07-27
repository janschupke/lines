import { describe, it, expect, beforeEach } from "vitest";
import { StatisticsTracker } from "./statisticsTracker";

describe("StatisticsTracker", () => {
  let tracker: StatisticsTracker;

  beforeEach(() => {
    tracker = new StatisticsTracker();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const stats = tracker.getCurrentStatistics();
      expect(stats.turnsCount).toBe(0);
      expect(stats.gameDuration).toBeGreaterThanOrEqual(0);
      expect(stats.linesPopped).toBe(0);
      expect(stats.longestLinePopped).toBe(0);
    });
  });

  describe("recordTurn", () => {
    it("should increment turn count", () => {
      tracker.recordTurn();
      expect(tracker.getCurrentStatistics().turnsCount).toBe(1);

      tracker.recordTurn();
      expect(tracker.getCurrentStatistics().turnsCount).toBe(2);
    });
  });

  describe("recordLinePop", () => {
    it("should track line pops correctly", () => {
      tracker.recordLinePop(5);
      tracker.recordLinePop(7);

      const stats = tracker.getCurrentStatistics();
      expect(stats.linesPopped).toBe(2);
      expect(stats.longestLinePopped).toBe(7);
    });

    it("should not count lines shorter than 5", () => {
      tracker.recordLinePop(5);
      tracker.recordLinePop(4);

      const stats = tracker.getCurrentStatistics();
      expect(stats.linesPopped).toBe(1);
      expect(stats.longestLinePopped).toBe(5);
    });

    it("should update longest line correctly", () => {
      tracker.recordLinePop(5);
      tracker.recordLinePop(7);
      tracker.recordLinePop(6);

      const stats = tracker.getCurrentStatistics();
      expect(stats.linesPopped).toBe(3);
      expect(stats.longestLinePopped).toBe(7);
    });
  });

  describe("reset", () => {
    it("should reset all statistics", () => {
      tracker.recordTurn();
      tracker.recordLinePop(5);
      tracker.recordLinePop(7);

      tracker.reset();

      const stats = tracker.getCurrentStatistics();
      expect(stats.turnsCount).toBe(0);
      expect(stats.linesPopped).toBe(0);
      expect(stats.longestLinePopped).toBe(0);
    });
  });

  describe("loadStatistics", () => {
    it("should load statistics correctly", () => {
      const testStats = {
        turnsCount: 10,
        gameDuration: 300,
        linesPopped: 5,
        longestLinePopped: 8,
      };

      tracker.loadStatistics(testStats);

      const stats = tracker.getCurrentStatistics();
      expect(stats.turnsCount).toBe(10);
      expect(stats.linesPopped).toBe(5);
      expect(stats.longestLinePopped).toBe(8);
    });
  });

  describe("getGameDuration", () => {
    it("should return game duration in seconds", () => {
      const duration = tracker.getGameDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });
});
