# Lines Game - Feature Planning & Refactoring Analysis

## Project Overview

**Lines** is a React-based puzzle game where players move colored balls to form lines of 5 or more balls. The game is fully functional with a complete feature set including score tracking, high scores, timer functionality, smooth animations, and accessibility features.

## Current Game Features

### Core Gameplay
- **9x9 Game Board**: Interactive grid with colored balls
- **Ball Movement**: Click-to-select and click-to-move with pathfinding
- **Line Detection**: Automatic detection of lines (horizontal, vertical, diagonal) of 5+ balls
- **Scoring System**: Fibonacci-based scoring (5 balls = 5 points, 6 balls = 8 points, etc.)
- **Ball Removal**: Automatic removal of completed lines with animations

### Game Features
- **Next Balls Preview**: Shows upcoming 3 balls to be placed
- **Timer**: Game timer showing elapsed time
- **High Score Tracking**: Local storage persistence of best scores
- **Game Over Detection**: Automatic detection when board is full
- **New Game**: Restart functionality with fresh board

### User Interface
- **Responsive Design**: Works on various screen sizes
- **Smooth Animations**: Ball movement and popping animations
- **Visual Feedback**: Hover effects, path highlighting, reachability indicators
- **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
- **Game Guide**: Toggle-able help panel with rules and scoring

### Technical Features
- **TypeScript**: Full type safety throughout the codebase
- **Custom Game Theme**: Tailwind CSS with game-specific color tokens
- **State Management**: Custom React hooks for game state
- **Pathfinding**: A* algorithm for ball movement
- **Testing**: Comprehensive test coverage with Vitest

## Code Analysis & Refactoring Opportunities

### Critical Issues Identified

#### 1. **Duplicate Game Logic Files**
**Issue**: Two separate game logic implementations exist:
- `src/utils/gameLogic.ts` (legacy/duplicate)
- `src/game/logic/index.ts` (current implementation)

**Impact**: 
- Code duplication and maintenance overhead
- Potential inconsistencies between implementations
- Confusion about which file is authoritative
- Import confusion and potential bugs

**Proposed Solution**: 
- Remove `src/utils/gameLogic.ts` entirely
- Update all imports to use `src/game/logic/index.ts`
- Ensure all functionality is preserved in the canonical location

#### 2. **Duplicate Game State Management**
**Issue**: Two separate game state implementations:
- `src/utils/gameState.ts` (legacy/duplicate)
- `src/game/state/index.ts` (current implementation)

**Impact**:
- Duplicate state management logic
- Potential state synchronization issues
- Increased bundle size
- Maintenance complexity

**Proposed Solution**:
- Remove `src/utils/gameState.ts` entirely
- Update all imports to use `src/game/state/index.ts`
- Consolidate any unique functionality

#### 3. **Inconsistent File Organization**
**Issue**: Game-related files are scattered across `src/utils/` and `src/game/` directories

**Current Structure**:
```
src/
├── utils/
│   ├── gameLogic.ts (DUPLICATE)
│   ├── gameState.ts (DUPLICATE)
│   ├── constants.ts
│   ├── helpers.ts
│   └── ...
└── game/
    ├── logic/
    │   └── index.ts (CANONICAL)
    ├── state/
    │   └── index.ts (CANONICAL)
    └── types/
        └── index.ts
```

**Proposed Structure**:
```
src/
├── game/
│   ├── logic/
│   │   └── index.ts
│   ├── state/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   └── constants.ts (moved from utils)
├── utils/
│   ├── helpers.ts
│   ├── formatters.ts
│   ├── highScoreManager.ts
│   └── configManager.ts
└── ui/
    └── components/
```

### Code Quality Issues

#### 4. **Magic Numbers and Hardcoded Values**
**Issues Found**:
- `1000` (timer interval) in game state
- `5` (minimum line length) hardcoded in multiple places
- `3` (balls per turn) could be configurable
- Animation durations scattered across files

**Proposed Solution**:
- Create `src/game/constants.ts` with all game constants
- Use enums for game states and configurations
- Centralize animation timing constants

