# Refactoring Plan

## Executive Summary

This document outlines identified antipatterns, fragile code, convoluted logic, and refactoring opportunities in the Lines game codebase. The analysis covers architecture, state management, code organization, type safety, and maintainability concerns.

**TypeScript Best Practices:** This plan emphasizes using strict TypeScript with enums instead of string unions for better type safety, IDE support, and refactoring capabilities. All type definitions should use enums where appropriate (e.g., `TurnPhase`, `LineDirection`, `BallColor`).

---

## 1. State Management Issues

### 1.1 Separation of Game State and UI State

**Problem:**
- Game state (board, score, rules) is mixed with UI state (animations, visual feedback, interactions)
- No clear boundary between pure game logic and presentation concerns
- Game state updates trigger UI updates directly, making it hard to test game logic in isolation
- Current `GameState` interface includes both:
  - Game data: `board`, `score`, `highScore`, `gameOver`, `nextBalls`, `statistics`
  - UI state: `selected`, `hoveredCell`, `pathTrail`, `movingBall`, `poppingBalls`, `growingBalls`, `floatingScores`

**Impact:**
- Cannot test game logic without React/UI dependencies
- Difficult to serialize game state (includes UI state)
- Hard to implement features like replay, undo, or AI players
- UI state changes can trigger unnecessary game logic re-runs

**Refactoring:**
- Create separate `GameState` (pure game data) and `UIState` (presentation)
- `GameState` should contain only:
  - `board: Cell[][]`
  - `score: number`
  - `highScore: number`
  - `gameOver: boolean`
  - `nextBalls: BallColor[]`
  - `statistics: GameStatistics`
  - `timer: number`
  - `timerActive: boolean`
- `UIState` should contain:
  - `selected: { x: number; y: number } | null`
  - `hoveredCell: { x: number; y: number } | null`
  - `pathTrail: [number, number][] | null`
  - `notReachable: boolean`
  - Animation states (moving, popping, growing, floating scores)
- Create `GameEngine` class for pure game logic operations
- UI layer subscribes to game state changes and updates UI state accordingly

**Priority:** Critical

---

### 1.2 State Update Sequence Architecture

**Problem:**
- Current flow mixes game logic and UI updates in nested async chains
- No clear state machine or flow controller
- Sequence is hard to follow and maintain
- Line detection logic is not properly encapsulated

**Required Sequence:**
1. **User clicks a ball** (UI interaction)
2. **User moves a ball** (UI interaction → triggers game logic)
3. **After moved, check for lines** - Encapsulated logic deciding what is a line (pure game logic)
4. **Pop** (UI animation)
5. **Check blocked preview balls, recalculate if needed** (pure game logic)
6. **Grow balls** (UI animation)
7. **Check for lines, pop if new lines formed by grow** (pure game logic + UI animation)
8. **Start new turn** (game state update)

**Current Issues:**
- Steps 3-8 are all mixed in `moveProcessor.ts` with nested timeouts
- Line detection happens in multiple places
- No clear state machine tracking which phase we're in
- Game logic and UI updates are tightly coupled

**Refactoring:**
- Create `GameTurnStateMachine` or `TurnFlowController` that manages the sequence
- Define clear phases using TypeScript enum (strict typing):
  ```typescript
  enum TurnPhase {
    Idle = 'idle',
    Moving = 'moving',                    // Ball is animating
    CheckingLines = 'checkingLines',       // After move, checking for lines
    Popping = 'popping',                  // Animating line removal
    CheckingBlocked = 'checkingBlocked',  // Checking and recalculating preview balls
    Growing = 'growing',                  // Animating ball growth
    CheckingLinesAfterGrow = 'checkingLinesAfterGrow', // Checking for lines from grown balls
    PoppingAfterGrow = 'poppingAfterGrow', // Animating line removal from grown balls
    TurnComplete = 'turnComplete'         // Ready for next turn
  }
  ```
- Encapsulate line detection in `LineDetectionEngine`:
  - Pure function: `detectLines(board: Cell[][], position: [number, number]): LineResult | null`
  - Clear interface: `LineResult` with `lines: Line[]`, `ballsToRemove: [number, number][]`
  - `Line` type: `{ cells: [number, number][], color: BallColor, length: number }`
- Separate game logic functions from UI update functions
- Use event-driven or callback pattern for phase transitions
- Game logic functions return results, UI layer handles animations

**Implementation Structure:**
```typescript
// Pure game logic
class GameEngine {
  moveBall(board: Cell[][], from: Coord, to: Coord): MoveResult
  detectLines(board: Cell[][], position: Coord): LineResult | null
  removeLines(board: Cell[][], lines: Line[]): BoardUpdate
  checkBlockedPreviewBalls(board: Cell[][]): BlockedBallsResult
  recalculatePreviewBalls(board: Cell[][], nextBalls: BallColor[]): BoardUpdate
  convertPreviewToReal(board: Cell[][], nextBalls: BallColor[]): ConversionResult
  checkGameOver(board: Cell[][]): boolean
}

// Flow controller
class TurnFlowController {
  async executeTurn(
    gameState: GameState,
    move: { from: Coord, to: Coord },
    onPhaseChange: (phase: TurnPhase) => void,
    onGameStateUpdate: (update: GameStateUpdate) => void,
    onUIUpdate: (update: UIUpdate) => void
  ): Promise<GameState>
}
```

**Priority:** Critical

---

### 1.3 Monolithic Hook (`gameStateManager.ts`)

**Problem:**
- `useGameStateManager` is a 420-line hook managing too many responsibilities:
  - Timer management
  - Board state
  - Animation state
  - Score management
  - High score tracking
  - UI state (hover, selection, path)
  - Statistics tracking
  - Storage persistence
  - Game flow orchestration

**Impact:**
- Difficult to test individual concerns
- High cognitive load
- Large dependency arrays causing unnecessary re-renders
- Hard to reason about state updates

**Refactoring:**
- After separating game state from UI state:
  - Extract timer logic into `useGameTimer` hook
  - Extract UI interaction state into `useGameUI` hook
  - Extract score management into `useGameScore` hook
  - Create `useGameEngine` hook that wraps `GameEngine` class
  - Create `useTurnFlow` hook that uses `TurnFlowController`
  - Keep `useGameStateManager` as a composition layer that orchestrates these hooks
  - Use context API for shared state that doesn't need frequent updates

**Priority:** High

---

### 1.4 Complex Animation State Management

**Problem:**
- Multiple animation states tracked separately (`movingBall`, `poppingBalls`, `growingBalls`, `floatingScores`, `spawningBalls`)
- Animation phase tracking (`currentPhase`) is defined but underutilized
- Timeout-based cleanup scattered throughout code
- Race conditions possible with overlapping animations

**Impact:**
- Difficult to ensure animations don't conflict
- Memory leaks if timeouts aren't cleaned up
- Hard to debug animation issues

