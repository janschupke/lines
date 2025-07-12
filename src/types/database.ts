/**
 * Database-specific types that match the database schema
 * These use snake_case to match the database column names
 */

export interface DatabaseHighScore {
  id?: string;
  player_name: string;
  score: number;
  achieved_at: Date;
  game_duration?: number | null;
  balls_cleared?: number | null;
  turns_count: number;
  individual_balls_popped: number;
  lines_popped: number;
  longest_line_popped: number;
}

export interface DatabaseHighScoreSubmission {
  player_name: string;
  score: number;
  game_duration?: number;
  balls_cleared?: number;
  turns_count: number;
  individual_balls_popped: number;
  lines_popped: number;
  longest_line_popped: number;
} 
