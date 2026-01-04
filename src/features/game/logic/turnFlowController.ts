import type { GameState, Coord, TurnPhase } from "../types";
import { TurnPhase as TurnPhaseEnum } from "../types/enums";
import { ANIMATION_DURATIONS } from "../config";
import { GameEngine } from "./gameEngine";

/**
 * UI Update callbacks
 */
export interface UIUpdateCallbacks {
      onPhaseChange: (phase: TurnPhase) => void;
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
      callbacks.onPhaseChange(TurnPhaseEnum.Moving);
      await callbacks.onAnimationComplete(TurnPhaseEnum.Moving);

      // Phase 2: Move ball and check for lines
      callbacks.onPhaseChange(TurnPhaseEnum.CheckingLines);
      const moveResult = this.gameEngine.moveBall(currentState, from, to);
      currentState = moveResult.newState;

      // Update game state in React so the ball is visible at destination before popping
      callbacks.onGameStateUpdate(currentState);

      const lineResult = this.gameEngine.detectLines(currentState, to);
      const steppedOnIncomingBall = moveResult.steppedOnIncomingBall;

      if (lineResult) {
        // Phase 3: Pop lines
        callbacks.onPhaseChange(TurnPhaseEnum.Popping);

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
        currentState = this.gameEngine.removeLines(currentState, lineResult.lines);
        currentState = this.gameEngine.updateStatistics(currentState, {
          linesPopped: lineResult.lines.length,
          longestLinePopped: Math.max(
            ...lineResult.lines.map((l) => l.length),
          ),
        });
        callbacks.onGameStateUpdate(currentState);

        // Note: wasSteppedOnBallPopped is not needed when line is popped
        // because we skip conversion anyway

        // Phase 4: Check blocked preview balls
        callbacks.onPhaseChange(TurnPhaseEnum.CheckingBlocked);
        const blockedCheck = this.gameEngine.checkBlockedPreviewBalls(
          currentState,
        );
        if (blockedCheck.needsRecalculation && blockedCheck.newState) {
          currentState = blockedCheck.newState;
          callbacks.onGameStateUpdate(currentState);
        }

        // Phase 5: When line was popped, skip conversion - keep incoming balls as they are
        // No grow animation needed since no balls are converting
        callbacks.onPhaseChange(TurnPhaseEnum.Growing);
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
        if (this.gameEngine.checkGameOver({ ...currentState, board: boardWithIncomingAsReal })) {
          currentState = {
            ...currentState,
            gameOver: true,
            showGameEndDialog: true,
          };
          callbacks.onGameStateUpdate(currentState);
          callbacks.onPhaseChange(TurnPhaseEnum.TurnComplete);
          return currentState;
        }

        callbacks.onPhaseChange(TurnPhaseEnum.TurnComplete);
        return currentState;
      } else {
        // No lines formed, proceed with ball conversion
        // Phase 4: Check blocked preview balls
        callbacks.onPhaseChange(TurnPhaseEnum.CheckingBlocked);
        const blockedCheck = this.gameEngine.checkBlockedPreviewBalls(
          currentState,
        );
        if (blockedCheck.needsRecalculation && blockedCheck.newState) {
          currentState = blockedCheck.newState;
          callbacks.onGameStateUpdate(currentState);
        }

        // Phase 5: Convert preview to real and grow
        callbacks.onPhaseChange(TurnPhaseEnum.Growing);
        const conversionResult = this.gameEngine.convertPreviewToReal(
          currentState,
          steppedOnIncomingBall,
          false,
        );

        // Track transitioning and new balls for animation
        const transitioningBalls: Array<{ x: number; y: number; color: string }> = [];
        const newPreviewBalls: Array<{ x: number; y: number; color: string }> = [];

        for (let y = 0; y < conversionResult.newBoard.length; y++) {
          for (let x = 0; x < conversionResult.newBoard[y].length; x++) {
            const newCell = conversionResult.newBoard[y][x];
            const oldCell = currentState.board[y][x];
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

        currentState = {
          ...currentState,
          board: conversionResult.newBoard,
          nextBalls: conversionResult.nextBalls,
        };

        callbacks.onUIUpdate({
          type: "grow",
          data: {
            transitioning: transitioningBalls,
            new: newPreviewBalls,
          },
        });
        callbacks.onGameStateUpdate(currentState);

        await new Promise((resolve) =>
          setTimeout(resolve, ANIMATION_DURATIONS.GROW_BALL),
        );
        await callbacks.onAnimationComplete(TurnPhaseEnum.Growing);

        // Phase 6: Check for lines after grow
        if (conversionResult.linesFormed && conversionResult.ballsRemoved) {
          callbacks.onPhaseChange(TurnPhaseEnum.CheckingLinesAfterGrow);
          const spawnedPositions: Coord[] = [];
          for (let y = 0; y < conversionResult.newBoard.length; y++) {
            for (let x = 0; x < conversionResult.newBoard[y].length; x++) {
              if (
                conversionResult.newBoard[y][x].ball &&
                !currentState.board[y][x].ball
              ) {
                spawnedPositions.push({ x, y });
              }
            }
          }

          const growLineResult = this.gameEngine.detectLinesAtPositions(
            currentState,
            spawnedPositions,
          );

          if (growLineResult) {
            // Phase 7: Pop lines from grown balls
            callbacks.onPhaseChange(TurnPhaseEnum.PoppingAfterGrow);

            // Trigger pop animation FIRST (before removing balls from state)
            callbacks.onUIUpdate({
              type: "pop",
              data: {
                balls: growLineResult.ballsToRemove,
              },
            });

            // Add floating score
            if (growLineResult.ballsToRemove.length > 0) {
              const centerX =
                growLineResult.ballsToRemove.reduce((sum, [x]) => sum + x, 0) /
                growLineResult.ballsToRemove.length;
              const centerY =
                growLineResult.ballsToRemove.reduce((sum, [, y]) => sum + y, 0) /
                growLineResult.ballsToRemove.length;
              callbacks.onUIUpdate({
                type: "floatingScore",
                data: {
                  score: growLineResult.score,
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

            // NOW update the game state (remove balls after animation)
            currentState = this.gameEngine.updateScore(
              currentState,
              growLineResult.score,
            );
            currentState = this.gameEngine.removeLines(
              currentState,
              growLineResult.lines,
            );
            currentState = this.gameEngine.updateStatistics(currentState, {
              linesPopped: growLineResult.lines.length,
              longestLinePopped: Math.max(
                ...growLineResult.lines.map((l) => l.length),
              ),
            });
            callbacks.onGameStateUpdate(currentState);
          }
        }

        // Check game over
        if (conversionResult.gameOver || this.gameEngine.checkGameOver(currentState)) {
          currentState = {
            ...currentState,
            gameOver: true,
            showGameEndDialog: true,
          };
          callbacks.onGameStateUpdate(currentState);
        }

        callbacks.onPhaseChange(TurnPhaseEnum.TurnComplete);
        return currentState;
      }
    } catch (error) {
      console.error("Error in turn flow:", error);
      callbacks.onPhaseChange(TurnPhaseEnum.TurnComplete);
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