**Refactoring:**
- Create a unified `AnimationManager` class or hook
- Use a state machine pattern for animation phases
- Implement proper cleanup with refs and effect cleanup
- Add animation queue system to prevent conflicts

**Priority:** High

---

### 1.5 String-Based Coordinate Keys

**Problem:**
- Coordinates stored as strings (`${x},${y}`) throughout codebase
- Used in Sets, Maps, and comparisons
- Prone to typos and inconsistent formatting
- No type safety

**Impact:**
- Easy to introduce bugs with string concatenation
- Performance overhead of string operations
- Harder to refactor coordinate handling

**Refactoring:**
- Create a `Coordinate` type/class with proper equality
- Use `[number, number]` tuples consistently
- Create utility functions for coordinate operations
- Replace all string-based coordinate keys

**Priority:** Medium

---

## 2. Complex Logic and Control Flow

### 2.1 Encapsulated Line Detection Logic

**Problem:**
- Line detection logic is scattered and not properly encapsulated
- `handleLineDetection` and `handleMultiPositionLineDetection` have similar but different logic
- Line detection rules are not clearly defined in one place
- No clear `Line` type that represents what constitutes a valid line

**Current Issues:**
- `findLine` function in `lineDetection.ts` finds lines but doesn't clearly define what a line is
- Multiple functions check for lines in different ways
- Line detection happens at different points in the flow without clear contract

**Refactoring:**
- Create `LineDetectionEngine` class or module with clear interface:
  ```typescript
  enum LineDirection {
    Horizontal = 'horizontal',
    Vertical = 'vertical',
    DiagonalDown = 'diagonal-down',
    DiagonalUp = 'diagonal-up'
  }

  interface Line {
    cells: [number, number][];
    color: BallColor;
    length: number;
    direction: LineDirection;
  }

  interface LineDetectionResult {
    lines: Line[];
    ballsToRemove: [number, number][];
    score: number;
  }

  class LineDetectionEngine {
    /**
     * Detects all lines passing through a given position
     * Returns null if no lines found
     */
    detectLinesAtPosition(
      board: Cell[][],
      position: [number, number]
    ): LineDetectionResult | null;

    /**
     * Detects all lines passing through any of the given positions
     * Deduplicates overlapping lines
     */
    detectLinesAtPositions(
      board: Cell[][],
      positions: [number, number][]
    ): LineDetectionResult | null;

    /**
     * Checks if a line is valid (meets minimum length requirement)
     */
    isValidLine(line: Line): boolean;

    /**
     * Calculates score for a line
     */
    calculateLineScore(line: Line): number;
  }
  ```
- Move all line detection logic into this engine
- Use this engine in the state update sequence at the correct phases
- Make line detection rules configurable (MIN_LINE_LENGTH, directions, etc.)

**Priority:** High

---

### 2.2 Nested Async/Timeout Chains (`moveProcessor.ts`)

**Problem:**
- Deep nesting of `setTimeout` calls with async functions
- Complex conditional logic for different game states
- Difficult to follow execution flow
- Error handling is missing in async chains

**Example:**
```typescript
setTimeout(async () => {
  // ... logic ...
  setTimeout(() => {
    // ... more logic ...
    setTimeout(async () => {
      // ... even more logic ...
    }, ANIMATION_DURATIONS.POP_BALL);
  }, ANIMATION_DURATIONS.GROW_BALL);
}, ANIMATION_DURATIONS.POP_BALL);
```

**Impact:**
- Hard to debug timing issues
- Race conditions possible
- Difficult to test
- No error recovery

**Refactoring:**
- After implementing state update sequence architecture (Section 1.2):
  - Replace nested timeouts with `TurnFlowController` that manages phases
  - Use promises with proper async/await for phase transitions
  - Implement animation queue system that waits for animations to complete
  - Add error boundaries and recovery
  - Extract animation sequencing into separate functions
  - Game logic functions return results synchronously
  - UI layer handles animations and calls back when complete

**Priority:** High (after 1.2 is implemented)

---

### 2.3 Convoluted Ball Conversion Logic (`boardManagement.ts`)

**Problem:**
- `handleIncomingBallConversion` has complex nested conditionals
- Three different code paths for handling stepped-on balls
- Logic for tracking spawned positions is duplicated
- Difficult to understand edge cases

**Impact:**
- Easy to introduce bugs when modifying
- Hard to test all scenarios
- Code duplication

**Refactoring:**
- After implementing state update sequence:
  - Extract "check blocked preview balls" logic into `PreviewBallManager`
  - Separate recalculation logic from conversion logic
  - Use strategy pattern for different conversion scenarios
  - Create clear state transitions following the sequence
  - Add comprehensive tests for each path
  - Make preview ball blocking/recalculation part of the turn flow

**Priority:** Medium (after 1.2 is implemented)

---

### 2.4 Magic Numbers and Hardcoded Values

**Problem:**
- Some magic numbers scattered throughout:
  - `600` for screen width check in `App.tsx`
  - `28px` hardcoded in `helpers.ts` (`incomingBallSizeClass`)
  - `4` for ball border in `helpers.ts`
  - Array indices and lengths used directly

**Impact:**
- Hard to maintain and change
- Inconsistent with centralized config approach

**Refactoring:**
- Move all magic numbers to `config.ts`
- Use named constants
- Create CSS custom properties for sizing values

**Priority:** Low

---

## 3. Code Organization and Separation of Concerns

### 3.1 Large Component Files

**Problem:**
- `Game.tsx` (324 lines) mixes:
  - UI rendering
  - Animation state management
  - Score flash logic
  - Keyboard handling
  - Guide management
- `Board.tsx` (229 lines) mixes:
  - Rendering logic
  - Cell state calculation
  - Animation checks
  - Event handling

**Impact:**
- Hard to maintain
- Difficult to test
- Violates single responsibility principle

**Refactoring:**
- Extract `ScoreDisplay` component
- Extract `GameControls` component
- Extract `NextBallsPreview` component
- Extract cell rendering logic into `Cell` component
- Move animation logic to hooks

**Priority:** Medium

---

### 3.2 Business Logic in Components

**Problem:**
- Some business logic scattered in components:
  - Score flash detection in `Game.tsx`
  - Animation checks in `Board.tsx`
  - Path calculation in cell interaction handler

**Impact:**
- Hard to reuse logic
- Difficult to test business logic separately

**Refactoring:**
- Move all business logic to game logic modules
- Components should only handle presentation
- Use hooks to bridge business logic and UI

**Priority:** Medium

---

### 3.3 Inconsistent Error Handling

**Problem:**
- `StorageManager` has try/catch blocks
- Most other code has no error handling
- No error boundaries in React components
- Async operations can fail silently

**Impact:**
- Silent failures
- Poor user experience on errors
- Difficult to debug production issues

