// Export the main game state manager
export { useGameStateManager as useGameState } from "./gameStateManager";

// Export individual components for testing and advanced usage
export { useCellInteraction } from "./cellInteractionHandler";
export { processMove } from "./moveProcessor";

// Re-export existing components
export { GamePhaseManager } from "./gamePhaseManager";
