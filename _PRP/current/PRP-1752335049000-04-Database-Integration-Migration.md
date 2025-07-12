# PRP-1752335049000-04: Database Integration Migration

## Feature Overview

### Feature Name
Database Integration Migration from localStorage to Supabase

### Brief Description
Migrate the high score system from localStorage to a fully integrated Supabase database solution, ensuring seamless transition for existing users while maintaining data integrity and providing real-time synchronization capabilities.

### User Value
Players will experience persistent, cross-device high scores with real-time synchronization, while maintaining their existing high score data through a smooth migration process that preserves their achievements.

## Functional Requirements

### localStorage to Database Migration
- [ ] Implement data migration from localStorage to database
- [ ] Preserve existing high score data during migration
- [ ] Handle migration conflicts and data validation
- [ ] Provide migration progress feedback to users
- [ ] Implement rollback functionality for failed migrations
- [ ] Create migration status tracking and logging

### Database-Only High Score Storage
- [ ] Remove localStorage dependency for high scores
- [ ] Implement database-only high score operations
- [ ] Create real-time high score synchronization
- [ ] Implement offline support with local caching
- [ ] Add data validation and sanitization
- [ ] Create error handling and recovery procedures

### Real-Time Synchronization
- [ ] Implement real-time high score updates
- [ ] Create subscription-based score synchronization
- [ ] Handle concurrent score submissions
- [ ] Implement conflict resolution for simultaneous updates
- [ ] Add real-time connection status monitoring
- [ ] Create fallback mechanisms for connection issues

### Connection Status Management
- [ ] Implement connection status monitoring
- [ ] Create retry mechanisms for failed operations
- [ ] Add offline mode with local caching
- [ ] Implement connection recovery procedures
- [ ] Create user feedback for connection status
- [ ] Add connection quality monitoring

## Non-Functional Requirements

### Performance Requirements
- [ ] Migration completion time < 30 seconds
- [ ] Database query response time < 500ms
- [ ] Real-time synchronization latency < 100ms
- [ ] Offline mode response time < 50ms
- [ ] Connection recovery time < 5 seconds

### Reliability Requirements
- [ ] 100% data integrity during migration
- [ ] Zero data loss during transition
- [ ] Automatic recovery from connection failures
- [ ] Comprehensive error handling and logging
- [ ] Data backup and restore procedures

### Security Requirements
- [ ] Secure data transmission to database
- [ ] Input validation and sanitization
- [ ] Row Level Security (RLS) enforcement
- [ ] Secure handling of user data
- [ ] Audit logging for data operations

## Technical Implementation