**Refactoring:**
- Add error boundaries for React components
- Implement consistent error handling strategy
- Add error logging/reporting
- Graceful degradation for storage failures

**Priority:** Medium

---

## 4. Type Safety and Code Quality

### 4.1 Non-Null Assertions

**Problem:**
- Use of `!` operator in several places:
  - `board[selected.y][selected.x].ball!.color`
  - `queue.shift()!`
  - `prev[cy][cx]!`

**Impact:**
- Potential runtime errors
- Bypasses TypeScript's safety checks
- Indicates missing validation

**Refactoring:**
- Add proper null checks
- Use optional chaining where appropriate
- Create type guards for validation
- Refactor to avoid situations requiring assertions

**Priority:** Medium

---

### 4.2 Unused Types

**Problem:**
- Several types defined in `types/index.ts` but not used:
  - `LineScore` interface
  - `GamePhase` interface
  - `BoardState` interface
  - `AnimationState` interface
  - `AnimationPhase` interface
  - `GameTurnState` interface
  - `TimerState` interface

**Impact:**
- Code clutter
- Confusion about what's actually used
- Maintenance burden

**Refactoring:**
- Remove unused types
- Or implement them if they represent intended architecture
- Use tools like `knip` to identify unused exports
- **Convert to enums**: Replace string union types with TypeScript enums for better type safety:
  - `BallColor` should be an enum instead of `(typeof BALL_COLORS)[number]`
  - `TurnPhase` should be an enum (see Section 1.2)
  - `LineDirection` should be an enum (see Section 2.1)
  - Any other string unions should be converted to enums

**Priority:** Low

---

### 4.3 Inconsistent Type Exports

**Problem:**
- Some types exported from multiple places
- Some types defined inline instead of in types file
- Mix of interfaces and types

**Impact:**
- Confusion about source of truth
- Potential for type drift

**Refactoring:**
- Centralize all types in `types/index.ts`
- Use consistent naming conventions
- Prefer interfaces for extensibility, types for unions/intersections

**Priority:** Low

---

## 5. Performance Concerns

### 5.1 Large Dependency Arrays

**Problem:**
- `useEffect` in `gameStateManager.ts` has 12 dependencies
- `useMemo` calculations could be optimized
- Board re-renders on every state change

**Impact:**
- Unnecessary re-renders
- Performance degradation with complex boards
- Potential infinite loop risks

**Refactoring:**
- Split effects with many dependencies
- Use refs for values that don't need to trigger re-renders
- Memoize expensive calculations
- Use `React.memo` for Board component with proper comparison

**Priority:** Medium

---

### 5.2 Inefficient Board Updates

**Problem:**
- Board state updates create new arrays for entire board
- `board.map((row) => row.map((cell) => ({ ...cell })))` called frequently
- No granular updates

**Impact:**
- Unnecessary object creation
- Memory pressure
- Slower updates

**Refactoring:**
- Use immutable update patterns more efficiently
- Consider using Immer for complex updates
- Only update changed cells when possible
- Use structural sharing where applicable

**Priority:** Low

---

### 5.3 Pathfinding Performance

**Problem:**
- `findUnreachableCells` runs on every hover
- No memoization of path calculations
- BFS runs even when result might be cached

**Impact:**
- Laggy hover interactions
- Unnecessary CPU usage

**Refactoring:**
- Memoize path calculations
- Debounce hover events
- Cache unreachable cells calculation
- Only recalculate when board or selection changes

**Priority:** Medium

---

## 6. Testing and Maintainability

### 6.1 Missing Test Coverage

**Problem:**
- Complex logic in `moveProcessor.ts` likely under-tested
- Animation logic not easily testable
- Integration tests missing for game flow

**Impact:**
- Risk of regressions
- Difficult to refactor safely

**Refactoring:**
- Add unit tests for all game logic functions
- Create test utilities for animation mocking
- Add integration tests for complete game flows
- Aim for >80% coverage on critical paths

**Priority:** High

---

### 6.2 Hard to Test Code

**Problem:**
- Tight coupling makes unit testing difficult
- Timeouts and animations hard to test
- Side effects mixed with pure logic

**Impact:**
- Low test coverage
- Brittle tests
- Slow test execution

**Refactoring:**
- Extract pure functions from side-effect code
- Use dependency injection for timeouts
- Create test doubles for animations
- Separate concerns to enable isolated testing

**Priority:** Medium

---

## 7. Code Duplication

### 7.1 Repeated Board Cloning Pattern

**Problem:**
- `board.map((row) => row.map((cell) => ({ ...cell })))` appears in multiple files
- Similar patterns for board updates throughout

**Impact:**
- Code duplication
- Inconsistent update patterns
- Harder to change update logic

**Refactoring:**
- Create `cloneBoard` utility function
- Create `updateCell` utility function
- Standardize board update patterns

**Priority:** Low

---

### 7.2 Duplicate Line Center Calculation

**Problem:**
- Line center calculation appears in multiple places
- Similar reduce patterns for calculating averages

**Impact:**
- Code duplication
- Potential for inconsistencies

**Refactoring:**
- Extract to utility function
- Reuse in all places

**Priority:** Low

---

## 8. Architecture Improvements

### 8.1 Missing Abstraction Layers

**Problem:**
- Direct manipulation of board state in many places
- No clear separation between game rules and state management
- Storage concerns mixed with game logic
- Game state and UI state are not separated

**Impact:**
- Hard to change storage mechanism
- Difficult to add features like undo/redo, replay, AI players
- Tight coupling between game logic and UI
- Cannot test game logic in isolation

**Refactoring:**
- **Create `GameEngine` class** to encapsulate game rules (pure functions):
  ```typescript
  // Use enum for turn phases (strict TypeScript)
  enum TurnPhase {
    Idle = 'idle',
    Moving = 'moving',
    CheckingLines = 'checkingLines',
    Popping = 'popping',
    CheckingBlocked = 'checkingBlocked',
    Growing = 'growing',
    CheckingLinesAfterGrow = 'checkingLinesAfterGrow',
    PoppingAfterGrow = 'poppingAfterGrow',
    TurnComplete = 'turnComplete'
  }

  class GameEngine {
    // Pure game logic - no side effects
    moveBall(state: GameState, from: Coord, to: Coord): GameState
    detectLines(state: GameState, position: Coord): LineResult | null
    removeLines(state: GameState, lines: Line[]): GameState
    checkBlockedPreviewBalls(state: GameState): BlockedBallsResult
    recalculatePreviewBalls(state: GameState): GameState
    convertPreviewToReal(state: GameState): GameState
    checkGameOver(state: GameState): boolean
    calculateScore(state: GameState, lines: Line[]): number
  }
  ```
