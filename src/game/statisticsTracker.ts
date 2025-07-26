export interface GameStatistics {
  turnsCount: number;
  gameDuration: number;
  linesPopped: number;
  individualBallsPopped: number;
  longestLinePopped: number;
  averageScorePerTurn: number;
  totalScore: number;
  scoreProgression: number[];
  lineScores: number[];
  peakScore: number;
  consecutiveHighScores: number;
  ballsCleared: number;
}

export class StatisticsTracker {
  private gameStartTime: number;
  private statistics: GameStatistics;

  constructor() {
    this.gameStartTime = Date.now();
    this.statistics = {
      turnsCount: 0,
      gameDuration: 0,
      linesPopped: 0,
      individualBallsPopped: 0,
      longestLinePopped: 0,
      averageScorePerTurn: 0,
      totalScore: 0,
      scoreProgression: [],
      lineScores: [],
      peakScore: 0,
      consecutiveHighScores: 0,
      ballsCleared: 0,
    };
  }

  getCurrentStatistics(): GameStatistics {
    const finalStatistics = {
      ...this.statistics,
      gameDuration: Math.floor((Date.now() - this.gameStartTime) / 1000),
    };

    finalStatistics.averageScorePerTurn =
      finalStatistics.totalScore / Math.max(finalStatistics.turnsCount, 1);

    return finalStatistics;
  }

  recordTurn() {
    this.statistics.turnsCount++;
  }

  recordLinePop(lineLength: number, score: number) {
    if (lineLength >= 5) {
      this.statistics.linesPopped++;
      this.statistics.individualBallsPopped += lineLength;
      this.statistics.longestLinePopped = Math.max(
        this.statistics.longestLinePopped,
        lineLength,
      );
      this.statistics.lineScores.push(score);
      this.statistics.scoreProgression.push(score);
      this.statistics.peakScore = Math.max(this.statistics.peakScore, score);
    }
  }

  updateScore(newScore: number) {
    const previousPeakScore = this.statistics.peakScore;
    this.statistics.totalScore = newScore;
    this.statistics.peakScore = Math.max(this.statistics.peakScore, newScore);

    // Track consecutive high scores
    if (newScore > previousPeakScore) {
      this.statistics.consecutiveHighScores++;
    } else {
      this.statistics.consecutiveHighScores = 0;
    }
  }

  recordBallClear() {
    this.statistics.ballsCleared++;
  }

  getGameDuration(): number {
    return Math.floor(
      (Date.now() - this.gameStartTime) / 1000,
    );
  }

  reset() {
    this.gameStartTime = Date.now();
    this.statistics = {
      turnsCount: 0,
      gameDuration: 0,
      linesPopped: 0,
      individualBallsPopped: 0,
      longestLinePopped: 0,
      averageScorePerTurn: 0,
      totalScore: 0,
      scoreProgression: [],
      lineScores: [],
      peakScore: 0,
      consecutiveHighScores: 0,
      ballsCleared: 0,
    };
  }

  loadStatistics(statistics: GameStatistics) {
    this.statistics = { ...statistics };
    // Adjust game start time based on saved duration
    this.gameStartTime = Date.now() - (statistics.gameDuration * 1000);
  }
}
