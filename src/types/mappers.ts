import type { DatabaseHighScore } from "./database";
import type { HighScore } from "../services/HighScoreService";

/**
 * Mappers for converting between database and application interfaces
 */

export function mapDatabaseToHighScore(dbScore: DatabaseHighScore): HighScore {
  return {
    id: dbScore.id,
    playerName: dbScore.player_name,
    score: dbScore.score,
    achievedAt: dbScore.achieved_at,
    gameDuration: dbScore.game_duration || 0,
    ballsCleared: dbScore.balls_cleared || 0,
    turnsCount: dbScore.turns_count,
    individualBallsPopped: dbScore.individual_balls_popped,
    linesPopped: dbScore.lines_popped,
    longestLinePopped: dbScore.longest_line_popped,
  };
}

export function mapHighScoreToDatabase(appScore: HighScore): DatabaseHighScore {
  return {
    id: appScore.id,
    player_name: appScore.playerName,
    score: appScore.score,
    achieved_at: appScore.achievedAt,
    game_duration: appScore.gameDuration,
    balls_cleared: appScore.ballsCleared,
    turns_count: appScore.turnsCount,
    individual_balls_popped: appScore.individualBallsPopped,
    lines_popped: appScore.linesPopped,
    longest_line_popped: appScore.longestLinePopped,
  };
}