### Migration Service
```typescript
// src/services/HighScoreMigrationService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { HighScore } from '../types/HighScoreTypes';

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
  private localStorageKey = 'lines-game-high-scores';

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async migrateFromLocalStorage(): Promise<MigrationProgress> {
    const progress: MigrationProgress = {
      totalRecords: 0,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      currentStep: 'Starting migration...',
      isComplete: false
    };

    try {
      // Check if migration is needed
      if (!this.hasLocalStorageData()) {
        progress.currentStep = 'No local data to migrate';
        progress.isComplete = true;
        return progress;
      }

      // Load local data
      progress.currentStep = 'Loading local data...';
      const localScores = this.loadLocalScores();
      progress.totalRecords = localScores.length;

      // Validate local data
      progress.currentStep = 'Validating local data...';
      const validScores = this.validateLocalScores(localScores);
      progress.processedRecords = validScores.length;

      // Migrate to database
      progress.currentStep = 'Migrating to database...';
      const migrationResults = await this.migrateScoresToDatabase(validScores);
      
      progress.successCount = migrationResults.successCount;
      progress.errorCount = migrationResults.errorCount;

      // Clean up local data if migration successful
      if (progress.errorCount === 0) {
        progress.currentStep = 'Cleaning up local data...';
        this.cleanupLocalData();
      }

      progress.currentStep = 'Migration completed';
      progress.isComplete = true;

      return progress;
    } catch (error) {
      progress.currentStep = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      progress.isComplete = true;
      throw error;
    }
  }

  private hasLocalStorageData(): boolean {
    try {
      const localData = localStorage.getItem(this.localStorageKey);
      return !!localData;
    } catch (error) {
      console.warn('Error checking local storage:', error);
      return false;
    }
  }

  private loadLocalScores(): HighScore[] {
    try {
      const localData = localStorage.getItem(this.localStorageKey);
      if (!localData) return [];

      const parsedData = JSON.parse(localData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('Error loading local scores:', error);
      return [];
    }
  }

  private validateLocalScores(scores: any[]): HighScore[] {
    return scores.filter(score => {
      return (
        score &&
        typeof score.player_name === 'string' &&
        typeof score.score === 'number' &&
        typeof score.turns_count === 'number' &&
        typeof score.individual_balls_popped === 'number' &&
        typeof score.lines_popped === 'number' &&
        typeof score.longest_line_popped === 'number' &&
        score.player_name.trim().length > 0 &&
        score.score > 0
      );
    }).map(score => ({
      player_name: score.player_name.trim(),
      score: Math.floor(score.score),
      achieved_at: score.achieved_at ? new Date(score.achieved_at) : new Date(),
      game_duration: score.game_duration || null,
      balls_cleared: score.balls_cleared || null,
      turns_count: Math.floor(score.turns_count),
      individual_balls_popped: Math.floor(score.individual_balls_popped),
      lines_popped: Math.floor(score.lines_popped),
      longest_line_popped: Math.floor(score.longest_line_popped)
    }));
  }

  private async migrateScoresToDatabase(scores: HighScore[]): Promise<{ successCount: number; errorCount: number }> {
    let successCount = 0;
    let errorCount = 0;

    for (const score of scores) {
      try {
        const { error } = await this.supabase
          .from('high_scores')
          .insert(score);

        if (error) {
          console.error('Error migrating score:', error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error('Error migrating score:', error);
        errorCount++;
      }
    }

    return { successCount, errorCount };
  }

  private cleanupLocalData(): void {
    try {
      localStorage.removeItem(this.localStorageKey);
      console.log('Local storage data cleaned up successfully');
    } catch (error) {
      console.warn('Error cleaning up local storage:', error);
    }
  }

  async rollbackMigration(): Promise<void> {
    // This would restore local data from a backup if needed
    console.log('Migration rollback not implemented - data would be lost');
  }
}
```

