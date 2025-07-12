export interface GameStatistics {
  turnsCount: number;
  gameDuration: number;
  ballsCleared: number;
  linesPopped: number;
  longestLinePopped: number;
  individualBallsPopped: number;
  totalScore: number;
  scoreProgression: number[];
  lineScores: LineScore[];
  averageScorePerTurn: number;
  ballsPerTurn: number;
  linesPerTurn: number;
  peakScore: number;
  consecutiveHighScores: number;
  strategicBonus: number;
}

export interface LineScore {
  length: number;
  score: number;
  turnNumber: number;
  timestamp: number;
}

export class GameStatisticsTracker {
  private statistics: GameStatistics;
  private gameStartTime: number = 0;

  constructor() {
    this.statistics = this.getInitialStatistics();
  }

  startGame(): void {
    this.statistics = this.getInitialStatistics();
    this.gameStartTime = Date.now();
  }

  endGame(): GameStatistics {
    const finalStatistics = {
      ...this.statistics,
      gameDuration: Math.floor((Date.now() - this.gameStartTime) / 1000)
    };
    finalStatistics.averageScorePerTurn = finalStatistics.totalScore / Math.max(finalStatistics.turnsCount, 1);
    finalStatistics.linesPerTurn = finalStatistics.linesPopped / Math.max(finalStatistics.turnsCount, 1);
    finalStatistics.ballsPerTurn = finalStatistics.individualBallsPopped / Math.max(finalStatistics.turnsCount, 1);
    return finalStatistics;
  }

  recordTurn(): void {
    this.statistics.turnsCount++;
  }

  recordLinePop(length: number, score: number): void {
    const lineScore: LineScore = {
      length,
      score,
      turnNumber: this.statistics.turnsCount,
      timestamp: Date.now()
    };
    this.statistics.linesPopped++;
    this.statistics.longestLinePopped = Math.max(this.statistics.longestLinePopped, length);
    this.statistics.individualBallsPopped += length;
    this.statistics.totalScore += score;
    this.statistics.scoreProgression.push(this.statistics.totalScore);
    this.statistics.lineScores.push(lineScore);
    this.statistics.peakScore = Math.max(this.statistics.peakScore, score);
    if (length >= 5) {
      this.statistics.consecutiveHighScores++;
    } else {
      this.statistics.consecutiveHighScores = 0;
    }
    const currentAverage = this.statistics.totalScore / this.statistics.turnsCount;
    this.statistics.strategicBonus = Math.floor(currentAverage * 0.1);
  }

  recordBallPop(): void {
    this.statistics.ballsCleared++;
  }

  updateScore(newScore: number): void {
    this.statistics.totalScore = newScore;
  }

  recordGameDuration(): void {
    this.statistics.gameDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);
  }

  reset(): void {
    this.startGame();
  }

  getCurrentStatistics(): GameStatistics {
    return { ...this.statistics };
  }

  private getInitialStatistics(): GameStatistics {
    return {
      turnsCount: 0,
      gameDuration: 0,
      ballsCleared: 0,
      linesPopped: 0,
      longestLinePopped: 0,
      individualBallsPopped: 0,
      totalScore: 0,
      scoreProgression: [],
      lineScores: [],
      averageScorePerTurn: 0,
      ballsPerTurn: 0,
      linesPerTurn: 0,
      peakScore: 0,
      consecutiveHighScores: 0,
      strategicBonus: 0
    };
  }
} 
