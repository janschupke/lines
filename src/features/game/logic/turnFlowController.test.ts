import { describe, it, expect, beforeEach, vi } from "vitest";
import { TurnFlowController } from "./turnFlowController";
import { TurnPhase } from "../types/enums";
import type { GameState, Coord, TurnPhase as TurnPhaseType } from "../types";
import { GameEngine } from "./gameEngine";
import { createEmptyBoard } from "./board/boardManagement";
import { BallColor as BallColorEnum } from "../config";

describe("TurnFlowController", () => {
  let controller: TurnFlowController;
  let initialState: GameState;
  let mockCallbacks: {
    onPhaseChange: ReturnType<typeof vi.fn>;
    onGameStateUpdate: ReturnType<typeof vi.fn>;
    onUIUpdate: ReturnType<typeof vi.fn>;
    onAnimationComplete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    controller = new TurnFlowController();
    const engine = new GameEngine();
    initialState = engine.createNewGame();

    mockCallbacks = {
      onPhaseChange: vi.fn(),
      onGameStateUpdate: vi.fn(),
      onGameStateUpdate: vi.fn(),
      onUIUpdate: vi.fn(),
      onAnimationComplete: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe("executeTurn", () => {
    it("executes complete turn flow", async () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = await controller.executeTurn(
        state,
        { from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
        mockCallbacks,
      );

      expect(mockCallbacks.onPhaseChange).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("calls phases in correct order", async () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      const state: GameState = {
        ...initialState,
        board,
      };

      const phaseCalls: TurnPhaseType[] = [];
      mockCallbacks.onPhaseChange = vi.fn((phase) => {
        phaseCalls.push(phase);
      });

      await controller.executeTurn(
        state,
        { from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
        mockCallbacks,
      );

      expect(phaseCalls[0]).toBe(TurnPhase.Moving);
      expect(phaseCalls.includes(TurnPhase.CheckingLines)).toBe(true);
    });

    it("handles line detection and popping", async () => {
      const board = createEmptyBoard();
      // Create a line - need to place ball at a valid position first
      board[0][0].ball = { color: BallColorEnum.Red };
      // Place more balls to form a line after move
      board[0][1].ball = { color: BallColorEnum.Red };
      board[0][2].ball = { color: BallColorEnum.Red };
      board[0][3].ball = { color: BallColorEnum.Red };
      // Move to position 4 to complete line
      const state: GameState = {
        ...initialState,
        board,
      };

      await controller.executeTurn(
        state,
        { from: { x: 0, y: 0 }, to: { x: 4, y: 0 } },
        mockCallbacks,
      );

      // Should have called onUIUpdate for pop or other updates
      expect(mockCallbacks.onUIUpdate).toHaveBeenCalled();
    });
  });

  describe("getGameEngine", () => {
    it("returns the game engine instance", () => {
      const engine = controller.getGameEngine();
      expect(engine).toBeInstanceOf(GameEngine);
    });
  });
});

