# PRP-1703123456789-03-Extract-Constants-and-Enums

## Feature Overview

### Feature Name
Extract Magic Numbers and Create Comprehensive Constants and Enums

### Brief Description
Replace all hardcoded values (magic numbers) throughout the codebase with named constants and enums to improve code maintainability, readability, and reduce the risk of errors from inconsistent values.

### User Value
This refactoring will make the codebase more maintainable, reduce the risk of bugs from inconsistent hardcoded values, improve code readability, and make game configuration changes easier to implement.

## User Stories

### Primary User Story
**As a** developer
**I want** to replace all magic numbers with named constants
**So that** the code is more readable and maintainable

### Additional User Stories
- **As a** developer, **I want** game configuration to be centralized, **So that** I can easily modify game settings
- **As a** developer, **I want** consistent values throughout the codebase, **So that** I avoid bugs from inconsistent hardcoded values
- **As a** new team member, **I want** self-documenting code, **So that** I can understand the purpose of each value

## Acceptance Criteria

### Functional Requirements
- [ ] Replace all magic numbers with named constants
- [ ] Create comprehensive enums for game states and configurations
- [ ] Centralize all game constants in `src/game/constants.ts`
- [ ] Ensure all existing functionality works correctly
- [ ] Verify that all tests pass after the changes
- [ ] Confirm that the game behavior remains identical

### Non-Functional Requirements
- [ ] No TypeScript errors after the changes
- [ ] No linting warnings after the changes
- [ ] Build process completes successfully
- [ ] Test coverage remains >80%
- [ ] Code readability is improved

## Technical Requirements

### Implementation Details
- **Magic Number Identification**: Find all hardcoded values in the codebase
- **Constants Creation**: Create named constants for all identified values
- **Enum Creation**: Create enums for game states and configurations
- **Import Updates**: Update all files to use the new constants
- **Validation**: Ensure all values are consistent and correct

### Technical Constraints
- Must preserve all existing functionality
- Must maintain backward compatibility
- Must not break any existing tests
- Must follow TypeScript best practices for constants and enums

### Dependencies
- All files that contain hardcoded values
- Test files that may reference the old values
- Build configuration that may reference hardcoded values

## UI/UX Considerations

### User Interface
- **No UI Changes**: This is a backend refactoring with no user-facing changes
- **No Performance Impact**: Constants extraction should not affect runtime performance

### User Experience
- **No Functional Changes**: Game behavior should remain identical
- **No Breaking Changes**: All existing functionality preserved
- **Improved Maintainability**: Better code organization for future development

### Accessibility Requirements
- **No Impact**: This refactoring does not affect accessibility features
- **Preserve Existing**: All existing accessibility features must continue to work

## Testing Requirements

### Unit Testing
- **Coverage Target**: Maintain >80% test coverage
- **Constants Tests**: Verify all constants are properly defined and accessible
- **Enum Tests**: Test that all enums work correctly
- **Functionality Tests**: Ensure all game features work with new constants

### Integration Testing
- **Game Flow Tests**: Verify complete game flows work with new constants
- **State Management Tests**: Test game state transitions with new enums
- **Configuration Tests**: Test that game configuration works correctly

### Performance Testing
- **Build Time**: Ensure no significant increase in build time
- **Runtime Performance**: Verify no performance regression
- **Bundle Size**: Ensure no increase in bundle size

## Performance Considerations

### Performance Benchmarks
- **Build Time**: Maintain current build times
- **Runtime Performance**: No impact on runtime performance
- **Bundle Size**: No increase in bundle size
- **Memory Usage**: No increase in memory consumption

### Optimization Strategies
- **Tree Shaking**: Ensure constants are properly tree-shakeable
- **Import Optimization**: Optimize constant imports
- **Type Safety**: Leverage TypeScript for better type safety

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- **No Regression**: All existing accessibility features must continue to work
- **Screen Reader**: Ensure screen reader compatibility is maintained
- **Keyboard Navigation**: Verify keyboard navigation still works correctly
- **Color Contrast**: Maintain existing color contrast ratios

### Specific Accessibility Features
- **ARIA Labels**: Preserve all existing ARIA labels and descriptions
- **Focus Management**: Maintain proper focus handling
- **Error Handling**: Preserve existing error handling for accessibility

## Risk Assessment

### Technical Risks
- **Risk**: Replacing magic numbers may introduce bugs
  - **Impact**: Medium
  - **Mitigation**: Comprehensive testing, gradual replacement with verification

- **Risk**: Some magic numbers may be missed
  - **Impact**: Low
  - **Mitigation**: Use automated tools to find all hardcoded values, manual verification

- **Risk**: Constants may not be properly organized
  - **Impact**: Low
  - **Mitigation**: Follow established patterns, code review

### User Experience Risks
- **Risk**: Game may not work correctly after changes
  - **Impact**: Medium
  - **Mitigation**: Extensive testing of all game features, user acceptance testing

## Implementation Plan

### Phase 1: Analysis and Identification
- [ ] Audit all files for magic numbers and hardcoded values
- [ ] Create comprehensive list of all values to extract
- [ ] Categorize values by purpose (game config, animation, UI, etc.)
- [ ] Create backup of current state

### Phase 2: Constants and Enums Creation
- [ ] Create comprehensive constants file with all game values
- [ ] Create enums for game states and configurations
- [ ] Organize constants by category and purpose
- [ ] Add proper TypeScript types and documentation

### Phase 3: Code Updates
- [ ] Replace all magic numbers with named constants
- [ ] Update all files to use the new constants and enums
- [ ] Test that all imports work correctly
- [ ] Verify no TypeScript errors

