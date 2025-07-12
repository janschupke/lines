import { SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseHighScore } from "../types/database";

export interface MigrationProgress {
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  currentStep: string;
  isComplete: boolean;
}

export class HighScoreMigrationService {
  private supabase: SupabaseClient;
  private localStorageKey = "lines-game-high-scores";

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async migrateFromLocalStorage(): Promise<MigrationProgress> {
    const progress: MigrationProgress = {
      totalRecords: 0,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      currentStep: "Starting migration...",
      isComplete: false,
    };

    try {
      // Check if migration is needed
      if (!this.hasLocalStorageData()) {
        progress.currentStep = "No local data to migrate";
        progress.isComplete = true;
        return progress;
      }

      // Load local data
      progress.currentStep = "Loading local data...";
      const localScores = this.loadLocalScores();
      progress.totalRecords = localScores.length;

      // Validate local data
      progress.currentStep = "Validating local data...";
      const validScores = this.validateLocalScores(localScores);
      progress.processedRecords = validScores.length;

      // Migrate to database
      progress.currentStep = "Migrating to database...";
      const migrationResults = await this.migrateScoresToDatabase(validScores);

      progress.successCount = migrationResults.successCount;
      progress.errorCount = migrationResults.errorCount;

      // Clean up local data if migration successful
      if (progress.errorCount === 0) {
        progress.currentStep = "Cleaning up local data...";
        this.cleanupLocalData();
      }

      progress.currentStep = "Migration completed";
      progress.isComplete = true;

      return progress;
    } catch (error) {
      progress.currentStep = `Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      progress.isComplete = true;
      throw error;
    }
  }

  private hasLocalStorageData(): boolean {
    try {
      const localData = localStorage.getItem(this.localStorageKey);
      return !!localData;
    } catch (error) {
      console.warn("Error checking local storage:", error);
      return false;
    }
  }

  private loadLocalScores(): unknown[] {
    try {
      const localData = localStorage.getItem(this.localStorageKey);
      if (!localData) return [];

      const parsedData = JSON.parse(localData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error("Error loading local scores:", error);
      return [];
    }
  }

  private validateLocalScores(scores: unknown[]): DatabaseHighScore[] {
    return scores
      .filter((score): score is Record<string, unknown> => {
        return (
          Boolean(score) &&
          typeof score === "object" &&
          score !== null &&
          "player_name" in score &&
          "score" in score &&
          "turns_count" in score &&
          "individual_balls_popped" in score &&
          "lines_popped" in score &&
          "longest_line_popped" in score &&
          typeof score.player_name === "string" &&
          typeof score.score === "number" &&
          typeof score.turns_count === "number" &&
          typeof score.individual_balls_popped === "number" &&
          typeof score.lines_popped === "number" &&
          typeof score.longest_line_popped === "number" &&
          (score.player_name as string).trim().length > 0 &&
          (score.score as number) > 0
        );
      })
      .map((score) => ({
        player_name: (score.player_name as string).trim(),
        score: Math.floor(score.score as number),
        achieved_at: score.achieved_at
          ? new Date(score.achieved_at as string)
          : new Date(),
        game_duration: (score.game_duration as number) || null,
        balls_cleared: (score.balls_cleared as number) || null,
        turns_count: Math.floor(score.turns_count as number),
        individual_balls_popped: Math.floor(
          score.individual_balls_popped as number,
        ),
        lines_popped: Math.floor(score.lines_popped as number),
        longest_line_popped: Math.floor(score.longest_line_popped as number),
      }));
  }

  private async migrateScoresToDatabase(
    scores: DatabaseHighScore[],
  ): Promise<{ successCount: number; errorCount: number }> {
    let successCount = 0;
    let errorCount = 0;

    for (const score of scores) {
      try {
        const { error } = await this.supabase.from("high_scores").insert(score);

        if (error) {
          console.error("Error migrating score:", error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error("Error migrating score:", error);
        errorCount++;
      }
    }

    return { successCount, errorCount };
  }

  private cleanupLocalData(): void {
    try {
      localStorage.removeItem(this.localStorageKey);
      console.log("Local storage data cleaned up successfully");
    } catch (error) {
      console.warn("Error cleaning up local storage:", error);
    }
  }
}