- **Create `TurnFlowController`** that orchestrates the sequence:
  ```typescript
  class TurnFlowController {
    async executeTurn(
      gameState: GameState,
      move: { from: Coord, to: Coord },
      callbacks: {
        onGameStateUpdate: (state: GameState) => void,
        onUIUpdate: (update: UIUpdate) => void,
        onAnimationComplete: (phase: TurnPhase) => Promise<void>
      }
    ): Promise<GameState>
  }
  ```
- **Separate persistence layer** - only persist `GameState`, not `UIState`
- **Use command pattern for moves** (enables undo/redo) - each turn is a command
- Create clear boundaries:
  - Game Logic Layer: `GameEngine` (pure, testable)
  - Flow Control Layer: `TurnFlowController` (orchestrates sequence)
  - State Management Layer: React hooks (manages GameState and UIState)
  - UI Layer: React components (renders based on state)

**Priority:** Critical (now part of Phase 0)

---

### 8.2 Inconsistent Naming Conventions

**Problem:**
- Mix of camelCase and inconsistent abbreviations
- Some functions use `handle` prefix, others don't
- Inconsistent naming for similar concepts

**Impact:**
- Harder to discover functionality
- Inconsistent codebase

**Refactoring:**
- Establish naming conventions
- Refactor to consistent patterns
- Document conventions in style guide

**Priority:** Low

---

## 9. Specific Code Smells

### 9.1 Long Parameter Lists

**Problem:**
- `processMove` has 10 parameters
- `handleLineRemoval` has 11 parameters
- `handleBallConversion` has 11 parameters

**Impact:**
- Hard to call correctly
- Easy to pass parameters in wrong order
- Difficult to extend

**Refactoring:**
- Use parameter objects
- Group related parameters
- Use builder pattern where appropriate

**Priority:** Medium

---

### 9.2 Deeply Nested Conditionals

**Problem:**
- Multiple levels of nesting in `Board.tsx` cell rendering
- Complex conditionals in `boardManagement.ts`
- Nested ternaries in some places

**Impact:**
- Hard to read and understand
- Difficult to test all branches

**Refactoring:**
- Extract conditions to named functions
- Use early returns
- Flatten nested structures
- Use lookup tables where appropriate

**Priority:** Medium

---

### 9.3 Commented-Out Code Patterns

**Problem:**
- Some commented code in files
- Unused imports potentially present

**Impact:**
- Code clutter
- Confusion about intent

**Refactoring:**
- Remove commented code
- Use version control for history
- Run `knip` to find unused code

**Priority:** Low

---

## 10. Recommended Refactoring Order

### Phase 0: Critical Foundation - State Separation (Critical Priority)
1. **Separate Game State from UI State**
   - Create `GameState` interface (pure game data only)
   - Create `UIState` interface (presentation state only)
   - Update types to reflect separation
   - Create migration plan for existing code
   - **Testing:**
     - Update existing tests to work with separated state
     - Create test utilities for creating `GameState` and `UIState` test fixtures
     - Add tests verifying state separation (game state is serializable, UI state is not)
     - Update integration tests to handle separated state

2. **Convert to Strict TypeScript Enums**
   - Convert `BallColor` from type alias to enum
   - Create `TurnPhase` enum (not string union)
   - Create `LineDirection` enum (not string union)
   - Replace all string unions with enums throughout codebase
   - Update all type definitions to use enums
   - **Testing:**
     - Update all tests that use string literals to use enum values
     - Add tests verifying enum values are correct
     - Update test fixtures to use enums
     - Ensure enum exhaustiveness checks in tests

3. **Implement State Update Sequence Architecture**
   - Create `TurnPhase` enum and state machine
   - Create `GameEngine` class with pure game logic functions
   - Create `LineDetectionEngine` with encapsulated line detection
   - Create `TurnFlowController` that manages the sequence
   - Implement the exact sequence:
     - User clicks/moves ball (UI)
     - Check for lines (GameEngine)
     - Pop animation (UI)
     - Check blocked preview balls (GameEngine)
     - Grow animation (UI)
     - Check for lines after grow (GameEngine)
     - Pop if needed (UI)
     - Start new turn (GameEngine)
   - **Testing:**
     - Write comprehensive unit tests for `GameEngine` (all methods)
     - Write unit tests for `LineDetectionEngine` (all detection scenarios)
     - Write unit tests for `TurnFlowController` (all phase transitions)
     - Create test doubles for animation callbacks
     - Add integration tests for complete turn flow
     - Test state machine transitions and invalid transitions
     - Add tests for error handling in each phase

4. **Refactor Move Processing**
   - Replace `moveProcessor.ts` with `TurnFlowController`
   - Separate game logic from UI updates
   - Use callbacks/events for phase transitions
   - Remove nested timeout chains
   - **Testing:**
     - Migrate tests from `moveProcessor.test.ts` to `TurnFlowController.test.ts`
     - Update tests to use new callback-based architecture
     - Add tests for animation callback sequencing
     - Test timeout/async behavior with mocked timers
     - Verify old `moveProcessor` tests still pass with new implementation

### Phase 1: Foundation (High Priority)
1. Extract timer logic into separate hook
   - **Testing:**
     - Write unit tests for `useGameTimer` hook
     - Test timer start/stop/pause functionality
     - Test inactivity timeout behavior
     - Test timer persistence and restoration
     - Add tests for edge cases (rapid start/stop, cleanup on unmount)

2. Create coordinate utility functions
   - **Testing:**
     - Write unit tests for all coordinate utility functions
     - Test coordinate equality, hashing, and comparison
     - Test coordinate validation and bounds checking
     - Add tests for coordinate set operations (union, intersection, difference)

3. Refactor animation state management (now separate from game state)
   - **Testing:**
     - Write unit tests for `useGameAnimation` hook
     - Test animation state transitions
     - Test animation cleanup and memory management
     - Test animation queue system
     - Add tests for concurrent animations
     - Mock animation timers in tests

4. Add error boundaries and error handling
   - **Testing:**
     - Write tests for error boundaries
     - Test error recovery mechanisms
     - Add tests for error logging/reporting
     - Test graceful degradation scenarios
     - Add integration tests for error scenarios

### Phase 2: Logic Simplification (High Priority)
1. Complete line detection encapsulation
   - **Testing:**
     - Expand `LineDetectionEngine` test coverage to 100%
     - Test all line directions (horizontal, vertical, diagonal)
     - Test line detection at board edges
     - Test overlapping lines detection
     - Test minimum line length validation
     - Test line deduplication logic
     - Add performance tests for large boards

2. Simplify ball conversion logic (now part of turn flow)
   - **Testing:**
     - Write comprehensive tests for preview ball conversion
     - Test all conversion scenarios (normal, stepped-on, popped)
     - Test blocked preview ball recalculation
     - Test edge cases (board full, no empty cells)
     - Add integration tests for conversion flow

3. Extract pure functions from side effects
   - **Testing:**
     - Write unit tests for all extracted pure functions
     - Verify functions have no side effects
     - Test function purity (same input = same output)
     - Add property-based tests where applicable
     - Test function composition

