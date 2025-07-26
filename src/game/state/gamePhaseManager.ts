

export type GamePhaseType = "idle" | "moving" | "popping" | "converting" | "gameOver";

export class GamePhaseManager {
  private currentPhase: GamePhaseType = "idle";

  /**
   * Get the current game phase
   */
  getCurrentPhase(): GamePhaseType {
    return this.currentPhase;
  }

  /**
   * Transition to a new game phase
   */
  transitionTo(newPhase: GamePhaseType): void {
    this.currentPhase = newPhase;
  }

  /**
   * Check if the current phase allows moves
   */
  canMakeMove(): boolean {
    return this.currentPhase === "idle";
  }

  /**
   * Check if the current phase allows animations
   */
  isAnimating(): boolean {
    return this.currentPhase === "moving" || this.currentPhase === "popping";
  }

  /**
   * Check if the game is over
   */
  isGameOver(): boolean {
    return this.currentPhase === "gameOver";
  }

  /**
   * Reset the game phase to idle
   */
  reset(): void {
    this.currentPhase = "idle";
  }
}
