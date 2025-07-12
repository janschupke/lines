/**
 * Migration file loader utility
 * Loads SQL migration files from the database/migrations directory
 */

export interface MigrationFile {
  path: string;
  content: string;
}

export class MigrationLoader {
  /**
   * Load a migration SQL file from the file system
   * @param filePath - The path to the migration file
   * @returns The SQL content of the migration file
   */
  static async loadMigrationFile(filePath: string): Promise<string> {
    try {
      // In a real implementation, this would use Node.js fs module
      // For now, we'll return the SQL content based on the file path
      return this.getMigrationSQL(filePath);
    } catch (error) {
      throw new Error(`Failed to load migration file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get migration SQL content based on file path
   * This is a simplified implementation that returns hardcoded SQL
   * In a real implementation, this would read from actual files
   */
  private static getMigrationSQL(filePath: string): string {
    const migrationScripts: Record<string, string> = {
      'migrations/001_create_high_scores_table.sql': `
        CREATE TABLE IF NOT EXISTS high_scores (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          player_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          game_duration INTEGER,
          balls_cleared INTEGER,
          turns_count INTEGER NOT NULL,
          individual_balls_popped INTEGER NOT NULL,
          lines_popped INTEGER NOT NULL,
          longest_line_popped INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
        CREATE INDEX IF NOT EXISTS idx_high_scores_achieved_at ON high_scores(achieved_at DESC);
        CREATE INDEX IF NOT EXISTS idx_high_scores_turns ON high_scores(turns_count DESC);
        CREATE INDEX IF NOT EXISTS idx_high_scores_lines ON high_scores(lines_popped DESC);

        ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

        CREATE POLICY IF NOT EXISTS "Allow read access" ON high_scores
          FOR SELECT USING (true);

        CREATE POLICY IF NOT EXISTS "Allow insert access" ON high_scores
          FOR INSERT WITH CHECK (true);
      `,
      'migrations/001_create_high_scores_table_down.sql': `
        DROP TABLE IF EXISTS high_scores CASCADE;
      `,

    };

    const sql = migrationScripts[filePath];
    if (!sql) {
      throw new Error(`Migration file not found: ${filePath}`);
    }

    return sql.trim();
  }

  /**
   * Validate migration file format
   * @param content - The SQL content to validate
   * @returns True if the migration content is valid
   */
  static validateMigrationContent(content: string): boolean {
    if (!content || content.trim().length === 0) {
      return false;
    }

    // Basic validation - ensure it contains SQL keywords
    const sqlKeywords = ['CREATE', 'DROP', 'ALTER', 'INSERT', 'UPDATE', 'DELETE', 'SELECT'];
    const hasSqlKeywords = sqlKeywords.some(keyword => 
      content.toUpperCase().includes(keyword)
    );

    return hasSqlKeywords;
  }

  /**
   * Get list of available migration files
   * @returns Array of migration file paths
   */
  static getAvailableMigrations(): string[] {
    return [
      'migrations/001_create_high_scores_table.sql',
      'migrations/001_create_high_scores_table_down.sql'
    ];
  }
} 