4. Add comprehensive tests for GameEngine
   - **Testing:**
     - Achieve >95% test coverage for `GameEngine`
     - Test all game rules and edge cases
     - Test game over detection
     - Test score calculation
     - Test board state transitions
     - Add snapshot tests for complex game states
     - Test game state immutability

### Phase 3: Component Refactoring (Medium Priority)
1. Break down large components
   - **Testing:**
     - Update component tests for new component structure
     - Write tests for extracted sub-components
     - Test component integration
     - Update snapshot tests
     - Test component props interfaces

2. Extract business logic from components (now in GameEngine)
   - **Testing:**
     - Verify business logic tests are in GameEngine tests (not component tests)
     - Update component tests to focus on rendering and user interaction
     - Remove business logic assertions from component tests
     - Add tests for component-to-GameEngine integration

3. Improve component composition
   - **Testing:**
     - Test component composition patterns
     - Test component reusability
     - Add tests for component variants
     - Test component prop forwarding

4. Add React.memo optimizations
   - **Testing:**
     - Add tests verifying memo prevents unnecessary re-renders
     - Test memo comparison functions
     - Add performance tests for render optimization
     - Verify memo doesn't break functionality

5. Update components to use separated state
   - **Testing:**
     - Update all component tests to use separated GameState/UIState
     - Test component behavior with different state combinations
     - Test state update propagation
     - Verify components don't access wrong state type

### Phase 4: Architecture Improvements (Medium Priority)
1. Complete GameEngine abstraction
   - **Testing:**
     - Finalize GameEngine test suite (100% coverage)
     - Add tests for all public API methods
     - Test engine state immutability
     - Add tests for engine error handling
     - Test engine with various game configurations

2. Implement command pattern for moves (if needed)
   - **Testing:**
     - Write tests for command pattern implementation
     - Test command execution and undo/redo
     - Test command history management
     - Test command validation
     - Add integration tests for command flow

3. Separate persistence layer (only persist GameState, not UIState)
   - **Testing:**
     - Write tests for persistence layer
     - Test GameState serialization/deserialization
     - Verify UIState is not persisted
     - Test persistence error handling
     - Test persistence with corrupted data
     - Add tests for migration from old format

4. Improve type safety
   - **Testing:**
     - Run TypeScript strict mode checks
     - Add type tests using `tsd` or similar
     - Test type narrowing and guards
     - Verify no `any` types remain
     - Test enum exhaustiveness

5. Add state serialization/deserialization
   - **Testing:**
     - Write tests for state serialization
     - Test deserialization with validation
     - Test serialization of all state types
     - Test backward compatibility
     - Test serialization performance
     - Add tests for invalid serialized data handling

### Phase 5: Polish (Low Priority)
1. Remove unused types
   - **Testing:**
     - Verify no tests depend on removed types
     - Run type checking to ensure no broken references
     - Update test type imports

2. Standardize naming
   - **Testing:**
     - Update test files to match new naming conventions
     - Verify test descriptions match new names
     - Update test data and fixtures

3. Remove code duplication
   - **Testing:**
     - Verify deduplicated code is still tested
     - Update tests to use shared utilities
     - Test shared utilities thoroughly

4. Performance optimizations
   - **Testing:**
     - Add performance benchmarks
     - Test optimization impact on functionality
     - Add regression tests for performance
     - Test memory usage improvements

### Phase 6: Test Cleanup and Finalization (Low Priority)
1. **Identify and Remove Obsolete Tests**
   - Audit all test files for obsolete tests
   - Remove tests for deleted/refactored code:
     - Tests for `moveProcessor.ts` (replaced by `TurnFlowController`)
     - Tests for old state management patterns
     - Tests for string union types (replaced by enums)
     - Tests for mixed game/UI state
   - Remove tests for deprecated APIs
   - Remove duplicate tests that test the same functionality

2. **Update Test Structure**
   - Reorganize tests to match new file structure
   - Update test file naming to match source files
   - Consolidate related tests
   - Remove test utilities that are no longer needed

3. **Test Coverage Verification**
   - Run coverage report and verify >80% overall coverage
   - Identify and fill coverage gaps
   - Remove tests that don't add value (dead code paths)
   - Ensure critical paths have >95% coverage

4. **Test Performance**
   - Optimize slow tests
   - Remove or mock expensive operations
   - Parallelize test execution where possible
   - Update test timeouts if needed

5. **Test Documentation**
   - Document test utilities and helpers
   - Add test strategy documentation
   - Document test data fixtures
   - Update test README if applicable

6. **Final Test Suite Validation**
   - Run full test suite and verify all tests pass
   - Verify test suite runs in CI/CD
   - Check test execution time is acceptable
   - Ensure no flaky tests remain

7. **Dead Code and Dependency Cleanup**
   - Check for dead code using tools (knip, etc.)
   - Remove unused imports and exports
   - Identify and remove obsolete dependencies
   - Clean up unused test utilities and helpers
   - Verify all dependencies are actually used
   - Remove dependencies that are no longer needed

---

## 11. Success Metrics

- **Code Quality:**
  - Reduce cyclomatic complexity
  - Increase test coverage to >80%
  - Reduce file sizes (target: <200 lines per file)

- **Maintainability:**
  - Reduce coupling between modules
  - Improve code organization
  - Better separation of concerns

- **Performance:**
  - Reduce unnecessary re-renders
  - Improve animation smoothness
  - Faster game state updates

- **Developer Experience:**
  - Easier to add new features
  - Clearer code structure
  - Better error messages

---

## 12. Risks and Mitigation

### Risks:
1. **Breaking existing functionality** - Extensive refactoring could introduce bugs
2. **Time investment** - Large refactoring effort
3. **Team coordination** - Need to coordinate changes

### Mitigation:
1. **Incremental refactoring** - Do changes in small, testable increments
2. **Comprehensive testing** - Ensure tests pass after each change
3. **Feature flags** - Use feature flags for major architectural changes
4. **Code reviews** - Thorough reviews for each refactoring PR
5. **Documentation** - Document architectural decisions

---

---

## 13. File Structure and Naming Conventions

### 13.1 Current Structure Analysis

**Current Structure:**
```
src/
├── components/
│   ├── game/          # Game-specific components
│   └── ui/            # Reusable UI components
├── game/
│   ├── logic/         # Core game logic
│   ├── state/         # State management
│   ├── types/         # TypeScript types
│   ├── config.ts
│   ├── statisticsTracker.ts
│   └── storageManager.ts
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── App.tsx
└── main.tsx
```

**Issues Identified:**

1. **Inconsistent Naming Patterns:**
   - `cellInteractionHandler.ts` (handler suffix)
   - `gameStateManager.ts` (manager suffix)
   - `moveProcessor.ts` (processor suffix)
   - `statisticsTracker.ts` (tracker suffix)
   - `storageManager.ts` (manager suffix)
   - No consistent pattern for naming files

