# PRP-1703123456789-04-Split-Game-State-Hook

## Feature Overview

### Feature Name
Split Complex Game State Hook into Smaller, Focused Hooks

### Brief Description
Refactor the overly complex game state hook (348 lines) into smaller, focused hooks that each handle a specific responsibility, improving maintainability, testability, and code organization.

### User Value
This refactoring will improve code maintainability, make the codebase easier to understand and test, reduce cognitive load for developers, and enable better separation of concerns for future feature development.

## User Stories

### Primary User Story
**As a** developer
**I want** the game state management to be split into focused, single-responsibility hooks
**So that** I can easily understand, test, and maintain each piece of functionality

### Additional User Stories
- **As a** developer, **I want** to have separate hooks for different concerns, **So that** I can modify one aspect without affecting others
- **As a** developer, **I want** better testability for game state, **So that** I can write focused unit tests for each hook
- **As a** new team member, **I want** clear separation of concerns, **So that** I can quickly understand how the game state works

## Acceptance Criteria

### Functional Requirements
- [ ] Split `useGameState` into focused hooks: `useGameBoard`, `useGameTimer`, `useGameAnimation`, `useHighScores`
- [ ] Ensure all existing functionality is preserved
- [ ] Maintain the same public API for components
- [ ] Verify that all tests pass after the refactoring
- [ ] Confirm that the game works exactly as before
- [ ] Improve code readability and maintainability

### Non-Functional Requirements
- [ ] No TypeScript errors after the changes
- [ ] No linting warnings after the changes
- [ ] Build process completes successfully
- [ ] Test coverage remains >80%
- [ ] Each hook has a single responsibility
- [ ] Hooks are properly documented

## Technical Requirements

### Implementation Details
- **Hook Extraction**: Extract focused hooks from the main game state hook
- **State Management**: Ensure proper state sharing between hooks
- **API Preservation**: Maintain the same public interface for components
- **Testing**: Create comprehensive tests for each new hook
- **Documentation**: Document each hook's purpose and usage

### Technical Constraints
- Must preserve all existing functionality
- Must maintain backward compatibility for components
- Must not break any existing tests
- Must follow React hooks best practices
- Must maintain proper state synchronization

### Dependencies
- Existing components that use the game state hook
- Test files that test the game state functionality
- Any external code that depends on the current hook structure

## UI/UX Considerations

### User Interface
- **No UI Changes**: This is a backend refactoring with no user-facing changes
- **No Performance Impact**: Hook splitting should not affect runtime performance

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
- **Hook Tests**: Create comprehensive tests for each new hook
- **Integration Tests**: Test that hooks work together correctly
- **Functionality Tests**: Ensure all game features work with new hook structure

### Integration Testing
- **Game Flow Tests**: Verify complete game flows work with new hooks
- **State Management Tests**: Test state transitions between hooks
- **Component Tests**: Test that components work correctly with new hook structure

### Performance Testing
- **Render Performance**: Ensure no performance regression from hook splitting
- **Memory Usage**: Verify no memory leaks introduced
- **Bundle Size**: Ensure no increase in bundle size

## Performance Considerations

### Performance Benchmarks
- **Render Time**: Maintain current render performance
- **Memory Usage**: No increase in memory consumption
- **Bundle Size**: No increase in bundle size
- **Hook Execution**: No significant impact on hook execution time

### Optimization Strategies
- **Memoization**: Use React.memo and useMemo where appropriate
- **State Optimization**: Optimize state updates to minimize re-renders
- **Hook Optimization**: Ensure hooks are optimized for their specific use cases

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
- **Risk**: Splitting hooks may break state synchronization
  - **Impact**: High
  - **Mitigation**: Comprehensive testing, gradual refactoring with verification at each step

- **Risk**: Components may not work correctly with new hook structure
  - **Impact**: Medium
  - **Mitigation**: Maintain backward compatibility, extensive component testing

- **Risk**: Performance may degrade with multiple hooks
  - **Impact**: Low
  - **Mitigation**: Performance testing, optimization where needed

### User Experience Risks
- **Risk**: Game may not work correctly after refactoring
  - **Impact**: Medium
  - **Mitigation**: Extensive testing of all game features, user acceptance testing

## Implementation Plan

### Phase 1: Analysis and Planning
- [ ] Analyze current `useGameState` hook to identify responsibilities
- [ ] Plan hook separation strategy
- [ ] Create comprehensive test plan
- [ ] Create backup of current state