### Phase 4: Verification and Cleanup
- [ ] Run full test suite
- [ ] Verify game functionality in browser
- [ ] Update documentation to reflect new constants
- [ ] Clean up any remaining hardcoded values

## Success Metrics

### User Experience Metrics
- **Functionality**: 100% of existing features work correctly
- **Maintainability**: Improved code readability and organization
- **No Breaking Changes**: All existing functionality preserved

### Technical Metrics
- **Test Coverage**: Maintain >80% coverage
- **Build Success**: 100% successful builds
- **TypeScript Errors**: 0 errors
- **Linting Warnings**: 0 warnings
- **Magic Numbers**: 0 remaining hardcoded values

## Documentation Requirements

### Code Documentation
- **Constants Documentation**: Document all constants with clear descriptions
- **Enum Documentation**: Document all enums with usage examples
- **Update Comments**: Ensure all code comments reflect the new constants

### User Documentation
- **No Changes Required**: No user-facing documentation changes needed

## Post-Implementation

### Monitoring
- **Code Quality**: Monitor for any new magic numbers introduced
- **Error Tracking**: Monitor for any new errors introduced
- **Performance Monitoring**: Monitor for any performance impacts

### Maintenance
- **Regular Reviews**: Ensure no new magic numbers are introduced
- **Constants Audits**: Periodically audit constants for consistency
- **Documentation Updates**: Keep constants documentation current

## Code Examples

### Before (Magic Numbers)
```typescript
// src/game/state/index.ts
const interval = setInterval(() => setTimer(t => t + 1), 1000);

// src/game/logic/index.ts
if (line.length >= 5) {
  lines.push(line);
}

// src/ui/components/Game.tsx
<div className="w-6 h-6 rounded-full bg-ball-${color}">
```

### After (Named Constants)
```typescript
// src/game/constants.ts
export const TIMER_INTERVAL_MS = 1000;
export const MIN_LINE_LENGTH = 5;
export const BALL_SIZE_PX = 24;
export const BALL_SIZE_REM = 1.5;

export enum GameState {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver'
}

export enum AnimationDuration {
  MOVE_BALL = 80,
  POP_BALL = 300,
  TRANSITION = 200
}

// src/game/state/index.ts
const interval = setInterval(() => setTimer(t => t + 1), TIMER_INTERVAL_MS);

// src/game/logic/index.ts
if (line.length >= MIN_LINE_LENGTH) {
  lines.push(line);
}

// src/ui/components/Game.tsx
<div className={`w-${BALL_SIZE_REM} h-${BALL_SIZE_REM} rounded-full bg-ball-${color}`}>
```

### Comprehensive Constants Organization
```typescript
// src/game/constants.ts

// Game Configuration
export const BOARD_SIZE = 9;
export const BALLS_PER_TURN = 3;
export const MIN_LINE_LENGTH = 5;
export const MAX_BOARD_SIZE = 15;

// Timing Constants
export const TIMER_INTERVAL_MS = 1000;
export const ANIMATION_DURATIONS = {
  MOVE_BALL: 80,
  POP_BALL: 300,
  TRANSITION: 200,
} as const;

// UI Constants
export const BALL_SIZE_PX = 24;
export const BALL_SIZE_REM = 1.5;
export const CELL_SIZE_PX = 56;
export const CELL_SIZE_REM = 3.5;
export const GAP_SIZE_PX = 8;
export const GAP_SIZE_REM = 0.5;

// Game States
export enum GameState {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver'
}

// Animation States
export enum AnimationState {
  IDLE = 'idle',
  MOVING = 'moving',
  POPPING = 'popping',
  TRANSITIONING = 'transitioning'
}

// Ball Colors
export type BallColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan' | 'black';
export const BALL_COLORS: BallColor[] = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan', 'black'];

// Scoring System
export const SCORING_TABLE: Record<number, number> = {
  5: 5,
  6: 8,
  7: 13,
  8: 21,
  9: 34,
} as const;

// High Score Configuration
export const MAX_HIGH_SCORES = 10;
export const HIGH_SCORE_STORAGE_KEY = 'lines-game-high-scores';

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_MOVE: 'Invalid move',
  GAME_OVER: 'Game over',
  NETWORK_ERROR: 'Network error',
} as const;
```

## Testing Strategy

### Unit Tests
```typescript
// Test that constants are properly defined
import { 
  BOARD_SIZE, 
  MIN_LINE_LENGTH, 
  TIMER_INTERVAL_MS,
  GameState,
  BALL_COLORS 
} from '../game/constants';

describe('Game Constants', () => {
  it('should have correct board size', () => {
    expect(BOARD_SIZE).toBe(9);
  });

  it('should have correct minimum line length', () => {
    expect(MIN_LINE_LENGTH).toBe(5);
  });

  it('should have correct timer interval', () => {
    expect(TIMER_INTERVAL_MS).toBe(1000);
  });

  it('should have correct game states', () => {
    expect(GameState.PLAYING).toBe('playing');
    expect(GameState.GAME_OVER).toBe('gameOver');
  });

  it('should have correct ball colors', () => {
    expect(BALL_COLORS).toHaveLength(7);
    expect(BALL_COLORS).toContain('red');
  });
});
```

### Integration Tests
```typescript
// Test that game logic works with new constants
import { BOARD_SIZE, MIN_LINE_LENGTH } from '../game/constants';
import { createEmptyBoard, findLine } from '../game/logic';

describe('Game Logic with Constants', () => {
  it('should create board with correct size', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_SIZE);
    expect(board[0]).toHaveLength(BOARD_SIZE);
  });

  it('should find lines with minimum length', () => {
    // Test line detection with MIN_LINE_LENGTH
  });
});
```

This PRP ensures a clean, maintainable codebase with self-documenting code and centralized configuration management. 