2. **Mixed Organization Principles:**
   - `game/state/` contains both hooks and processors
   - `game/logic/` is well-organized but `game/state/` mixes concerns
   - Components split by domain (`game/` vs `ui/`) but could be feature-based

3. **Import Path Issues:**
   - Deep relative imports (`../../game/state`)
   - Inconsistent use of index files
   - Some barrel exports, some direct imports

4. **Test File Organization:**
   - Tests co-located (good)
   - But naming inconsistent: `PreviewBalls.test.tsx` vs `moveProcessor.test.ts`

5. **Tailwind Configuration:**
   - Large safelist (72+ entries) - should use theme instead
   - CSS custom properties mixed with Tailwind theme
   - Some arbitrary values in components

---

### 13.2 Recommended File Structure (React Best Practices)

**Proposed Structure:**
```
src/
├── app/                    # App-level configuration
│   ├── App.tsx
│   └── App.test.tsx
├── features/               # Feature-based organization
│   └── game/
│       ├── components/     # Feature-specific components
│       │   ├── Board/
│       │   │   ├── Board.tsx
│       │   │   ├── Board.test.tsx
│       │   │   ├── BoardCell.tsx
│       │   │   └── index.ts
│       │   ├── Game/
│       │   │   ├── Game.tsx
│       │   │   ├── Game.test.tsx
│       │   │   ├── GameControls.tsx
│       │   │   ├── GameHeader.tsx
│       │   │   ├── NextBallsPreview.tsx
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── hooks/          # Feature-specific hooks
│       │   ├── useGameState.ts
│       │   ├── useGameTimer.ts
│       │   ├── useGameAnimation.ts
│       │   ├── useGameBoard.ts
│       │   └── index.ts
│       ├── logic/          # Pure game logic
│       │   ├── board/
│       │   │   ├── boardManagement.ts
│       │   │   ├── boardManagement.test.ts
│       │   │   └── index.ts
│       │   ├── pathfinding/
│       │   │   ├── pathfinding.ts
│       │   │   ├── pathfinding.test.ts
│       │   │   └── index.ts
│       │   ├── lines/
│       │   │   ├── lineDetection.ts
│       │   │   ├── lineDetection.test.ts
│       │   │   └── index.ts
│       │   ├── scoring/
│       │   │   ├── scoring.ts
│       │   │   ├── scoring.test.ts
│       │   │   └── index.ts
│       │   ├── validation/
│       │   │   ├── validation.ts
│       │   │   ├── validation.test.ts
│       │   │   └── index.ts
│       │   ├── moves/
│       │   │   ├── moveHandler.ts
│       │   │   ├── moveProcessor.ts
│       │   │   ├── moveHandler.test.ts
│       │   │   ├── moveProcessor.test.ts
│       │   │   └── index.ts
│       │   ├── balls/
│       │   │   ├── ballGeneration.ts
│       │   │   ├── ballGeneration.test.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── state/          # State management
│       │   ├── gameState.ts
│       │   ├── gameState.test.ts
│       │   ├── cellInteraction.ts
│       │   └── index.ts
│       ├── services/       # Side effects and external services
│       │   ├── storage/
│       │   │   ├── storageManager.ts
│       │   │   ├── storageManager.test.ts
│       │   │   └── index.ts
│       │   └── statistics/
│       │       ├── statisticsTracker.ts
│       │       ├── statisticsTracker.test.ts
│       │       └── index.ts
│       ├── types/          # Feature-specific types
│       │   └── index.ts
│       ├── config.ts       # Feature configuration
│       └── index.ts        # Public API
├── shared/                 # Shared across features
│   ├── components/         # Reusable UI components
│   │   ├── FloatingScore/
│   │   │   ├── FloatingScore.tsx
│   │   │   └── index.ts
│   │   ├── GameEndDialog/
│   │   │   ├── GameEndDialog.tsx
│   │   │   └── index.ts
│   │   ├── Guide/
│   │   │   ├── Guide.tsx
│   │   │   └── index.ts
│   │   ├── SmallScreenWarning/
│   │   │   ├── SmallScreenWarning.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── hooks/             # Shared hooks
│   │   ├── useKeyboard.ts
│   │   ├── useKeyboard.test.ts
│   │   └── index.ts
│   ├── utils/             # Shared utilities
│   │   ├── formatters.ts
│   │   ├── formatters.test.ts
│   │   ├── helpers.ts
│   │   ├── helpers.test.ts
│   │   └── index.ts
│   └── types/             # Shared types
│       └── index.ts
├── styles/                 # Global styles
│   ├── index.css
│   └── tailwind.css
├── main.tsx
└── vite-env.d.ts
```

**Benefits:**
- Feature-based organization (scales better)
- Co-location of related files
- Clear separation of concerns
- Easier to find and maintain code
- Better tree-shaking opportunities
- Clearer import paths

---

### 13.3 Naming Conventions

#### File Naming

**Current Issues:**
- Inconsistent suffixes (`handler`, `manager`, `processor`, `tracker`)
- Mixed casing in some places
- Unclear what some files contain

**Proposed Conventions:**

1. **Components:**
   - Use PascalCase: `Board.tsx`, `GameHeader.tsx`
   - Co-locate in folders: `Board/Board.tsx`
   - Index files for clean imports: `Board/index.ts`

2. **Hooks:**
   - Prefix with `use`: `useGameState.ts`, `useGameTimer.ts`
   - Descriptive names indicating purpose

3. **Utilities/Helpers:**
   - Use camelCase: `formatters.ts`, `helpers.ts`
   - Group by domain: `boardUtils.ts`, `animationUtils.ts`

4. **Services/Managers:**
   - Use descriptive nouns: `storageService.ts`, `statisticsService.ts`
   - Avoid generic suffixes like "Manager" or "Handler"
   - Use "Service" for external interactions, plain names for domain logic

5. **Logic Functions:**
   - Use camelCase: `pathfinding.ts`, `lineDetection.ts`
   - Group related functions in modules
   - Use verbs for functions: `findPath`, `detectLines`, `calculateScore`

6. **Types:**
   - Use PascalCase: `GameState`, `Cell`, `BallColor`
   - Co-locate with feature or in shared types

7. **Tests:**
   - Match source file name: `Board.test.tsx`, `pathfinding.test.ts`
   - Co-locate with source files

**Examples of Renames:**
- `cellInteractionHandler.ts` → `cellInteraction.ts` (or move to hook)
- `gameStateManager.ts` → `gameState.ts` (or split into hooks)
- `moveProcessor.ts` → `processMove.ts` or keep in `moves/` folder
- `statisticsTracker.ts` → `statisticsService.ts` or `statistics.ts`
- `storageManager.ts` → `storageService.ts`

---

