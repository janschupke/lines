import { describe, it, expect, beforeEach, vi } from "vitest";
import { StorageManager, type PersistedGameState } from "./storageManager";
import type { BallColor } from "./types";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("StorageManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveGameState", () => {
    it("should save game state to localStorage", () => {
      const mockGameState = {
        board: Array(9)
          .fill(null)
          .map((_, y) =>
            Array(9)
              .fill(null)
              .map((_, x) => ({
                x,
                y,
                ball: null,
                incomingBall: null,
                active: false,
              })),
          ),
        score: 100,
        highScore: 200,
        isNewHighScore: false,
        currentGameBeatHighScore: false,
        selected: null,
        gameOver: false,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        timer: 60,
        timerActive: true,
        movingBall: null,
        movingStep: 0,
        poppingBalls: new Set<string>(),
        hoveredCell: null,
        pathTrail: null,
        notReachable: false,
        showGameEndDialog: false,
        floatingScores: [],
        growingBalls: [],
        statistics: {
          turnsCount: 5,
          linesPopped: 2,
          longestLinePopped: 6,
        },
      };

      StorageManager.saveGameState(mockGameState);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "lines-game-state",
        JSON.stringify({
          board: mockGameState.board,
          score: mockGameState.score,
          highScore: mockGameState.highScore,
          nextBalls: mockGameState.nextBalls,
          timer: mockGameState.timer,
          timerActive: mockGameState.timerActive,
          gameOver: mockGameState.gameOver,
          statistics: mockGameState.statistics,
        }),
      );
    });

    it("should save board state with preview balls correctly", () => {
      // Create a board with real balls and preview balls
      const boardWithPreviewBalls = Array(9)
        .fill(null)
        .map((_, y) =>
          Array(9)
            .fill(null)
            .map((_, x) => ({
              x,
              y,
              ball: x === 4 && y === 4 ? { color: "red" as BallColor } : null,
              incomingBall:
                x === 3 && y === 3 ? { color: "blue" as BallColor } : null,
              active: false,
            })),
        );

      const mockGameState = {
        board: boardWithPreviewBalls,
        score: 150,
        highScore: 200,
        isNewHighScore: false,
        currentGameBeatHighScore: false,
        selected: null,
        gameOver: false,
        nextBalls: ["green", "yellow", "purple"] as BallColor[],
        timer: 120,
        timerActive: true,
        movingBall: null,
        movingStep: 0,
        poppingBalls: new Set<string>(),
        hoveredCell: null,
        pathTrail: null,
        notReachable: false,
        showGameEndDialog: false,
        floatingScores: [],
        growingBalls: [],
        statistics: {
          turnsCount: 8,
          linesPopped: 3,
          longestLinePopped: 7,
        },
      };

      StorageManager.saveGameState(mockGameState);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);

      // Verify that the board with preview balls is saved correctly
      expect(savedData.board[4][4].ball).toEqual({ color: "red" });
      expect(savedData.board[3][3].incomingBall).toEqual({ color: "blue" });
      expect(savedData.nextBalls).toEqual(["green", "yellow", "purple"]);
    });

    it("should save final board state after all updates", () => {
      // This test verifies that the persistence captures the final board state
      // after line removal, ball conversion, and preview ball placement

      // Simulate a board after a move that triggered line removal and ball conversion
      const finalBoardState = Array(9)
        .fill(null)
        .map((_, y) =>
          Array(9)
            .fill(null)
            .map((_, x) => ({
              x,
              y,
              ball: x === 5 && y === 5 ? { color: "red" as BallColor } : null,
              incomingBall:
                x === 2 && y === 2 ? { color: "orange" as BallColor } : null,
              active: false,
            })),
        );

      const mockGameState = {
        board: finalBoardState,
        score: 200,
        highScore: 200,
        isNewHighScore: false,
        currentGameBeatHighScore: false,
        selected: null,
        gameOver: false,
        nextBalls: ["pink", "cyan", "yellow"] as BallColor[],
        timer: 180,
        timerActive: true,
        movingBall: null,
        movingStep: 0,
        poppingBalls: new Set<string>(),
        hoveredCell: null,
        pathTrail: null,
        notReachable: false,
        showGameEndDialog: false,
        floatingScores: [],
        growingBalls: [],
        statistics: {
          turnsCount: 10,
          linesPopped: 4,
          longestLinePopped: 8,
        },
      };

      StorageManager.saveGameState(mockGameState);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);

      // Verify that the final board state is saved correctly
      expect(savedData.board[5][5].ball).toEqual({ color: "red" });
      expect(savedData.board[2][2].incomingBall).toEqual({ color: "orange" });
      expect(savedData.nextBalls).toEqual(["pink", "cyan", "yellow"]);
      expect(savedData.score).toBe(200);
      expect(savedData.timer).toBe(180);
    });

    it("should persist game state after line removal animation completes", () => {
      // This test verifies that the game state is persisted after line removal
      // which was the core issue of the "last turn lost" bug

      // Create a board with a line that will be removed
      const boardWithLine = Array(9)
        .fill(null)
        .map((_, y) =>
          Array(9)
            .fill(null)
            .map((_, x) => ({
              x,
              y,
              ball:
                x >= 3 && x <= 7 && y === 4
                  ? { color: "red" as BallColor }
                  : null,
              incomingBall: null,
              active: false,
            })),
        );

      const mockGameState = {
        board: boardWithLine,
        score: 100,
        highScore: 200,
        isNewHighScore: false,
        currentGameBeatHighScore: false,
        selected: null,
        gameOver: false,
        nextBalls: ["blue", "green", "yellow"] as BallColor[],
        timer: 30,
        timerActive: true,
        movingBall: null,
        movingStep: 0,
        poppingBalls: new Set<string>(),
        hoveredCell: null,
        pathTrail: null,
        notReachable: false,
        showGameEndDialog: false,
        floatingScores: [],
        growingBalls: [],
        statistics: {
          turnsCount: 3,
          linesPopped: 1,
          longestLinePopped: 5,
        },
      };

      // Save the game state
      StorageManager.saveGameState(mockGameState);

      // Verify the state was saved correctly
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.board[4][4].ball).toEqual({ color: "red" });
      expect(savedData.score).toBe(100);
      expect(savedData.timer).toBe(30);
      expect(savedData.timerActive).toBe(true);
      expect(savedData.nextBalls).toEqual(["blue", "green", "yellow"]);

      // Mock the localStorage to return the saved data
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      // Load the game state
      const loadedState = StorageManager.loadGameState();

      // Verify the state was loaded correctly
      expect(loadedState?.board[4][4].ball).toEqual({ color: "red" });
      expect(loadedState?.score).toBe(100);
      expect(loadedState?.timer).toBe(30);
      expect(loadedState?.timerActive).toBe(true);
      expect(loadedState?.nextBalls).toEqual(["blue", "green", "yellow"]);
    });

    it("should save and load timer state correctly", () => {
      const mockGameState = {
        board: Array(9)
          .fill(null)
          .map((_, y) =>
            Array(9)
              .fill(null)
              .map((_, x) => ({
                x,
                y,
                ball: null,
                incomingBall: null,
                active: false,
              })),
          ),
        score: 100,
        highScore: 200,
        isNewHighScore: false,
        currentGameBeatHighScore: false,
        selected: null,
        gameOver: false,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        timer: 45,
        timerActive: true,
        movingBall: null,
        movingStep: 0,
        poppingBalls: new Set<string>(),
        hoveredCell: null,
        pathTrail: null,
        notReachable: false,
        showGameEndDialog: false,
        floatingScores: [],
        growingBalls: [],
        statistics: {
          turnsCount: 5,
          linesPopped: 2,
          longestLinePopped: 6,
        },
      };

      // Save the game state
      StorageManager.saveGameState(mockGameState);

      // Verify the timer and timerActive were saved
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.timer).toBe(45);
      expect(savedData.timerActive).toBe(true);

      // Mock the localStorage to return the saved data
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

      // Load the game state
      const loadedState = StorageManager.loadGameState();

      // Verify the timer and timerActive were loaded correctly
      expect(loadedState?.timer).toBe(45);
      expect(loadedState?.timerActive).toBe(true);
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const mockGameState = {
        board: [],
        score: 0,
        highScore: 0,
        isNewHighScore: false,
        currentGameBeatHighScore: false,
        selected: null,
        gameOver: false,
        nextBalls: [],
        timer: 0,
        timerActive: false,
        movingBall: null,
        movingStep: 0,
        poppingBalls: new Set<string>(),
        hoveredCell: null,
        pathTrail: null,
        notReachable: false,
        showGameEndDialog: false,
        floatingScores: [],
        growingBalls: [],
        statistics: {
          turnsCount: 0,
          linesPopped: 0,
          longestLinePopped: 0,
        },
      };

      // Should not throw
      expect(() => StorageManager.saveGameState(mockGameState)).not.toThrow();
    });
  });

  describe("loadGameState", () => {
    it("should load valid game state from localStorage", () => {
      const mockPersistedState: PersistedGameState = {
        board: Array(9)
          .fill(null)
          .map((_, y) =>
            Array(9)
              .fill(null)
              .map((_, x) => ({
                x,
                y,
                ball: null,
                incomingBall: null,
                active: false,
              })),
          ),
        score: 150,
        highScore: 200,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        timer: 120,
        timerActive: true,
        gameOver: false,
        statistics: {
          turnsCount: 8,
          linesPopped: 3,
          longestLinePopped: 7,
        },
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(mockPersistedState),
      );

      const result = StorageManager.loadGameState();

      expect(result).toEqual(mockPersistedState);
      expect(localStorageMock.getItem).toHaveBeenCalledWith("lines-game-state");
    });

    it("should load board state with preview balls correctly", () => {
      // Create a board with real balls and preview balls
      const boardWithPreviewBalls = Array(9)
        .fill(null)
        .map((_, y) =>
          Array(9)
            .fill(null)
            .map((_, x) => ({
              x,
              y,
              ball: x === 4 && y === 4 ? { color: "red" as BallColor } : null,
              incomingBall:
                x === 3 && y === 3 ? { color: "blue" as BallColor } : null,
              active: false,
            })),
        );

      const mockPersistedState: PersistedGameState = {
        board: boardWithPreviewBalls,
        score: 200,
        highScore: 250,
        nextBalls: ["green", "yellow", "purple"] as BallColor[],
        timer: 180,
        timerActive: false,
        gameOver: false,
        statistics: {
          turnsCount: 10,
          linesPopped: 4,
          longestLinePopped: 8,
        },
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(mockPersistedState),
      );

      const result = StorageManager.loadGameState();

      // Verify that the board with preview balls is loaded correctly
      expect(result?.board[4][4].ball).toEqual({ color: "red" });
      expect(result?.board[3][3].incomingBall).toEqual({ color: "blue" });
      expect(result?.nextBalls).toEqual(["green", "yellow", "purple"]);
    });

    it("should return null when no saved state exists", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = StorageManager.loadGameState();

      expect(result).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");

      const result = StorageManager.loadGameState();

      expect(result).toBeNull();
    });

    it("should return null for invalid state structure", () => {
      const invalidState = {
        board: "not an array",
        score: "not a number",
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidState));

      const result = StorageManager.loadGameState();

      expect(result).toBeNull();
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage access denied");
      });

      const result = StorageManager.loadGameState();

      expect(result).toBeNull();
    });
  });

  describe("clearGameState", () => {
    it("should remove game state from localStorage", () => {
      StorageManager.clearGameState();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "lines-game-state",
      );
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Storage access denied");
      });

      // Should not throw
      expect(() => StorageManager.clearGameState()).not.toThrow();
    });
  });

  describe("hasSavedGameState", () => {
    it("should return true when saved state exists", () => {
      localStorageMock.getItem.mockReturnValue("some saved state");

      const result = StorageManager.hasSavedGameState();

      expect(result).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith("lines-game-state");
    });

    it("should return false when no saved state exists", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = StorageManager.hasSavedGameState();

      expect(result).toBe(false);
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage access denied");
      });

      const result = StorageManager.hasSavedGameState();

      expect(result).toBe(false);
    });
  });

  describe("saveHighScore", () => {
    it("should save high score to localStorage", () => {
      StorageManager.saveHighScore(1000);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "lines-game-high-score",
        "1000",
      );
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      // Should not throw
      expect(() => StorageManager.saveHighScore(1000)).not.toThrow();
    });
  });

  describe("loadHighScore", () => {
    it("should load valid high score from localStorage", () => {
      localStorageMock.getItem.mockReturnValue("1500");

      const result = StorageManager.loadHighScore();

      expect(result).toBe(1500);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        "lines-game-high-score",
      );
    });

    it("should return 0 when no high score exists", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = StorageManager.loadHighScore();

      expect(result).toBe(0);
    });

    it("should return 0 for invalid high score", () => {
      localStorageMock.getItem.mockReturnValue("invalid");

      const result = StorageManager.loadHighScore();

      expect(result).toBe(0);
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage access denied");
      });

      const result = StorageManager.loadHighScore();

      expect(result).toBe(0);
    });
  });

  describe("unified persistence", () => {
    it("should not overwrite high score with lower score on page refresh", () => {
      // Simulate a game state with a high score of 500 and current score of 100
      const gameStateWithHighScore = {
        board: Array(9)
          .fill(null)
          .map((_, y) =>
            Array(9)
              .fill(null)
              .map((_, x) => ({
                x,
                y,
                ball: null,
                incomingBall: null,
                active: false,
              })),
          ),
        score: 100,
        highScore: 500,
        isNewHighScore: false,
        currentGameBeatHighScore: false,
        selected: null,
        gameOver: false,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        timer: 60,
        timerActive: true,
        movingBall: null,
        movingStep: 0,
        poppingBalls: new Set<string>(),
        hoveredCell: null,
        pathTrail: null,
        notReachable: false,
        showGameEndDialog: false,
        floatingScores: [],
        growingBalls: [],
        statistics: {
          turnsCount: 5,
          linesPopped: 1,
          longestLinePopped: 5,
        },
      };

      // Save the game state
      StorageManager.saveGameState(gameStateWithHighScore);

      // Verify the saved data includes the high score
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.highScore).toBe(500);
      expect(savedData.score).toBe(100);

      // Simulate page refresh by loading the game state
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));
      const loadedState = StorageManager.loadGameState();

      // Verify that the high score is preserved and not overwritten by the lower current score
      expect(loadedState?.highScore).toBe(500);
      expect(loadedState?.score).toBe(100);
    });

    it("should update high score when current score is higher", () => {
      // Start with a game state where current score is higher than high score
      const gameStateWithNewHighScore = {
        board: Array(9)
          .fill(null)
          .map((_, y) =>
            Array(9)
              .fill(null)
              .map((_, x) => ({
                x,
                y,
                ball: null,
                incomingBall: null,
                active: false,
              })),
          ),
        score: 600,
        highScore: 500,
        isNewHighScore: true,
        currentGameBeatHighScore: true,
        selected: null,
        gameOver: false,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        timer: 60,
        timerActive: true,
        movingBall: null,
        movingStep: 0,
        poppingBalls: new Set<string>(),
        hoveredCell: null,
        pathTrail: null,
        notReachable: false,
        showGameEndDialog: false,
        floatingScores: [],
        growingBalls: [],
        statistics: {
          turnsCount: 5,
          linesPopped: 1,
          longestLinePopped: 5,
        },
      };

      // Save the game state
      StorageManager.saveGameState(gameStateWithNewHighScore);

      // Verify the saved data includes the updated high score
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.highScore).toBe(600);
      expect(savedData.score).toBe(600);
    });
  });
});
