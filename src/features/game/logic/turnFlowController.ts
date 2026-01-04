import type { GameState, Coord, TurnPhase } from "../types";
import { TurnPhase as TurnPhaseEnum } from "../types/enums";
import { ANIMATION_DURATIONS } from "../config";
import { GameEngine } from "./gameEngine";

/**
 * UI Update callbacks
 */
export interface UIUpdateCallbacks {
  onGameStateUpdate: (state: GameState) => void;
  onUIUpdate: (update: {
    type: "pop" | "grow" | "floatingScore";
    data: unknown;
  }) => void;
  onAnimationComplete: (phase: TurnPhase) => Promise<void>;
}

/**
 * Turn Flow Controller
 *
 * Manages the state update sequence using a custom state machine.
 * Orchestrates the flow: user move → check lines → pop → check blocked → grow → check lines → pop → complete
 */
export class TurnFlowController {
  private gameEngine: GameEngine;

  constructor() {
    this.gameEngine = new GameEngine();
  }

  /**
   * Execute a complete turn following the required sequence:
   * 1. User moves ball
   * 2. Check for lines
   * 3. Pop if lines found
   * 4. Check blocked preview balls
   * 5. Grow balls
   * 6. Check for lines after grow
   * 7. Pop if lines found
   * 8. Complete turn
   */
  async executeTurn(
    gameState: GameState,
    move: { from: Coord; to: Coord },
    callbacks: UIUpdateCallbacks,
  ): Promise<GameState> {
    let currentState = gameState;
    const { from, to } = move;

    try {
      // Phase 1: Moving (UI handles animation)
      await callbacks.onAnimationComplete(TurnPhaseEnum.Moving);

      // Phase 2: Move ball and check for lines
      const moveResult = this.gameEngine.moveBall(currentState, from, to);
      currentState = moveResult.newState;

      // Update game state in React so the ball is visible at destination before popping
      callbacks.onGameStateUpdate(currentState);

      const lineResult = this.gameEngine.detectLines(currentState, to);
      const steppedOnIncomingBall = moveResult.steppedOnIncomingBall;

      if (lineResult) {
        // Phase 3: Pop lines
        // Trigger pop animation FIRST (before removing balls from state)
        callbacks.onUIUpdate({
          type: "pop",
          data: {
            balls: lineResult.ballsToRemove,
          },
        });

        // Add floating score
        if (lineResult.ballsToRemove.length > 0) {
          const centerX =
            lineResult.ballsToRemove.reduce((sum, [x]) => sum + x, 0) /
            lineResult.ballsToRemove.length;
          const centerY =
            lineResult.ballsToRemove.reduce((sum, [, y]) => sum + y, 0) /
            lineResult.ballsToRemove.length;
          callbacks.onUIUpdate({
            type: "floatingScore",
            data: {
              score: lineResult.score,
              x: Math.round(centerX),
              y: Math.round(centerY),
            },
          });
        }

        // Wait for animation to complete
        await new Promise((resolve) =>
          setTimeout(resolve, ANIMATION_DURATIONS.POP_BALL),
        );
        await callbacks.onAnimationComplete(TurnPhaseEnum.Popping);

        // NOW update the game state (remove balls after animation)
        currentState = this.gameEngine.updateScore(
          currentState,
          lineResult.score,
        );
        currentState = this.gameEngine.removeLines(
          currentState,
          lineResult.lines,
        );
        currentState = this.gameEngine.updateStatistics(currentState, {
          linesPopped: lineResult.lines.length,
          longestLinePopped: Math.max(...lineResult.lines.map((l) => l.length)),
        });
        callbacks.onGameStateUpdate(currentState);

        // Note: wasSteppedOnBallPopped is not needed when line is popped
        // because we skip conversion anyway

        // Phase 4: When lines are popped, we skip conversion
        // Preview balls remain in their positions - no need to check or recalculate
        // (They can't be blocked because we just removed balls, creating space)

        // Phase 5: When line was popped, skip conversion - keep incoming balls as they are
        // No grow animation needed since no balls are converting
        // No UI update needed - no balls to grow
        await new Promise((resolve) =>
          setTimeout(resolve, ANIMATION_DURATIONS.GROW_BALL),
        );
        await callbacks.onAnimationComplete(TurnPhaseEnum.Growing);

        // Check game over (board might be full even with incoming balls)
        const boardWithIncomingAsReal = currentState.board.map((row) =>
          row.map((cell) => ({
            ...cell,
            ball: cell.incomingBall ? cell.incomingBall : cell.ball,
          })),
        );
        if (
          this.gameEngine.checkGameOver({
            ...currentState,
            board: boardWithIncomingAsReal,
          })
        ) {
          currentState = {
            ...currentState,
            gameOver: true,
            showGameEndDialog: true,
          };
          callbacks.onGameStateUpdate(currentState);
          return currentState;
        }
        return currentState;
      } else {
        // No lines formed, proceed with ball conversion
        // Note: No need to check blocked preview balls here because
        // convertPreviewToReal will handle conversion and place new preview balls

        // Phase 5: Convert preview to real and grow
        const conversionResult = this.gameEngine.convertPreviewToReal(
          currentState,
          steppedOnIncomingBall,
          false,
        );

        // Track transitioning and new balls for animation
        const transitioningBalls: { x: number; y: number; color: string }[] =
          [];
        const newPreviewBalls: { x: number; y: number; color: string }[] = [];

        for (let y = 0; y < conversionResult.newBoard.length; y++) {
          const newRow = conversionResult.newBoard[y];
          const oldRow = currentState.board[y];
          if (!newRow || !oldRow) continue;
          for (let x = 0; x < newRow.length; x++) {
            const newCell = newRow[x];
            const oldCell = oldRow[x];
            if (!newCell || !oldCell) continue;
            if (oldCell.incomingBall && newCell.ball) {
              transitioningBalls.push({
                x,
                y,
                color: oldCell.incomingBall.color,
              });
            }
            if (newCell.incomingBall && !oldCell.incomingBall) {
              newPreviewBalls.push({
                x,
                y,
                color: newCell.incomingBall.color,
              });
            }
          }
        }

        // Phase 6: Check for lines after grow FIRST, before updating state
        // Note: handleIncomingBallConversion already detects lines and removes them
        // The newBoard in conversionResult already has the balls removed
        const hasSpawnedLines = conversionResult.linesFormed && conversionResult.ballsRemoved && conversionResult.pointsEarned !== undefined;

        // Update state with new board and next balls IMMEDIATELY
        // This ensures preview balls are visible and stable
        currentState = {
          ...currentState,
          board: conversionResult.newBoard,
          nextBalls: conversionResult.nextBalls,
        };

        // Update state immediately so preview balls are visible and don't blink
        callbacks.onGameStateUpdate(currentState);

        callbacks.onUIUpdate({
          type: "grow",
          data: {
            transitioning: transitioningBalls,
            new: newPreviewBalls,
          },
        });

        await new Promise((resolve) =>
          setTimeout(resolve, ANIMATION_DURATIONS.GROW_BALL),
        );
        await callbacks.onAnimationComplete(TurnPhaseEnum.Growing);

        // Now handle spawned ball lines if any
        if (hasSpawnedLines) {
          // Phase 7: Pop lines from grown balls
          // The balls have already been removed from conversionResult.newBoard
          // We just need to animate and award points

          // Trigger pop animation FIRST (before updating score)
          callbacks.onUIUpdate({
            type: "pop",
            data: {
              balls: conversionResult.ballsRemoved,
            },
          });

          // Add floating score
          if (conversionResult.ballsRemoved.length > 0) {
            const centerX =
              conversionResult.ballsRemoved.reduce((sum, [x]) => sum + x, 0) /
              conversionResult.ballsRemoved.length;
            const centerY =
              conversionResult.ballsRemoved.reduce(
                (sum, [, y]) => sum + y,
                0,
              ) / conversionResult.ballsRemoved.length;
            callbacks.onUIUpdate({
              type: "floatingScore",
              data: {
                score: conversionResult.pointsEarned,
                x: Math.round(centerX),
                y: Math.round(centerY),
              },
            });
          }

          // Wait for animation to complete
          await new Promise((resolve) =>
            setTimeout(resolve, ANIMATION_DURATIONS.POP_BALL),
          );
          await callbacks.onAnimationComplete(TurnPhaseEnum.PoppingAfterGrow);

          // NOW update the game state (award points and update statistics)
          // The board already has balls removed (in conversionResult.newBoard)
          // Update score and statistics, but DON'T update the board again (it's already correct)
          currentState = this.gameEngine.updateScore(
            currentState, // Board already has balls removed from line 199 update
            conversionResult.pointsEarned,
          );

          // Update statistics if lines information is available
          if (conversionResult.lines) {
            currentState = this.gameEngine.updateStatistics(currentState, {
              linesPopped: conversionResult.lines.length,
              longestLinePopped: Math.max(
                ...conversionResult.lines.map((l) => l.length),
              ),
            });
          }

          // Update state with score/statistics changes (board is already correct)
          callbacks.onGameStateUpdate(currentState);
        }

        // Check game over
        if (
          conversionResult.gameOver ||
          this.gameEngine.checkGameOver(currentState)
        ) {
          currentState = {
            ...currentState,
            gameOver: true,
            showGameEndDialog: true,
          };
          callbacks.onGameStateUpdate(currentState);
        }

        return currentState;
      }
    } catch (error) {
      console.error("Error in turn flow:", error);
      return currentState;
    }
  }

  /**
   * Get the game engine instance
   */
  getGameEngine(): GameEngine {
    return this.gameEngine;
  }
}