### 13.4 Import Path Improvements

**Current Issues:**
- Deep relative imports: `../../game/state`
- Inconsistent use of index files
- Some barrel exports cause circular dependency risks

**Proposed Solutions:**

1. **Use Path Aliases:**
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "paths": {
         "@features/*": ["src/features/*"],
         "@shared/*": ["src/shared/*"],
         "@app/*": ["src/app/*"]
       }
     }
   }
   ```

2. **Clean Import Examples:**
   ```typescript
   // Before
   import { useGameState } from "../../game/state";
   import { formatTime } from "../../utils/formatters";

   // After
   import { useGameState } from "@features/game";
   import { formatTime } from "@shared/utils";
   ```

3. **Index Files Strategy:**
   - Use index files for public APIs only
   - Avoid deep barrel exports that re-export everything
   - Prefer explicit imports for internal modules

---

### 13.5 Tailwind CSS Best Practices

#### Current Issues

1. **Large Safelist (72+ entries):**
   - Many classes that should be in theme
   - Arbitrary values that could be design tokens
   - Hard to maintain

2. **Mixed Approaches:**
   - CSS custom properties for some values
   - Tailwind theme for others
   - Inline styles in some components

3. **Component Classes:**
   - Good use of `@layer components`
   - But some classes could be utilities

#### Proposed Improvements

1. **Reduce Safelist:**
   ```javascript
   // Remove from safelist, use theme instead
   safelist: [
     // Only truly dynamic classes that can't be detected
     // Most should be in theme or components
   ]
   ```

2. **Consolidate Design Tokens:**
   ```javascript
   theme: {
     extend: {
       spacing: {
         // All spacing values
         'cell': '56px',
         'ball': '40px',
         'gap': '8px',
         'board-padding': '8px',
       },
       colors: {
         // Already good, but ensure consistency
       },
       animation: {
         // All animations
       }
     }
   }
   ```

3. **Use CSS Custom Properties Strategically:**
   - Keep for runtime values (responsive sizing)
   - Use Tailwind theme for static values
   - Document when to use each approach

4. **Component Class Organization:**
   ```css
   @layer components {
     /* Game-specific components */
     .game-board { /* ... */ }
     .game-cell { /* ... */ }
     .game-ball { /* ... */ }

     /* UI components */
     .game-button { /* ... */ }
     .game-score { /* ... */ }
   }
   ```

5. **Avoid Arbitrary Values:**
   ```typescript
   // Before
   className="w-[28px] h-[28px]"

   // After - add to theme
   className="w-preview-ball h-preview-ball"
   // or use existing utility
   className="w-7 h-7" // if 28px = 7 * 4px
   ```

6. **Responsive Design Tokens:**
   ```javascript
   // Use CSS custom properties for responsive values
   // Keep in Tailwind plugin as currently done
   // But document the pattern clearly
   ```

---

### 13.6 Component Organization Best Practices

#### Current Structure
- `components/game/` - Game components
- `components/ui/` - UI components

#### Proposed Structure

**Feature-Based Organization (Recommended)**
```
features/game/components/
  ├── Board/
  ├── Game/
  └── ...
shared/components/
  ├── FloatingScore/
  ├── GameEndDialog/
  └── ...
