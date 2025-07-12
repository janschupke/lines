# PRP-1752330986000-02-Database-Integration

## Feature: Enhanced High Score System - Database Integration

### Overview
Implement Supabase database integration for persistent high score storage, including connection management, data validation, and error handling. This phase establishes the backend infrastructure for the high score system with proper security and performance optimizations.

### User Stories
- **As a** player, **I want** my high scores to be saved permanently, **So that** I don't lose my achievements when closing the browser or switching devices
- **As a** player, **I want** to see detailed game statistics, **So that** I can understand my performance beyond just the final score
- **As a** player, **I want** new high scores to be automatically saved when game ends, **So that** I don't have to manually save my achievements

### Functional Requirements

#### Supabase Database Setup
- [ ] Configure Supabase client with environment variables
- [ ] Create high_scores table with proper schema and indexes
- [ ] Implement Row Level Security (RLS) policies
- [ ] Set up database connection status monitoring
- [ ] Add connection retry functionality with timeout
- [ ] Implement proper error handling for database operations

#### High Score Data Management
- [ ] Implement save functionality for new high scores (top 20 only)
- [ ] Create retrieve functionality for top 20 high scores
- [ ] Add data validation with confirmation-based sanitization
- [ ] Implement automatic high score evaluation on game end
- [ ] Add high score evaluation on new game button press
- [ ] Ensure old scores remain in database even if not in top 20

#### Connection Status Handling
- [ ] Show spinner during database connection attempts
- [ ] Implement retry button after connection timeout
- [ ] Add graceful degradation when database is unavailable
- [ ] Provide user feedback for connection status
- [ ] Handle offline scenarios gracefully

#### Data Validation and Security
- [ ] Implement player name sanitization (unrestricted typing, eggplant emoji conversion)
- [ ] Add input validation for all high score data
- [ ] Prevent SQL injection through prepared statements
- [ ] Implement rate limiting on high score submissions
- [ ] Add data encryption in transit and at rest

### Non-Functional Requirements
- [ ] Database queries are optimized for performance (<500ms response time)
- [ ] Player name input is secure against injection attacks
- [ ] System works seamlessly with existing game functionality
- [ ] High scores persist across browser sessions and devices
- [ ] Connection issues are handled gracefully with user feedback
- [ ] Database operations don't impact game performance

### Technical Requirements

#### Database Schema
```sql
CREATE TABLE high_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

CREATE INDEX idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX idx_high_scores_achieved_at ON high_scores(achieved_at DESC);
CREATE INDEX idx_high_scores_turns ON high_scores(turns_count DESC);
CREATE INDEX idx_high_scores_lines ON high_scores(lines_popped DESC);
```

#### Supabase Client Configuration
```typescript
// Database service interface
interface HighScoreService {
  saveHighScore(score: HighScore): Promise<boolean>;
  getTopScores(limit: number): Promise<HighScore[]>;
  isConnected(): Promise<boolean>;
  retryConnection(): Promise<boolean>;
}

// Connection status types
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionState {
  status: ConnectionStatus;
  lastError?: string;
  retryCount: number;
}
```

#### Environment Variables
```bash
# Vercel environment variables
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anonymous_key
```

### Database Integration Components

#### High Score Service
```typescript
import { createClient } from '@supabase/supabase-js';

interface HighScore {
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
  private supabase;
  private connectionStatus: ConnectionStatus = 'disconnected';

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveHighScore(score: HighScore): Promise<boolean> {
    try {
      this.connectionStatus = 'connecting';
      
      // Check if score qualifies for top 20
      const topScores = await this.getTopScores(20);
      const qualifies = topScores.length < 20 || score.score > topScores[topScores.length - 1]?.score;
      
      if (!qualifies) {
        return false; // Score doesn't qualify for top 20
      }

      const { data, error } = await this.supabase
        .from('high_scores')
        .insert({
          player_name: this.sanitizePlayerName(score.playerName),
          score: score.score,
          achieved_at: score.achievedAt.toISOString(),
          game_duration: score.gameDuration,
          balls_cleared: score.ballsCleared,
          turns_count: score.turnsCount,
          individual_balls_popped: score.individualBallsPopped,
          lines_popped: score.linesPopped,
          longest_line_popped: score.longestLinePopped
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.connectionStatus = 'connected';
      return true;
    } catch (error) {
      this.connectionStatus = 'error';
      console.error('Failed to save high score:', error);
      return false;
    }
  }

  async getTopScores(limit: number = 20): Promise<HighScore[]> {
    try {
      this.connectionStatus = 'connecting';
      
      const { data, error } = await this.supabase
        .from('high_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      this.connectionStatus = 'connected';
      
      return data.map(row => ({
        id: row.id,
        playerName: row.player_name,
        score: row.score,
        achievedAt: new Date(row.achieved_at),
        gameDuration: row.game_duration,
        ballsCleared: row.balls_cleared,
        turnsCount: row.turns_count,
        individualBallsPopped: row.individual_balls_popped,
        linesPopped: row.lines_popped,
        longestLinePopped: row.longest_line_popped
      }));
    } catch (error) {
      this.connectionStatus = 'error';
      console.error('Failed to retrieve high scores:', error);
      return [];
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('high_scores')
        .select('count', { count: 'exact', head: true });
      
      this.connectionStatus = error ? 'error' : 'connected';
      return !error;
    } catch {
      this.connectionStatus = 'error';
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
    // Unrestricted typing during input, convert to eggplant emoji if invalid on confirmation
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) {
      return '🍆';
    }
    
    // Basic sanitization for display safety
    const sanitized = trimmed.replace(/[<>]/g, '');
    return sanitized || '🍆';
  }
}
```