### Phase 2: Hook Extraction
- [ ] Extract `useGameBoard` hook for board state management
- [ ] Extract `useGameTimer` hook for timer functionality
- [ ] Extract `useGameAnimation` hook for animation logic
- [ ] Extract `useHighScores` hook for high score management

### Phase 3: Integration and Testing
- [ ] Create main `useGameState` hook that combines all focused hooks
- [ ] Ensure proper state sharing between hooks
- [ ] Test that all functionality works correctly
- [ ] Verify no performance regression

### Phase 4: Verification and Cleanup
- [ ] Run full test suite
- [ ] Verify game functionality in browser
- [ ] Update documentation for new hooks
- [ ] Clean up any remaining issues

## Success Metrics

### User Experience Metrics
- **Functionality**: 100% of existing features work correctly
- **Maintainability**: Improved code organization and readability
- **No Breaking Changes**: All existing functionality preserved

### Technical Metrics
- **Test Coverage**: Maintain >80% coverage
- **Build Success**: 100% successful builds
- **TypeScript Errors**: 0 errors
- **Linting Warnings**: 0 warnings
- **Hook Complexity**: Each hook has single responsibility

## Documentation Requirements

### Code Documentation
- **Hook Documentation**: Document each hook's purpose, parameters, and return values
- **Usage Examples**: Provide clear examples of how to use each hook
- **Update Comments**: Ensure all code comments reflect the new structure

### User Documentation
- **No Changes Required**: No user-facing documentation changes needed

## Post-Implementation

### Monitoring
- **Performance Monitoring**: Monitor for any performance impacts
- **Error Tracking**: Monitor for any new errors introduced
- **Hook Usage**: Monitor hook usage patterns

### Maintenance
- **Regular Reviews**: Ensure hooks maintain single responsibility
- **Hook Audits**: Periodically audit hooks for complexity
- **Documentation Updates**: Keep hook documentation current

## Code Examples

### Before (Complex Single Hook)
```typescript
// src/game/state/index.ts (348 lines)
export const useGameState = (initialBoard?: Cell[][], initialNextBalls?: BallColor[]): [GameState, GameActions] => {
  // Board state
  const [board, setBoard] = useState<Cell[][]>(() => { /* ... */ });
  const [selected, setSelected] = useState<{x: number, y: number} | null>(null);
  
  // Timer state
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
  // Animation state
  const [movingBall, setMovingBall] = useState<null | {color: BallColor; path: [number, number][]}>(null);
  const [movingStep, setMovingStep] = useState(0);
  const [poppingBalls, setPoppingBalls] = useState<Set<string>>(new Set());
  
  // High score state
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  // Game state
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [nextBalls, setNextBalls] = useState<BallColor[]>(() => getRandomNextBalls(BALLS_PER_TURN));
  
  // ... 300+ more lines of complex logic
};
```