```

**Component Folder Structure:**
```
Board/
├── Board.tsx           # Main component
├── Board.test.tsx      # Tests
├── BoardCell.tsx      # Sub-components
├── BoardCell.test.tsx
├── Board.types.ts      # Component-specific types
├── Board.styles.ts     # If using CSS modules (optional)
└── index.ts            # Public exports
```

---

### 13.7 Migration Strategy

#### Phase 1: Establish Patterns (Low Risk)
1. Add path aliases to `tsconfig.json`
2. Create index files for clean exports
3. Start using aliases in new code
4. Document naming conventions

#### Phase 2: Reorganize Logic (Medium Risk)
1. Move logic files to feature-based structure
2. Update imports gradually
3. Keep old structure temporarily with re-exports
4. Remove old structure after migration

#### Phase 3: Reorganize Components (Medium Risk)
1. Move components to feature folders
2. Update imports
3. Test thoroughly
4. Remove old locations

#### Phase 4: Optimize Tailwind (Low Risk)
1. Move safelist entries to theme
2. Replace arbitrary values
3. Document design token system
4. Update components to use new tokens

#### Phase 5: Final Cleanup (Low Risk)
1. Remove unused files
2. Update documentation
3. Ensure all imports use aliases
4. Run full test suite

---

### 13.8 File Structure Refactoring Checklist

- [ ] Add path aliases to `tsconfig.json`
- [ ] Create feature-based folder structure
- [ ] Move game logic to `features/game/logic/`
- [ ] Move game components to `features/game/components/`
- [ ] Move shared components to `shared/components/`
- [ ] Create index files for public APIs
- [ ] Update all imports to use aliases
- [ ] Rename files to follow conventions
- [ ] Consolidate Tailwind safelist
- [ ] Move design tokens to theme
- [ ] Update component folder structure
- [ ] Update documentation
- [ ] Run full test suite
- [ ] Verify build works
- [ ] Check bundle size impact

---

## Conclusion

This refactoring plan addresses the most critical issues while providing a roadmap for incremental improvements. The focus should be on:

1. **State separation (Critical)** - Separate game state from UI state to enable testable game logic
2. **State update sequence (Critical)** - Implement clear sequence with proper encapsulation of line detection
3. **State management** - Breaking down the monolithic hook after state separation
4. **Complex logic** - Simplifying async chains using the turn flow controller
5. **Code organization** - Better separation of concerns with GameEngine abstraction
6. **File structure** - Feature-based organization with consistent naming
7. **Tailwind optimization** - Reduce safelist, use theme properly
8. **Type safety** - Removing unsafe patterns
9. **Testing** - Improving testability and coverage (now possible with separated game state)

### Key Architectural Changes

The most critical change is **separating game state from UI state** and implementing a **clear state update sequence**:

1. **Game State** (pure, serializable, testable):
   - Board configuration
   - Score, statistics
   - Game status (gameOver, etc.)
   - Next balls
   - Timer

2. **UI State** (presentation, not serialized):
   - Selected cell, hovered cell
   - Path preview
   - Animation states
   - Visual feedback

3. **State Update Sequence** (enforced by TurnFlowController):
   - User interaction → Game logic → UI animation → Game logic → UI animation → ...
   - Clear phases with callbacks for transitions
   - Game logic is synchronous and pure
   - UI handles animations and notifies when complete

4. **GameEngine** (pure game logic):
   - All game rules in one place
   - No side effects
   - Fully testable
   - Can be used for AI, replay, undo/redo

By following this plan incrementally, starting with Phase 0 (state separation), the codebase will become more maintainable, testable, and easier to extend with new features. The separation of game state from UI state is the foundation that enables all other improvements.

---

## 14. Open Questions and Potential Issues

This section documents open questions, potential problems, and areas that may have been missed in the refactoring plan. These should be addressed during implementation.

### 14.1 Architecture Questions

1. **State Machine Implementation**
   - **Decision**: Use custom implementation for `TurnFlowController`
   - **Rationale**:
     - The state machine is relatively simple (9 phases, mostly linear flow)
     - Async operations are straightforward (wait for animation callbacks)
     - Bundle size consideration (avoid ~15-20KB dependency)
     - Flow is well-defined and unlikely to become significantly more complex
     - Custom implementation (~200-300 lines) will be easier for team to understand and maintain
     - Aligns with team preference to minimize dependencies
   - How should state machine transitions be tested?
   - Should phase transitions be logged for debugging?

2. **GameEngine Design**
   - **Decision**: `GameEngine` needs to support game reset functionality (for reset button)
   - No configuration changes needed (board size is fixed)
   - No replay functionality needed
   - Can be instantiated per game or as a stateless utility class

3. **Animation System**
   - **Decision**: Continue with CSS animations (no need for Framer Motion or other libraries)
   - **Decision**: Animations must be non-blocking and queued if needed
   - **Decision**: Ball click must always be possible during other animations
   - Animation durations are set in code (not configurable, not an issue)
   - How should animation timing be coordinated across multiple animations?
   - How to handle animation failures or errors?

4. **Persistence Strategy**
   - **Decision**: Game state should be persisted automatically after every turn
   - **Decision**: If localStorage is disabled, game continues without persistence (state only)
   - **Decision**: Invalid/corrupted saved state → reset game
   - **Decision**: No need to support loading old game states or migration
   - Handle storage quota exceeded errors gracefully (continue without persistence)

### 14.2 Implementation Concerns

1. **Performance**
   - Will the new architecture introduce performance regressions?
   - How to ensure GameEngine operations remain fast with large boards?
   - Should pathfinding be memoized/cached?
   - Are there performance implications of separating game/UI state?

2. **Testing**
   - **Decision**: Keep Vitest as testing framework
   - **Decision**: No visual regression testing needed
   - How to test animation callbacks without flakiness?
   - How to test state machine edge cases comprehensively?
   - What's the strategy for testing async turn flow?

3. **Migration**
   - **Decision**: No migration needed - invalid data results in game reset
   - **Decision**: No need to support loading old game states
   - **Decision**: No need to handle games in progress during migration

4. **Type Safety**
   - Are there any runtime type validations needed beyond TypeScript?
   - How to ensure enum values match between client and persisted data?
   - Should we use runtime type checking libraries (e.g., Zod)?

### 14.3 Potential Edge Cases

1. **Game Logic Edge Cases**
   - **Decision**: If multiple lines detected simultaneously → pop all separately, add score separately
   - **Decision**: If preview balls can't be placed (board nearly full) → they won't be placed
   - How to handle board full scenarios during ball conversion?
   - How to handle rapid user interactions (click spam)?

2. **Animation Edge Cases**
   - **Decision**: Animations are non-blocking - ball clicks always possible during animations
   - **Decision**: Animations should be queued if needed to prevent conflicts
   - **Decision**: Animation durations are set in code (not 0 or negative - not an issue)
   - How to handle animation during window blur/focus?
   - How to handle animation callbacks that throw errors?

3. **State Management Edge Cases**
   - **Decision**: Game state update should not fail mid-turn - add tests to ensure this
   - **Decision**: UI state is calculated from game state - they should not get out of sync (add tests)
   - **Decision**: Corrupted state → reset game
   - How to handle concurrent state updates?

4. **Browser/Environment Issues**
   - **Decision**: If localStorage is disabled → game continues without persistence (state only)
   - What if browser tab is inactive during timer?
   - How to handle low memory scenarios?
   - What about browser compatibility for CSS custom properties?

### 14.4 Missing Considerations

1. **Accessibility**
   - Are keyboard navigation tests included?
   - How to ensure screen reader compatibility?
   - Are focus management tests needed?
   - Should we add ARIA labels and roles?

2. **Error Handling**
   - Are all error paths tested?
   - **Decision**: No error monitoring service (e.g., Sentry) needed
   - How to handle network errors (if applicable)?
   - What's the user-facing error message strategy?

3. **Documentation**
   - **Decision**: No additional documentation tools (TypeDoc, JSDoc) needed
   - Are architecture diagrams needed?
   - Should we document the state machine transitions?
   - Do we need developer onboarding documentation?

4. **Code Quality**
   - Should we add pre-commit hooks for additional checks?
   - Are there code complexity metrics we should track?
   - Should we enforce test coverage thresholds per file?
   - Do we need automated dependency updates?

### 14.5 Technical Debt

1. **Legacy Code**
   - Are there any legacy patterns that should be documented before removal?
   - Should we create migration guides for contributors?
   - Are there deprecated APIs that need deprecation warnings?

2. **Dependencies**
   - **Action**: Check for dead code and obsolete dependencies at the end of refactoring
   - **Action**: Clean up unused dependencies
   - Are all dependencies necessary?
   - Should we audit for security vulnerabilities?
   - Are there opportunities to reduce bundle size?
   - Should we consider alternative libraries?

3. **Build & Deployment**
   - Are build times acceptable?
   - Should we optimize bundle splitting?
   - Are there opportunities for code splitting?
   - Should we add bundle size monitoring?

### 14.6 Validation Needed

1. **Assumptions**
   - Verify that separating game/UI state doesn't break existing functionality
   - Confirm that enum approach works with all use cases
   - Validate that state machine approach handles all game scenarios
   - Test that performance is acceptable with new architecture

2. **User Experience**
   - Will the refactoring change any user-visible behavior?
   - Are animation timings preserved?
   - Will saved games still work?
   - Is the UI responsiveness maintained?

3. **Team Alignment**
   - Does the team understand the new architecture?
   - Are naming conventions agreed upon?
   - Is the testing strategy clear?
   - Are code review guidelines updated?

### 14.7 Risk Areas

1. **High Risk**
   - State separation migration (could break existing functionality)
   - Turn flow controller implementation (complex async logic)
   - Animation system refactoring (user-visible changes)

2. **Medium Risk**
   - File structure reorganization (import path changes)
   - Enum conversion (type compatibility issues)
   - Test migration (test failures during transition)

3. **Low Risk**
   - Naming convention updates
   - Tailwind optimization
   - Code cleanup

### 14.8 Decision Points

These decisions have been made:

1. **State Machine Library**: ✅ Use custom implementation (not XState)
2. **Testing Framework**: ✅ Keep Vitest
3. **Animation Library**: ✅ Continue with CSS animations only
4. **Error Monitoring**: ✅ No additional service needed
5. **Documentation Tool**: ✅ No additional tools needed
6. **CI/CD**: Enhance pipeline with additional checks? (Still open)