#### Connection Status Hook
```typescript
import { useState, useEffect, useCallback } from 'react';
import { HighScoreService } from './HighScoreService';

export const useConnectionStatus = (service: HighScoreService) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isRetrying, setIsRetrying] = useState(false);

  const checkConnection = useCallback(async () => {
    const connected = await service.isConnected();
    setStatus(connected ? 'connected' : 'error');
  }, [service]);

  const retryConnection = useCallback(async () => {
    setIsRetrying(true);
    const connected = await service.retryConnection();
    setStatus(connected ? 'connected' : 'error');
    setIsRetrying(false);
  }, [service]);

  useEffect(() => {
    checkConnection();
    
    // Check connection status periodically
    const interval = setInterval(checkConnection, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    status,
    isRetrying,
    retryConnection,
    checkConnection
  };
};
```

### UI/UX Considerations

#### Connection Status Display
- **Spinner**: Show during database connection attempts
- **Retry Button**: Display after connection timeout with user-friendly message
- **Status Indicators**: Clear visual feedback for connection state
- **Graceful Degradation**: Allow game to function without database

#### Error Handling
- **User-Friendly Messages**: Clear explanations for connection issues
- **Retry Options**: Easy way to retry failed connections
- **Offline Mode**: Game continues to work without database
- **Data Persistence**: Local storage fallback for offline scenarios

### Testing Requirements

#### Unit Testing
- **Coverage Target**: >80% for database service and hooks
- **Service Tests**: 
  - HighScoreService save/retrieve functionality
  - Connection status handling
  - Data validation and sanitization
- **Hook Tests**: useConnectionStatus hook tests
- **Error Handling**: Database error scenarios

#### Integration Testing
- **Database Integration**: End-to-end database operations
- **Connection Scenarios**: Online/offline behavior testing
- **Data Persistence**: High score saving and retrieval
- **Error Recovery**: Connection failure and recovery

#### Performance Testing
- **Query Performance**: Database queries under 500ms
- **Connection Speed**: Fast connection establishment
- **Error Recovery**: Quick recovery from connection issues

### Risk Assessment

#### Technical Risks
- **Risk**: Database connection failures during gameplay
  - **Impact**: Medium
  - **Mitigation**: Show spinner during connection attempts, add retry button after timeout

- **Risk**: Player name injection attacks
  - **Impact**: High
  - **Mitigation**: Unrestricted typing with full input conversion to eggplant emoji on confirmation if invalid

- **Risk**: Database performance issues with large datasets
  - **Impact**: Medium
  - **Mitigation**: Optimized indexes and query performance monitoring

#### User Experience Risks
- **Risk**: Network delays affecting high score submission
  - **Impact**: Low
  - **Mitigation**: Background saving with user feedback

- **Risk**: Connection issues blocking game functionality
  - **Impact**: Medium
  - **Mitigation**: Graceful degradation and offline mode support

### Implementation Steps

1. **Set Up Supabase Project**
   - Create Supabase project and configure environment variables
   - Set up database schema with proper indexes
   - Configure Row Level Security policies

2. **Implement High Score Service**
   - Create HighScoreService class with all CRUD operations
   - Add connection status monitoring
   - Implement data validation and sanitization

3. **Add Connection Status Management**
   - Create useConnectionStatus hook
   - Implement retry functionality
   - Add proper error handling

4. **Integrate with Game State**
   - Connect high score evaluation to game end events
   - Add automatic saving functionality
   - Implement top 20 qualification logic

5. **Add UI Feedback**
   - Implement connection status indicators
   - Add retry buttons and loading spinners
   - Create user-friendly error messages

6. **Testing and Validation**
   - Add comprehensive unit tests
   - Test connection failure scenarios
   - Validate data persistence and retrieval

### Success Criteria
- [ ] Supabase database is properly configured and connected
- [ ] High scores are automatically saved when qualifying for top 20
- [ ] Connection status is properly monitored and displayed
- [ ] Data validation prevents injection attacks
- [ ] System gracefully handles connection failures
- [ ] >80% test coverage for database integration
- [ ] Database queries perform under 500ms
- [ ] High scores persist across browser sessions

### Dependencies
- Supabase client library
- Environment variables for database connection
- Existing game state management
- React hooks for state management

### Notes
- Ensure proper environment variable configuration for Vercel deployment
- Implement comprehensive error handling for all database operations
- Use prepared statements to prevent SQL injection
- Monitor database performance and optimize queries as needed
- Test thoroughly with various connection scenarios 