### Database-Only High Score Service
```typescript
// src/services/DatabaseHighScoreService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { HighScore, HighScoreSubmission } from '../types/HighScoreTypes';

export class DatabaseHighScoreService {
  private supabase: SupabaseClient;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private retryAttempts = 0;
  private maxRetryAttempts = 3;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.initializeConnectionMonitoring();
  }

  async submitHighScore(submission: HighScoreSubmission): Promise<HighScore | null> {
    try {
      this.updateConnectionStatus('connected');
      this.retryAttempts = 0;

      const { data, error } = await this.supabase
        .from('high_scores')
        .insert({
          player_name: submission.player_name,
          score: submission.score,
          game_duration: submission.game_duration,
          balls_cleared: submission.balls_cleared,
          turns_count: submission.turns_count,
          individual_balls_popped: submission.individual_balls_popped,
          lines_popped: submission.lines_popped,
          longest_line_popped: submission.longest_line_popped
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit high score: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error submitting high score:', error);
      this.handleSubmissionError(error);
      return null;
    }
  }

  async getHighScores(limit: number = 10): Promise<HighScore[]> {
    try {
      this.updateConnectionStatus('connected');
      this.retryAttempts = 0;

      const { data, error } = await this.supabase
        .from('high_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch high scores: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching high scores:', error);
      this.handleFetchError(error);
      return [];
    }
  }

  async getPlayerHighScores(playerName: string): Promise<HighScore[]> {
    try {
      this.updateConnectionStatus('connected');
      this.retryAttempts = 0;

      const { data, error } = await this.supabase
        .from('high_scores')
        .select('*')
        .eq('player_name', playerName)
        .order('score', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch player high scores: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching player high scores:', error);
      this.handleFetchError(error);
      return [];
    }
  }

  subscribeToHighScoreUpdates(callback: (scores: HighScore[]) => void): () => void {
    const subscription = this.supabase
      .channel('high_scores_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'high_scores' },
        async () => {
          try {
            const scores = await this.getHighScores(10);
            callback(scores);
          } catch (error) {
            console.error('Error in high score subscription:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  private updateConnectionStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
    this.connectionStatus = status;
    this.notifyConnectionStatusChange(status);
  }

  private handleSubmissionError(error: any): void {
    if (this.retryAttempts < this.maxRetryAttempts) {
      this.retryAttempts++;
      this.updateConnectionStatus('connecting');
      
      setTimeout(() => {
        console.log(`Retrying high score submission (attempt ${this.retryAttempts})`);
        // Retry logic would be implemented here
      }, 1000 * this.retryAttempts);
    } else {
      this.updateConnectionStatus('disconnected');
      this.retryAttempts = 0;
    }
  }

  private handleFetchError(error: any): void {
    if (this.retryAttempts < this.maxRetryAttempts) {
      this.retryAttempts++;
      this.updateConnectionStatus('connecting');
      
      setTimeout(() => {
        console.log(`Retrying high score fetch (attempt ${this.retryAttempts})`);
        // Retry logic would be implemented here
      }, 1000 * this.retryAttempts);
    } else {
      this.updateConnectionStatus('disconnected');
      this.retryAttempts = 0;
    }
  }

  private initializeConnectionMonitoring(): void {
    // Monitor connection status
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.updateConnectionStatus('connected');
      } else if (event === 'SIGNED_OUT') {
        this.updateConnectionStatus('disconnected');
      }
    });
  }

  private notifyConnectionStatusChange(status: string): void {
    // Dispatch custom event for connection status changes
    window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
      detail: { status }
    }));
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }
}
```

### Migration Hook
```typescript
// src/hooks/useHighScoreMigration.ts
import { useState, useEffect } from 'react';
import { HighScoreMigrationService, MigrationProgress } from '../services/HighScoreMigrationService';

export function useHighScoreMigration(supabase: any) {
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  const migrationService = new HighScoreMigrationService(supabase);

  const startMigration = async (): Promise<void> => {
    setIsMigrating(true);
    setMigrationError(null);
    setMigrationProgress(null);

    try {
      const progress = await migrationService.migrateFromLocalStorage();
      setMigrationProgress(progress);
    } catch (error) {
      setMigrationError(error instanceof Error ? error.message : 'Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  const checkMigrationNeeded = (): boolean => {
    try {
      const localData = localStorage.getItem('lines-game-high-scores');
      return !!localData;
    } catch {
      return false;
    }
  };

  return {
    startMigration,
    checkMigrationNeeded,
    migrationProgress,
    isMigrating,
    migrationError
  };
}
```

### Connection Status Hook
```typescript
// src/hooks/useConnectionStatus.ts
import { useState, useEffect } from 'react';

export function useConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    const handleConnectionStatusChange = (event: CustomEvent) => {
      setConnectionStatus(event.detail.status);
    };

    window.addEventListener('highScoreConnectionStatus', handleConnectionStatusChange as EventListener);

    return () => {
      window.removeEventListener('highScoreConnectionStatus', handleConnectionStatusChange as EventListener);
    };
  }, []);

  return connectionStatus;
}
```

## Testing Requirements

### Unit Tests
- [ ] Test HighScoreMigrationService migration logic
- [ ] Test DatabaseHighScoreService operations
- [ ] Test data validation and sanitization
- [ ] Test connection status monitoring
- [ ] Test retry mechanisms
- [ ] Test error handling and recovery

### Integration Tests
- [ ] Test complete migration workflow
- [ ] Test database-only high score operations
- [ ] Test real-time synchronization
- [ ] Test connection status management
- [ ] Test offline mode functionality
- [ ] Test data integrity validation

### Performance Tests
- [ ] Test migration completion time
- [ ] Test database query performance
- [ ] Test real-time synchronization latency
- [ ] Test connection recovery time
- [ ] Test offline mode performance

## Accessibility Considerations

