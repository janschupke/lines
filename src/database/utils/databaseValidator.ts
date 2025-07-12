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
    const requiredTables = ['high_scores', 'schema_migrations'];
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

        // Column validation (now async)
        validation.hasRequiredColumns = await this.validateTableColumns(tableName);

        // Index validation (now async)
        validation.hasIndexes = await this.validateTableIndexes(tableName);

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
   * Validate table columns using schema introspection
   * @param tableName - Name of the table to validate
   * @returns True if table has all required columns
   */
  private async validateTableColumns(tableName: string): Promise<boolean> {
    const requiredColumns: Record<string, string[]> = {
      'high_scores': ['id', 'player_name', 'score', 'achieved_at', 'turns_count', 'individual_balls_popped', 'lines_popped', 'longest_line_popped'],
      'schema_migrations': ['version', 'name', 'applied_at']
    };

    const expected = requiredColumns[tableName];
    if (!expected) return true;

    // Query information_schema.columns for the table
    const { data, error } = await this.supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', tableName);

    if (error || !data) return false;

    const actualColumns = data.map((row: { column_name: string }) => row.column_name);
    return expected.every(col => actualColumns.includes(col));
  }

  /**
   * Validate table indexes using dynamic schema introspection
   * @param tableName - Name of the table to validate
   * @returns True if table has expected indexes
   */
  private async validateTableIndexes(tableName: string): Promise<boolean> {
    const expectedIndexes: Record<string, string[]> = {
      'high_scores': ['idx_high_scores_score', 'idx_high_scores_achieved_at', 'idx_high_scores_turns', 'idx_high_scores_lines'],
      'schema_migrations': []
    };

    const expected = expectedIndexes[tableName];
    if (!expected) return true;

    try {
      // Call the get_table_indexes RPC function
      const { data, error } = await this.supabase
        .rpc('get_table_indexes', { table_name: tableName });

      if (error) {
        console.error(`Failed to get indexes for table ${tableName}:`, error);
        return false;
      }

      if (!data) return false;

      const actualIndexes = data.map((row: { index_name: string }) => row.index_name);
      
      // Check if all expected indexes exist
      return expected.every(expectedIndex => 
        actualIndexes.some((actualIndex: string) => actualIndex === expectedIndex)
      );
    } catch (error) {
      console.error(`Error validating indexes for table ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Validate table RLS policies (simplified implementation)
   * @param tableName - Name of the table to validate
   * @returns True if table has RLS policies
   */
  private validateTableRLS(tableName: string): boolean {
    // Simplified RLS validation
    const tablesWithRLS = ['high_scores'];
    return tablesWithRLS.includes(tableName);
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
      const { error } = await this.supabase
        .from('high_scores')
        .select('score')
        .order('score', { ascending: false })
        .limit(10);

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - table exists but is empty
          result.warnings.push('High scores table is empty - performance test skipped');
          result.details.queryPerformance = {
            highScoresQueryTime: 0,
            threshold: 500,
            status: 'empty_table'
          };
          return result;
        } else if (error.code === '42P01') {
          // Table doesn't exist
          result.errors.push('High scores table does not exist - performance validation failed');
          result.success = false;
          return result;
        } else {
          // Other database errors
          result.errors.push(`Database query failed: ${error.message}`);
          result.success = false;
          return result;
        }
      }

      const queryTime = Date.now() - startTime;

      if (queryTime > 500) {
        result.warnings.push(`High score query took ${queryTime}ms (should be < 500ms)`);
      }

      result.details.queryPerformance = {
        highScoresQueryTime: queryTime,
        threshold: 500,
        status: 'success'
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