#### 5. **Complex State Management**
**Issue**: The game state hook is overly complex (348 lines) with multiple responsibilities

**Proposed Solution**:
- Split into smaller, focused hooks
- Extract animation logic into separate hook
- Create dedicated timer hook
- Separate high score management

#### 6. **Inconsistent Error Handling**
**Issue**: Limited error handling throughout the codebase

**Proposed Solution**:
- Add comprehensive error boundaries
- Implement proper error states for game operations
- Add validation for user inputs
- Create error logging system

### Performance Issues

#### 7. **Inefficient Re-renders**
**Issue**: Components may re-render unnecessarily due to state structure

**Proposed Solution**:
- Implement React.memo for expensive components
- Use useMemo for computed values
- Optimize state updates to minimize re-renders
- Add performance monitoring

#### 8. **Bundle Size Optimization**
**Issue**: Potential for code splitting and lazy loading

**Proposed Solution**:
- Implement lazy loading for non-critical components
- Split game logic into smaller modules
- Optimize imports and remove unused code
- Add bundle analysis

## Proposed Refactoring Plan

### Phase 1: Code Cleanup (High Priority)
1. **Remove Duplicate Files**
   - Delete `src/utils/gameLogic.ts`
   - Delete `src/utils/gameState.ts`
   - Update all imports to use canonical files

2. **Reorganize File Structure**
   - Move `src/utils/constants.ts` to `src/game/constants.ts`
   - Update all import paths
   - Ensure consistent file organization

3. **Extract Constants and Enums**
   - Create comprehensive constants file
   - Replace magic numbers with named constants
   - Add game configuration enums

### Phase 2: State Management Refactoring (High Priority)
1. **Split Game State Hook**
   - Extract animation logic into `useGameAnimation`
   - Create `useGameTimer` for timer management
   - Separate `useHighScores` for score management
   - Create `useGameBoard` for board state

2. **Improve State Structure**
   - Use reducers for complex state updates
   - Implement proper state immutability
   - Add state validation

### Phase 3: Performance Optimization (Medium Priority)
1. **Component Optimization**
   - Add React.memo to expensive components
   - Implement useMemo for computed values
   - Optimize re-render patterns

2. **Bundle Optimization**
   - Implement code splitting
   - Add lazy loading for non-critical features
   - Optimize imports

### Phase 4: Error Handling & Testing (Medium Priority)
1. **Error Boundaries**
   - Add comprehensive error boundaries
   - Implement error recovery mechanisms
   - Add error logging

2. **Testing Improvements**
   - Increase test coverage to >90%
   - Add integration tests for game flows
   - Add performance tests

## Future Feature Priorities

### High Priority Features
1. **Mobile Optimization**: Better touch controls and responsive design

## Implementation Strategy

### Immediate Actions (Next Sprint)
1. **Remove duplicate files** - Eliminate confusion and maintenance overhead
2. **Reorganize file structure** - Establish clear organization patterns
3. **Extract constants** - Improve code maintainability
4. **Add comprehensive tests** - Ensure refactoring doesn't break functionality
5. **Split game state hook** - Improve maintainability and performance
6. **Add error boundaries** - Improve application stability
7. **Optimize components** - Improve performance and user experience

## Success Metrics

### Code Quality Metrics
- **Test Coverage**: >90% (currently ~80%)
- **Duplicate Code**: 0% (currently significant duplication)
- **Magic Numbers**: 0 (currently several instances)
- **File Organization**: Consistent structure (currently inconsistent)

### Performance Metrics
- **Bundle Size**: <500KB (currently unknown)
- **Initial Load Time**: <2s
- **Component Render Time**: <16ms (60fps)
- **Memory Usage**: <50MB

### User Experience Metrics
- **Error Rate**: <1%
- **Accessibility Score**: 100% WCAG 2.1 AA compliance
- **Mobile Performance**: 90+ Lighthouse score
- **User Engagement**: Track completion rates and session duration

This refactoring plan will significantly improve the codebase quality, maintainability, and user experience while preparing the foundation for future feature development.
