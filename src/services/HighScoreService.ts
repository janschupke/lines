import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseToHighScore } from "../types/mappers";
import { sanitizePlayerName } from "../utils/sanitization";

export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error";

export interface HighScore {
  id?: string;
  playerName: string;
  score: number;
  achievedAt: Date;
  gameDuration: number;
  ballsCleared: number;
  turnsCount: number;
  individualBallsPopped: number;
  linesPopped: number;
  longestLinePopped: number;
}

export class HighScoreService {
  private supabase: SupabaseClient;
  private connectionStatus: ConnectionStatus = "disconnected";

  constructor() {
      const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables not configured");
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveHighScore(score: HighScore): Promise<boolean> {
    try {
      this.connectionStatus = "connecting";
      const topScores = await this.getTopScores(20);
      const qualifies =
        topScores.length < 20 ||
        score.score > topScores[topScores.length - 1]?.score;
      if (!qualifies) return false;
      const { error } = await this.supabase.from("high_scores").insert({
        player_name: this.sanitizePlayerName(score.playerName),
        score: score.score,
        achieved_at: score.achievedAt.toISOString(),
        game_duration: score.gameDuration,
        balls_cleared: score.ballsCleared,
        turns_count: score.turnsCount,
        individual_balls_popped: score.individualBallsPopped,
        lines_popped: score.linesPopped,
        longest_line_popped: score.longestLinePopped,
      });
      if (error) throw error;
      this.connectionStatus = "connected";
      return true;
    } catch (error) {
      this.connectionStatus = "error";
      console.error("Failed to save high score:", error);
      return false;
    }
  }

  async getTopScores(limit: number = 20): Promise<HighScore[]> {
    try {
      this.connectionStatus = "connecting";
      const { data, error } = await this.supabase
        .from("high_scores")
        .select("*")
        .order("score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      this.connectionStatus = "connected";
      return (data || []).map((row) => mapDatabaseToHighScore(row));
    } catch (error) {
      this.connectionStatus = "error";
      console.error("Failed to retrieve high scores:", error);
      return [];
    }
  }

  async getPlayerHighScores(playerName: string): Promise<HighScore[]> {
    try {
      this.connectionStatus = "connecting";
      const { data, error } = await this.supabase
        .from("high_scores")
        .select("*")
        .eq("player_name", playerName)
        .order("score", { ascending: false });
      if (error) throw error;
      this.connectionStatus = "connected";
      return (data || []).map((row) => mapDatabaseToHighScore(row));
    } catch (error) {
      this.connectionStatus = "error";
      console.error("Failed to retrieve player high scores:", error);
      return [];
    }
  }

  subscribeToHighScoreUpdates(
    callback: (scores: HighScore[]) => void,
  ): () => void {
    const subscription = this.supabase
      .channel("high_scores_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "high_scores" },
        async () => {
          try {
            const scores = await this.getTopScores(10);
            callback(scores);
          } catch (error) {
            console.error("Error in high score subscription:", error);
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async isConnected(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("high_scores")
        .select("*", { count: "exact", head: true })
        .limit(1);
      this.connectionStatus = error ? "error" : "connected";
      return !error;
    } catch {
      this.connectionStatus = "error";
      return false;
    }
  }

  async retryConnection(): Promise<boolean> {
    return await this.isConnected();
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  private sanitizePlayerName(name: string): string {
    return sanitizePlayerName(name);
  }
}
