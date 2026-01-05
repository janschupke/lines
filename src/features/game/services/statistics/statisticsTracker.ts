export interface GameStatistics {
  turnsCount: number;
  linesPopped: number;
  longestLinePopped: number;
}

export class StatisticsTracker {
  private gameStartTime: number;
  private statistics: GameStatistics;

  constructor() {
    this.gameStartTime = Date.now();
    this.statistics = {
      turnsCount: 0,
      linesPopped: 0,
      longestLinePopped: 0,
    };
  }

  getCurrentStatistics(): GameStatistics {
    return {
      ...this.statistics,
    };
  }

  recordTurn() {
    this.statistics.turnsCount++;
  }

  recordLinePop(lineLength: number) {
    if (lineLength >= 5) {
      this.statistics.linesPopped++;
      this.statistics.longestLinePopped = Math.max(
        this.statistics.longestLinePopped,
        lineLength,
      );
    }
  }

  getGameDuration(): number {
    return Math.floor((Date.now() - this.gameStartTime) / 1000);
  }

  reset() {
    this.gameStartTime = Date.now();
    this.statistics = {
      turnsCount: 0,
      linesPopped: 0,
      longestLinePopped: 0,
    };
  }

  loadStatistics(statistics: GameStatistics) {
    this.statistics = { ...statistics };
  }
}
