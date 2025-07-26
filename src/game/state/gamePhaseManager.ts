export type GamePhaseType =
  | "idle"
  | "moving"
  | "popping"
  | "converting"
  | "spawning"
  | "gameOver";

export class GamePhaseManager {
  private currentPhase: GamePhaseType = "idle";
  private phaseData: Record<string, unknown> = {};

  /**
   * Get the current game phase
   */
  getCurrentPhase(): GamePhaseType {
    return this.currentPhase;
  }

  /**
   * Get the current phase data
   */
  getPhaseData(): Record<string, unknown> {
    return this.phaseData;
  }

  /**
   * Transition to a new game phase
   */
  transitionTo(newPhase: GamePhaseType, data?: Record<string, unknown>): void {
    this.currentPhase = newPhase;
    this.phaseData = data || {};
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
    return (
      this.currentPhase === "moving" ||
      this.currentPhase === "popping" ||
      this.currentPhase === "spawning"
    );
  }

  /**
   * Check if the current phase is spawning balls
   */
  isSpawning(): boolean {
    return this.currentPhase === "spawning";
  }

  /**
   * Check if the current phase is converting balls
   */
  isConverting(): boolean {
    return this.currentPhase === "converting";
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
    this.phaseData = {};
  }

  /**
   * Get a human-readable description of the current phase
   */
  getPhaseDescription(): string {
    switch (this.currentPhase) {
      case "idle":
        return "Ready for moves";
      case "moving":
        return "Ball is moving";
      case "popping":
        return "Lines are popping";
      case "spawning":
        return "Balls are spawning";
      case "converting":
        return "Converting preview balls";
      case "gameOver":
        return "Game over";
      default:
        return "Unknown phase";
    }
  }
}