### Migration Accessibility
- [ ] Ensure migration progress is accessible to screen readers
- [ ] Provide clear error messages for migration failures
- [ ] Create accessible migration status indicators
- [ ] Implement keyboard navigation for migration controls
- [ ] Ensure color contrast in migration interfaces

## Risk Assessment

### Technical Risks
- **Risk**: Data loss during migration
  - **Impact**: High
  - **Mitigation**: Comprehensive backup and validation procedures
  - **Probability**: Low

- **Risk**: Migration conflicts with existing data
  - **Impact**: Medium
  - **Mitigation**: Conflict detection and resolution procedures
  - **Probability**: Medium

- **Risk**: Connection failures during migration
  - **Impact**: Medium
  - **Mitigation**: Retry mechanisms and offline support
  - **Probability**: Medium

### User Experience Risks
- **Risk**: Migration taking too long
  - **Impact**: Medium
  - **Mitigation**: Progress indicators and background processing
  - **Probability**: Low

## Success Metrics

### Migration Metrics
- [ ] Migration completion time < 30 seconds
- [ ] 100% data integrity during migration
- [ ] Zero data loss during transition
- [ ] Successful migration rate > 99%

### Performance Metrics
- [ ] Database query response time < 500ms
- [ ] Real-time synchronization latency < 100ms
- [ ] Connection recovery time < 5 seconds
- [ ] Offline mode response time < 50ms

## Implementation Steps

### Step 1: Migration Service Implementation
1. Create HighScoreMigrationService class
2. Implement localStorage data loading and validation
3. Create database migration logic
4. Add migration progress tracking
5. Implement rollback functionality

### Step 2: Database-Only Service Implementation
1. Create DatabaseHighScoreService class
2. Implement database-only operations
3. Add real-time synchronization
4. Create connection status monitoring
5. Implement retry mechanisms

### Step 3: Migration Hook Implementation
1. Create useHighScoreMigration hook
2. Implement migration progress tracking
3. Add error handling and recovery
4. Create migration status indicators
5. Implement migration completion handling

### Step 4: Connection Status Management
1. Create useConnectionStatus hook
2. Implement connection monitoring
3. Add connection status indicators
4. Create retry mechanisms
5. Implement offline mode support

### Step 5: Testing and Validation
1. Test migration workflow thoroughly
2. Validate data integrity after migration
3. Test real-time synchronization
4. Verify connection status management
5. Run comprehensive test suite

## Documentation Requirements

### Migration Documentation
- [ ] Migration process guide
- [ ] Data validation procedures
- [ ] Rollback procedures
- [ ] Troubleshooting guide
- [ ] Migration status indicators

### User Documentation
- [ ] Migration progress explanation
- [ ] Connection status indicators
- [ ] Offline mode functionality
- [ ] Real-time synchronization features

## Post-Implementation

### Monitoring
- [ ] Monitor migration success rates
- [ ] Track database performance after migration
- [ ] Monitor real-time synchronization
- [ ] Track connection status and recovery

### Maintenance
- [ ] Regular database performance monitoring
- [ ] Connection status optimization
- [ ] Migration procedure updates
- [ ] Performance monitoring and optimization

## Dependencies

### External Dependencies
- Supabase client library
- Local storage API
- Real-time subscription system
- Connection monitoring services

### Internal Dependencies
- Database migration system
- Environment configuration service
- Error handling and logging system
- High score data types and interfaces

## Acceptance Criteria

### Functional Acceptance
- [ ] Migration completes successfully
- [ ] All local data is preserved
- [ ] Database-only operations work correctly
- [ ] Real-time synchronization functions
- [ ] Connection status monitoring works

### Non-Functional Acceptance
- [ ] Migration completion time < 30 seconds
- [ ] Database query response time < 500ms
- [ ] Real-time synchronization latency < 100ms
- [ ] Connection recovery time < 5 seconds
- [ ] Zero data loss during migration

### Quality Acceptance
- [ ] 100% test coverage for migration system
- [ ] All linting rules pass
- [ ] TypeScript compilation successful
- [ ] Data integrity validation passes 
