# Preview Balls Blinking - Root Cause and Fix

## Problem Statement

Preview balls are blinking/recalculating after each move, appearing in different positions on each render.

## Root Cause

**Location**: `src/features/game/state/gameStateManager.ts:340-342`

The state is being updated **TWICE** for the same turn:

1. **During turn execution**: `onGameStateUpdate` callback calls `setGameState()` multiple times (lines 206, 280, etc. in turnFlowController.ts)
2. **After promise resolves**: `setGameState(newGameState)` is called again at line 342

This causes React to re-render multiple times with the same state, making preview balls appear to blink.

## The Flow

```
1. User moves ball
2. executeTurn() called
3. During executeTurn():
   - convertPreviewToReal() → places preview balls ONCE
   - onGameStateUpdate() at line 206 → setGameState() called
   - React re-renders with preview balls
   - If spawned lines: onGameStateUpdate() at line 280 → setGameState() called again
4. executeTurn() returns currentState
5. Promise resolves → setGameState(newGameState) called at line 342 ❌ REDUNDANT
6. React re-renders AGAIN with same state → BLINKING
```

## The Fix

**Remove the redundant `setGameState()` call after promise resolution.**

### File: `src/features/game/state/gameStateManager.ts`

**Lines 340-353 - Current code**:

```typescript
.then((newGameState) => {
  // Update state
  setGameState(newGameState);  // ❌ REDUNDANT - already updated via onGameStateUpdate
  statisticsTracker.loadStatistics(newGameState.statistics);

  // Clear moving animation
  setUIState((prev) => ({
    ...prev,
    movingBall: null,
    movingStep: 0,
  }));
  animationState.setMovingBall(null);
  animationState.setMovingStep(0);
})
```

**Fixed code**:

```typescript
.then((newGameState) => {
  // State already updated via onGameStateUpdate callbacks during turn execution
  // Only update statistics tracker and clear animations
  statisticsTracker.loadStatistics(newGameState.statistics);

  // Clear moving animation
  setUIState((prev) => ({
    ...prev,
    movingBall: null,
    movingStep: 0,
  }));
  animationState.setMovingBall(null);
  animationState.setMovingStep(0);
})
```

## Implementation Steps

1. Open `src/features/game/state/gameStateManager.ts`
2. Find line 342: `setGameState(newGameState);`
3. Remove that line
4. Add comment: `// State already updated via onGameStateUpdate callbacks during turn execution`
5. Test: Move a ball and verify preview balls don't blink

## Why This Works

- **Single source of truth**: State updated only via `onGameStateUpdate` callbacks
- **No redundant updates**: Promise resolution doesn't trigger another state update
- **Fewer re-renders**: React only re-renders when state actually changes
- **Stable board references**: Preview balls placed once and stay in same positions

## Testing

After fix:

1. Move a ball
2. Verify preview balls appear once and stay stable (no blinking)
3. Verify state is correct (score, statistics, etc.)
4. Verify animations still work correctly

## Risk Assessment

**Low Risk**:

- Removing a redundant state update
- State is already correct (updated via callbacks)
- Only cleanup code remains in promise handler

## Rollback

If issues occur, restore the `setGameState(newGameState);` line at line 342.