### After (Focused Hooks)
```typescript
// src/game/hooks/useGameBoard.ts
export const useGameBoard = (initialBoard?: Cell[][], initialNextBalls?: BallColor[]) => {
  const [board, setBoard] = useState<Cell[][]>(() => { /* ... */ });
  const [selected, setSelected] = useState<{x: number, y: number} | null>(null);
  const [nextBalls, setNextBalls] = useState<BallColor[]>(() => getRandomNextBalls(BALLS_PER_TURN));
  
  const handleCellClick = useCallback((x: number, y: number) => { /* ... */ }, []);
  const handleCellHover = useCallback((x: number, y: number) => { /* ... */ }, []);
  const handleCellLeave = useCallback(() => { /* ... */ }, []);
  
  return {
    board,
    selected,
    nextBalls,
    setBoard,
    setSelected,
    setNextBalls,
    handleCellClick,
    handleCellHover,
    handleCellLeave,
  };
};

// src/game/hooks/useGameTimer.ts
export const useGameTimer = () => {
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer(t => t + 1), TIMER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [timerActive]);
  
  const startTimer = useCallback(() => setTimerActive(true), []);
  const stopTimer = useCallback(() => setTimerActive(false), []);
  const resetTimer = useCallback(() => setTimer(0), []);
  
  return {
    timer,
    timerActive,
    startTimer,
    stopTimer,
    resetTimer,
  };
};

// src/game/hooks/useGameAnimation.ts
export const useGameAnimation = () => {
  const [movingBall, setMovingBall] = useState<null | {color: BallColor; path: [number, number][]}>(null);
  const [movingStep, setMovingStep] = useState(0);
  const [poppingBalls, setPoppingBalls] = useState<Set<string>>(new Set());
  
  const startMoveAnimation = useCallback((ball: BallColor, path: [number, number][]) => {
    setMovingBall({ color: ball, path });
    setMovingStep(0);
  }, []);
  
  const stopMoveAnimation = useCallback(() => {
    setMovingBall(null);
    setMovingStep(0);
  }, []);
  
  return {
    movingBall,
    movingStep,
    poppingBalls,
    setPoppingBalls,
    startMoveAnimation,
    stopMoveAnimation,
  };
};

// src/game/hooks/useHighScores.ts
export const useHighScores = () => {
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const highScoreManager = useRef(new HighScoreManager());
  
  const checkForNewHighScore = useCallback((score: number, time: number): boolean => {
    if (highScoreManager.current.isNewHighScore(score)) {
      const success = highScoreManager.current.addHighScore(score, time);
      if (success) {
        setCurrentHighScore(highScoreManager.current.getCurrentHighScore());
        setIsNewHighScore(true);
        return true;
      }
    }
    return false;
  }, []);
  
  return {
    currentHighScore,
    isNewHighScore,
    checkForNewHighScore,
  };
};

// src/game/hooks/useGameState.ts (Main orchestrator)
export const useGameState = (initialBoard?: Cell[][], initialNextBalls?: BallColor[]): [GameState, GameActions] => {
  const board = useGameBoard(initialBoard, initialNextBalls);
  const timer = useGameTimer();
  const animation = useGameAnimation();
  const highScores = useHighScores();
  
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  
  // Combine all state and actions
  const gameState: GameState = {
    board: board.board,
    score,
    selected: board.selected,
    gameOver,
    nextBalls: board.nextBalls,
    timer: timer.timer,
    timerActive: timer.timerActive,
    movingBall: animation.movingBall,
    movingStep: animation.movingStep,
    poppingBalls: animation.poppingBalls,
    hoveredCell: null, // Add if needed
    pathTrail: null, // Add if needed
    notReachable: false, // Add if needed
    currentHighScore: highScores.currentHighScore,
    isNewHighScore: highScores.isNewHighScore,
    showGameEndDialog,
  };
  
  const gameActions: GameActions = {
    startNewGame: () => { /* ... */ },
    handleCellClick: board.handleCellClick,
    handleCellHover: board.handleCellHover,
    handleCellLeave: board.handleCellLeave,
    handleNewGameFromDialog: () => { /* ... */ },
    handleCloseDialog: () => { /* ... */ },
  };
  
  return [gameState, gameActions];
};
```

## Testing Strategy

### Unit Tests
```typescript
// Test each focused hook individually
import { renderHook, act } from '@testing-library/react';
import { useGameBoard, useGameTimer, useGameAnimation, useHighScores } from '../hooks';

describe('useGameBoard', () => {
  it('should manage board state correctly', () => {
    const { result } = renderHook(() => useGameBoard());
    expect(result.current.board).toBeDefined();
    expect(result.current.selected).toBeNull();
  });
});

describe('useGameTimer', () => {
  it('should manage timer state correctly', () => {
    const { result } = renderHook(() => useGameTimer());
    expect(result.current.timer).toBe(0);
    expect(result.current.timerActive).toBe(false);
  });
});

describe('useGameAnimation', () => {
  it('should manage animation state correctly', () => {
    const { result } = renderHook(() => useGameAnimation());
    expect(result.current.movingBall).toBeNull();
    expect(result.current.movingStep).toBe(0);
  });
});

describe('useHighScores', () => {
  it('should manage high scores correctly', () => {
    const { result } = renderHook(() => useHighScores());
    expect(result.current.currentHighScore).toBe(0);
    expect(result.current.isNewHighScore).toBe(false);
  });
});
```

### Integration Tests
```typescript
// Test that hooks work together correctly
describe('Game State Integration', () => {
  it('should work with all hooks combined', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current[0]).toBeDefined(); // GameState
    expect(result.current[1]).toBeDefined(); // GameActions
  });
});
```

This PRP ensures a clean, maintainable codebase with focused, testable hooks that follow the single responsibility principle. 
