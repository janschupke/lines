# Refactoring and Bug Fixing Plan

## Overview
This document outlines the plan to fix three critical bugs in the Lines game:
1. Lines being flagged and popped when unconnected (balls must touch)
2. Preview balls blinking/randomly appearing before turn completion
3. Moving ball and preview ball both rendering when moving ball travels over preview cell

---

## Problem 1: Unconnected Lines Being Popped

### Current Behavior
- Lines are detected and popped even when balls are not actually touching/connected
- Inconsistent behavior - not all disjointed lines are popped
- Line detection doesn't properly verify adjacency/continuity

### Root Cause Analysis
**Location**: `src/features/game/logic/lines/lineDetectionEngine.ts`

The `findLines` method (lines 158-212) checks for balls in a direction by iterating through cells, but the algorithm may have issues:

1. **Adjacency Check**: The algorithm checks cells in direction vectors `[dx, dy]`, but doesn't explicitly verify that each cell is adjacent to the previous one. While the direction vectors should ensure adjacency, there might be edge cases.

2. **Line Continuity**: The algorithm builds lines by checking forward and backward from a position, but doesn't verify that all cells in the line are actually connected (no gaps).

3. **Test Coverage**: The existing tests in `lineDetectionEngine.test.ts` don't test for disconnected lines or gaps in lines.

### Proposed Fix

#### Step 1: Add Adjacency Verification
- Modify `findLines` to explicitly verify that each cell in the line is adjacent to the previous one
- Add a helper function `areAdjacent(x1, y1, x2, y2)` that checks if two cells are neighbors (including diagonals)

#### Step 2: Add Disconnected Line Test Cases
- Create test cases that verify disconnected lines are NOT detected:
  - Balls with gaps (e.g., positions 0,1,2,4,5 should not form a line)
  - Balls that are diagonal but not in a straight line
  - Balls that form a line but with one missing cell in the middle

#### Step 3: Refactor Line Detection Logic
- Ensure the line detection algorithm only detects continuous lines
- Add validation that all cells in a detected line are adjacent to at least one other cell in the line
- Verify that the line follows a single direction vector consistently

#### Step 4: Add Comprehensive Tests
**New test cases needed**:
```typescript
// In lineDetectionEngine.test.ts
- "does not detect line with gap in middle"
- "does not detect line when balls are not touching"
- "does not detect line when direction changes"
- "detects only continuous lines"
```

### Files to Modify
- `src/features/game/logic/lines/lineDetectionEngine.ts`
- `src/features/game/logic/lines/lineDetectionEngine.test.ts`

### Testing Strategy
1. Run existing tests: `npm run test:run`
2. Add new test cases for disconnected lines
3. Verify all line detection scenarios work correctly
4. Test edge cases (board boundaries, diagonal lines, etc.)

---

## Problem 2: Preview Balls Blinking/Randomly Appearing

### Current Behavior
- After a turn, preview balls turn into real balls correctly
- Before turn completion, several balls blink in empty cells randomly
- Multiple recalculations of balls/previews causing visual flicker

### Root Cause Analysis
**Location**: Multiple files involved in preview ball management

1. **State Updates**: In `turnFlowController.ts` (line 209), state is updated immediately after conversion, but there might be multiple state updates happening:
   - Line 59: `callbacks.onGameStateUpdate(currentState)` after move
   - Line 111: `callbacks.onGameStateUpdate(currentState)` after popping
   - Line 209: `callbacks.onGameStateUpdate(currentState)` after conversion
   - Line 284: `callbacks.onGameStateUpdate(currentState)` after spawned lines

2. **Preview Ball Recalculation**: The `handleIncomingBallConversion` function in `boardManagement.ts`:
   - Line 189: `placePreviewBalls` is called, which uses `getRandomEmptyCells`
   - `getRandomEmptyCells` uses `Math.random()` which could cause different positions on each call
   - If called multiple times, preview balls would appear in different positions

3. **React Re-renders**: Multiple state updates could cause React to re-render multiple times, showing intermediate states where preview balls are in different positions.

4. **Animation Timing**: The grow animation (line 219-222 in `turnFlowController.ts`) happens after state update, which might cause visual inconsistencies.

### Proposed Fix

#### Step 1: Stabilize Preview Ball Placement
- Ensure `getRandomEmptyCells` uses a deterministic seed or memoizes results for the same board state
- Or, ensure preview balls are only placed once per turn and not recalculated

#### Step 2: Consolidate State Updates
- Minimize the number of state updates during a turn
- Batch state updates where possible
- Ensure preview balls are only updated once after conversion

#### Step 3: Fix State Update Timing
**In `turnFlowController.ts`**:
- Line 209: Update state with new board and next balls BEFORE grow animation
- Ensure this is the ONLY place where preview balls are updated during conversion
- Remove any duplicate state updates

#### Step 4: Add Memoization
- Memoize the preview ball positions based on board state
- Use a ref to track the last board state and only recalculate if board actually changed

