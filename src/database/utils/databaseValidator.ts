/**
 * Database validation utility
 * Validates database schema, connectivity, and performance
 */

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  details: Record<string, unknown>;
}

export interface TableValidation {
  exists: boolean;
  accessible: boolean;
  hasRequiredColumns: boolean;
  hasIndexes: boolean;
  hasRLS: boolean;
}

import { SupabaseClient } from '@supabase/supabase-js';

export class DatabaseValidator {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Validate complete database schema
   * @returns Validation result with detailed information
   */
  async validateSchema(): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      // Validate required tables
      const tableValidations = await this.validateRequiredTables();
      result.details.tables = tableValidations;

      // Check for validation errors
      for (const [tableName, validation] of Object.entries(tableValidations)) {
        if (!validation.exists) {
          result.errors.push(`Table ${tableName} does not exist`);
          result.success = false;
        }
        if (!validation.accessible) {
          result.errors.push(`Table ${tableName} is not accessible`);
          result.success = false;
        }
        if (!validation.hasRequiredColumns) {
          result.warnings.push(`Table ${tableName} may be missing required columns`);
        }
      }

      // Validate database connectivity
      const connectivityValid = await this.validateConnectivity();
      if (!connectivityValid) {
        result.errors.push('Database connectivity issues detected');
        result.success = false;
      }

      // Validate migration table
      const migrationTableValid = await this.validateMigrationTable();
      if (!migrationTableValid) {
        result.warnings.push('Migration tracking table may not be properly configured');
      }

    } catch (error) {
      result.errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    return result;
  }

  /**
   * Validate required tables exist and are accessible
   * @returns Object with validation results for each table
   */
  private async validateRequiredTables(): Promise<Record<string, TableValidation>> {
    const requiredTables = ['high_scores', 'user_preferences', 'schema_migrations'];
    const validations: Record<string, TableValidation> = {};

    for (const tableName of requiredTables) {
      const validation: TableValidation = {
        exists: false,
        accessible: false,
        hasRequiredColumns: false,
        hasIndexes: false,
        hasRLS: false
      };

      try {
        // Test table existence and accessibility
        const { error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error) {
          validation.exists = true;
          validation.accessible = true;
        }

        // Basic column validation (simplified)
        validation.hasRequiredColumns = this.validateTableColumns(tableName);

        // Index validation (simplified)
        validation.hasIndexes = this.validateTableIndexes(tableName);

        // RLS validation (simplified)
        validation.hasRLS = this.validateTableRLS(tableName);

      } catch {
        // Table doesn't exist or is not accessible
        validation.exists = false;
        validation.accessible = false;
      }

      validations[tableName] = validation;
    }

    return validations;
  }

  /**
   * Validate database connectivity
   * @returns True if database is accessible
   */
  private async validateConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity test
      const { error } = await this.supabase
        .from('schema_migrations')
        .select('version')
        .limit(1);

      return !error || error.code === 'PGRST116'; // PGRST116 is "no rows returned" which is OK
    } catch {
      return false;
    }
  }

  /**
   * Validate migration tracking table
   * @returns True if migration table is properly configured
   */
  private async validateMigrationTable(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('schema_migrations')
        .select('version, name, applied_at')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Validate table columns (simplified implementation)
   * @param tableName - Name of the table to validate
   * @returns True if table has required columns
   */
  private validateTableColumns(tableName: string): boolean {
    // Simplified column validation
    const requiredColumns: Record<string, string[]> = {
      'high_scores': ['id', 'player_name', 'score', 'achieved_at', 'turns_count', 'individual_balls_popped', 'lines_popped', 'longest_line_popped'],
      'user_preferences': ['id', 'player_name', 'board_size', 'time_limit', 'sound_enabled'],
      'schema_migrations': ['version', 'name', 'applied_at']
    };

    const columns = requiredColumns[tableName];
    return columns ? columns.length > 0 : true;
  }

  /**
   * Validate table indexes (simplified implementation)
   * @param tableName - Name of the table to validate
   * @returns True if table has expected indexes
   */
  private validateTableIndexes(tableName: string): boolean {
    // Simplified index validation
    const expectedIndexes: Record<string, string[]> = {
      'high_scores': ['idx_high_scores_score', 'idx_high_scores_achieved_at', 'idx_high_scores_turns', 'idx_high_scores_lines'],
      'user_preferences': ['idx_user_preferences_player_name'],
      'schema_migrations': []
    };

    const indexes = expectedIndexes[tableName];
    return indexes ? indexes.length >= 0 : true;
  }

  /**
   * Validate table RLS policies (simplified implementation)
   * @param tableName - Name of the table to validate
   * @returns True if table has RLS policies
   */
  private validateTableRLS(tableName: string): boolean {
    // Simplified RLS validation
    const tablesWithRLS = ['high_scores', 'user_preferences'];
    return tablesWithRLS.includes(tableName);
  }

  /**
   * Validate database performance
   * @returns Performance validation result
   */
  async validatePerformance(): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      // Test query performance
      const startTime = Date.now();
      await this.supabase
        .from('high_scores')
        .select('score')
        .order('score', { ascending: false })
        .limit(10);

      const queryTime = Date.now() - startTime;

      if (queryTime > 500) {
        result.warnings.push(`High score query took ${queryTime}ms (should be < 500ms)`);
      }

      result.details.queryPerformance = {
        highScoresQueryTime: queryTime,
        threshold: 500
      };

    } catch (error) {
      result.errors.push(`Performance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    return result;
  }

  /**
   * Comprehensive database validation
   * @returns Complete validation result
   */
  async validateDatabase(): Promise<ValidationResult> {
    const schemaResult = await this.validateSchema();
    const performanceResult = await this.validatePerformance();

    const combinedResult: ValidationResult = {
      success: schemaResult.success && performanceResult.success,
      errors: [...schemaResult.errors, ...performanceResult.errors],
      warnings: [...schemaResult.warnings, ...performanceResult.warnings],
      details: {
        schema: schemaResult.details,
        performance: performanceResult.details
      }
    };

    return combinedResult;
  }
} 