#### Step 5: Prevent Multiple Recalculations
- Add guards to prevent `handleIncomingBallConversion` from being called multiple times
- Track if conversion is in progress and skip if already converting

### Files to Modify
- `src/features/game/logic/turnFlowController.ts`
- `src/features/game/logic/board/boardManagement.ts`
- `src/features/game/state/gameStateManager.ts`

### Testing Strategy
1. Add test to verify preview balls are only placed once per turn
2. Add test to verify no state updates happen between conversion and display
3. Visual testing: Play game and verify no blinking occurs
4. Add logging to track state update frequency

---

## Problem 3: Moving Ball and Preview Ball Both Rendered

### Current Behavior
- When a moving ball travels over a cell with a preview ball, both are rendered alongside each other
- Moving ball should temporarily replace the preview when travelling

### Root Cause Analysis
**Location**: `src/features/game/components/Board/BoardCell.tsx`

The rendering logic (lines 112-147) has these conditions:

1. **Moving Ball Rendering** (lines 112-118):
   - Shows moving ball if `showMovingBall && movingBallColor && !isPopping`
   - Condition: `cell.x === mx && cell.y === my` (current path step)

2. **Regular Ball Rendering** (lines 121-135):
   - Shows if `cell.ball && !hideBall && (!showMovingBall || isPopping)`
   - `hideBall` only hides ball at source cell (lines 61-67)

3. **Preview Ball Rendering** (lines 137-147):
   - Shows if `!cell.ball && cell.incomingBall`
   - **Problem**: When moving ball passes through, `cell.ball` is null, so preview ball still shows

### Proposed Fix

#### Step 1: Hide Preview Ball When Moving Ball is Present
**In `BoardCell.tsx`**:
- Modify preview ball rendering condition to also check if moving ball is at this cell
- Change line 138 from:
  ```typescript
  {!cell.ball && cell.incomingBall && (
  ```
  to:
  ```typescript
  {!cell.ball && cell.incomingBall && !showMovingBall && (
  ```

#### Step 2: Ensure Moving Ball Takes Precedence
- The moving ball should always be shown when it's at a cell, regardless of preview ball
- Preview ball should be hidden when moving ball is at that cell

#### Step 3: Add Test Case
- Create test to verify that when moving ball passes over preview ball, only moving ball is visible
- Test that preview ball reappears after moving ball passes

### Files to Modify
- `src/features/game/components/Board/BoardCell.tsx`
- `src/features/game/components/Board/Board.test.tsx` (add test case)

### Testing Strategy
1. Manual testing: Move ball over preview ball and verify only moving ball shows
2. Add unit test for rendering logic
3. Test edge cases: moving ball at source, destination, and intermediate cells

---

## Implementation Order

### Phase 1: Critical Bug Fixes (High Priority)
1. **Problem 3**: Moving ball/preview ball rendering (Quick fix)
2. **Problem 1**: Line detection connectivity (Core game logic)
3. **Problem 2**: Preview ball blinking (User experience)

### Phase 2: Testing and Validation
1. Run all existing tests
2. Add new test cases for each bug fix
3. Manual testing of all scenarios
4. Performance testing (ensure no regressions)

### Phase 3: Code Quality
1. Refactor any duplicated code
2. Add comments for complex logic
3. Ensure consistent error handling

---

## Test Plan

### Unit Tests
- [ ] Line detection: disconnected lines not detected
- [ ] Line detection: only continuous lines detected
- [ ] Preview balls: only placed once per turn
- [ ] Preview balls: no state updates between conversion and display
- [ ] Rendering: moving ball hides preview ball

### Integration Tests
- [ ] Complete turn flow with line detection
- [ ] Complete turn flow with preview ball conversion
- [ ] Moving ball animation over preview balls

### Manual Testing Checklist
- [ ] Play game and verify lines only pop when connected
- [ ] Verify no preview ball blinking during turns
- [ ] Verify moving ball hides preview ball when passing over
- [ ] Test edge cases (board boundaries, full board, etc.)

---

## Risk Assessment

### Low Risk
- **Problem 3**: Simple rendering logic change, isolated to one component

### Medium Risk
- **Problem 2**: State management changes could affect other parts of game flow
- Need to ensure no regressions in turn execution

### High Risk
- **Problem 1**: Core game logic change - could affect scoring, line detection, game flow
- Requires extensive testing to ensure all line detection scenarios still work

---

## Success Criteria

1. ✅ Lines only pop when balls are actually touching/connected
2. ✅ Preview balls don't blink or randomly appear before turn completion
3. ✅ Moving ball temporarily replaces preview ball when travelling over it
4. ✅ All existing tests pass
5. ✅ New test cases added and passing
6. ✅ No performance regressions
7. ✅ Code is maintainable and well-documented

---

## Notes

- All fixes should maintain backward compatibility with saved game states
- Consider adding telemetry/logging to track these issues in production
- Document any changes to game rules or behavior
- Update user-facing documentation if game behavior changes

