import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine } from "./gameEngine";
import type { GameState, Cell, BallColor, Coord } from "../types";
import {
  BallColor as BallColorEnum,
  BOARD_SIZE,
  INITIAL_BALLS,
  BALLS_PER_TURN,
} from "../config";
import { createEmptyBoard, placeRealBalls } from "./board/boardManagement";

describe("GameEngine", () => {
  let engine: GameEngine;
  let initialState: GameState;

  beforeEach(() => {
    engine = new GameEngine();
    initialState = engine.createNewGame();
  });

  describe("createNewGame", () => {
    it("creates a new game with empty board", () => {
      const game = engine.createNewGame();
      expect(game.board).toHaveLength(BOARD_SIZE);
      expect(game.board[0]).toHaveLength(BOARD_SIZE);
      expect(game.score).toBe(0);
      expect(game.gameOver).toBe(false);
      expect(game.nextBalls).toHaveLength(BALLS_PER_TURN);
    });

    it("places initial balls on board", () => {
      const game = engine.createNewGame();
      let ballCount = 0;
      for (const row of game.board) {
        for (const cell of row) {
          if (cell.ball) ballCount++;
        }
      }
      expect(ballCount).toBe(INITIAL_BALLS);
    });

    it("generates next balls", () => {
      const game = engine.createNewGame();
      expect(game.nextBalls.length).toBe(BALLS_PER_TURN);
      game.nextBalls.forEach((color) => {
        expect(Object.values(BallColorEnum)).toContain(color);
      });
    });
  });

  describe("moveBall", () => {
    it("moves a ball from one cell to another", () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.moveBall(state, { x: 0, y: 0 }, { x: 1, y: 1 });

      expect(result.newState.board[0][0].ball).toBeNull();
      expect(result.newState.board[1][1].ball?.color).toBe(BallColorEnum.Red);
    });

    it("throws error if source cell has no ball", () => {
      const board = createEmptyBoard();
      const state: GameState = {
        ...initialState,
        board,
      };

      expect(() => {
        engine.moveBall(state, { x: 0, y: 0 }, { x: 1, y: 1 });
      }).toThrow("Invalid move");
    });

    it("throws error if target cell is occupied", () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      board[1][1].ball = { color: BallColorEnum.Blue };
      const state: GameState = {
        ...initialState,
        board,
      };

      expect(() => {
        engine.moveBall(state, { x: 0, y: 0 }, { x: 1, y: 1 });
      }).toThrow("Invalid move");
    });

    it("handles stepping on incoming ball", () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      board[1][1].incomingBall = { color: BallColorEnum.Blue };
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.moveBall(state, { x: 0, y: 0 }, { x: 1, y: 1 });

      expect(result).not.toBeNull();
      expect(result?.steppedOnIncomingBall).toBe(BallColorEnum.Blue);
    });
  });

  describe("detectLines", () => {
    it("detects horizontal line", () => {
      const board = createEmptyBoard();
      // Create horizontal line of 5 red balls
      for (let x = 0; x < 5; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.detectLines(state, { x: 2, y: 0 });

      expect(result).not.toBeNull();
      expect(result?.lines.length).toBeGreaterThan(0);
      expect(result?.ballsToRemove.length).toBe(5);
    });

    it("detects vertical line", () => {
      const board = createEmptyBoard();
      // Create vertical line of 5 blue balls
      for (let y = 0; y < 5; y++) {
        board[y][0].ball = { color: BallColorEnum.Blue };
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.detectLines(state, { x: 0, y: 2 });

      expect(result).not.toBeNull();
      expect(result?.ballsToRemove.length).toBe(5);
    });

    it("returns null if no lines detected", () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      board[0][1].ball = { color: BallColorEnum.Blue };
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.detectLines(state, { x: 0, y: 0 });

      expect(result).toBeNull();
    });
  });

  describe("removeLines", () => {
    it("removes balls from detected lines", () => {
      const board = createEmptyBoard();
      // Create horizontal line
      for (let x = 0; x < 5; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      const lineResult = engine.detectLines(state, { x: 2, y: 0 });
      expect(lineResult).not.toBeNull();

      const newState = engine.removeLines(state, lineResult!.lines);

      // All balls in line should be removed
      for (let x = 0; x < 5; x++) {
        expect(newState.board[0][x].ball).toBeNull();
      }
    });
  });

  describe("updateScore", () => {
    it("adds points to score", () => {
      const state: GameState = {
        ...initialState,
        score: 100,
      };

      const newState = engine.updateScore(state, 50);

      expect(newState.score).toBe(150);
    });
  });

  describe("checkGameOver", () => {
    it("returns false for non-full board", () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      const state: GameState = {
        ...initialState,
        board,
      };

      expect(engine.checkGameOver(state)).toBe(false);
    });

    it("returns true when board is full", () => {
      const board = createEmptyBoard();
      // Fill entire board
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          board[y][x].ball = { color: BallColorEnum.Red };
        }
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      expect(engine.checkGameOver(state)).toBe(true);
    });
  });

  describe("checkBlockedPreviewBalls", () => {
    it("detects when preview balls are blocked", () => {
      const board = createEmptyBoard();
      board[0][0].incomingBall = { color: BallColorEnum.Red };
      board[0][0].ball = { color: BallColorEnum.Blue }; // Blocked!
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.checkBlockedPreviewBalls(state);

      expect(result.needsRecalculation).toBe(true);
    });

    it("returns false when no preview balls are blocked", () => {
      const board = createEmptyBoard();
      board[0][0].incomingBall = { color: BallColorEnum.Red };
      // No ball blocking it
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.checkBlockedPreviewBalls(state);

      expect(result.needsRecalculation).toBe(false);
    });
  });

  describe("updateStatistics", () => {
    it("updates statistics correctly", () => {
      const state: GameState = {
        ...initialState,
        statistics: {
          turnsCount: 5,
          linesPopped: 3,
          longestLinePopped: 5,
        },
      };

      const newState = engine.updateStatistics(state, {
        linesPopped: 2,
        longestLinePopped: 7,
      });

      expect(newState.statistics.linesPopped).toBe(5); // 3 + 2
      expect(newState.statistics.longestLinePopped).toBe(7);
    });

    it("handles missing statistics fields", () => {
      const state: GameState = {
        ...initialState,
        statistics: {
          turnsCount: 5,
          linesPopped: 3,
          longestLinePopped: 5,
        },
      };

      const newState = engine.updateStatistics(state, {
        turnsCount: 1,
      });

      expect(newState.statistics.turnsCount).toBe(6);
      expect(newState.statistics.linesPopped).toBe(3); // Unchanged
    });
  });

  describe("resetGame", () => {
    it("resets game to initial state while preserving high score", () => {
      const state: GameState = {
        ...initialState,
        score: 1000,
        highScore: 500,
        gameOver: true,
      };

      const newState = engine.resetGame(500);

      expect(newState.score).toBe(0);
      expect(newState.highScore).toBe(500);
      expect(newState.gameOver).toBe(false);
      expect(newState.nextBalls).toHaveLength(BALLS_PER_TURN);
    });
  });

  describe("detectLinesAtPositions", () => {
    it("detects lines at multiple positions", () => {
      const board = createEmptyBoard();
      // Create two separate lines
      for (let x = 0; x < 5; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }
      for (let y = 0; y < 5; y++) {
        board[y][5].ball = { color: BallColorEnum.Blue };
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.detectLinesAtPositions(state, [
        { x: 2, y: 0 },
        { x: 5, y: 2 },
      ]);

      expect(result).not.toBeNull();
      expect(result?.lines.length).toBeGreaterThanOrEqual(2);
      expect(result?.ballsToRemove.length).toBeGreaterThanOrEqual(5);
    });

    it("returns null if no lines at positions", () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      board[1][1].ball = { color: BallColorEnum.Blue };
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.detectLinesAtPositions(state, [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]);

      expect(result).toBeNull();
    });
  });

  describe("detectLines - diagonal lines", () => {
    it("detects diagonal down-right line", () => {
      const board = createEmptyBoard();
      for (let i = 0; i < 5; i++) {
        board[i][i].ball = { color: BallColorEnum.Red };
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.detectLines(state, { x: 2, y: 2 });

      expect(result).not.toBeNull();
      expect(result?.ballsToRemove.length).toBe(5);
    });

    it("detects diagonal up-right line", () => {
      const board = createEmptyBoard();
      for (let i = 0; i < 5; i++) {
        board[4 - i][i].ball = { color: BallColorEnum.Red };
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.detectLines(state, { x: 2, y: 2 });

      expect(result).not.toBeNull();
      expect(result?.ballsToRemove.length).toBe(5);
    });
  });

  describe("detectLines - multiple lines", () => {
    it("detects multiple lines at same position", () => {
      const board = createEmptyBoard();
      // Create intersection of horizontal and vertical lines
      for (let x = 0; x < 5; x++) {
        board[4][x].ball = { color: BallColorEnum.Red };
      }
      for (let y = 0; y < 5; y++) {
        board[y][4].ball = { color: BallColorEnum.Red };
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      const result = engine.detectLines(state, { x: 4, y: 4 });

      expect(result).not.toBeNull();
      expect(result?.lines.length).toBeGreaterThanOrEqual(2);
      // Should include intersection cell only once
      expect(result?.ballsToRemove.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe("removeLines - multiple lines", () => {
    it("removes balls from multiple overlapping lines", () => {
      const board = createEmptyBoard();
      // Create two overlapping lines
      for (let x = 0; x < 5; x++) {
        board[4][x].ball = { color: BallColorEnum.Red };
      }
      for (let y = 0; y < 5; y++) {
        board[y][4].ball = { color: BallColorEnum.Red };
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      const lineResult = engine.detectLines(state, { x: 4, y: 4 });
      expect(lineResult).not.toBeNull();

      const newState = engine.removeLines(state, lineResult!.lines);

      // All balls in both lines should be removed
      for (let x = 0; x < 5; x++) {
        expect(newState.board[4][x].ball).toBeNull();
      }
      for (let y = 0; y < 5; y++) {
        expect(newState.board[y][4].ball).toBeNull();
      }
    });
  });

  describe("updateScore", () => {
    it("updates high score when new score exceeds it", () => {
      const state: GameState = {
        ...initialState,
        score: 100,
        highScore: 150,
      };

      const newState = engine.updateScore(state, 100);

      expect(newState.score).toBe(200);
      expect(newState.highScore).toBe(200);
      expect(newState.isNewHighScore).toBe(true);
      expect(newState.currentGameBeatHighScore).toBe(true);
    });

    it("does not update high score when score is lower", () => {
      const state: GameState = {
        ...initialState,
        score: 100,
        highScore: 500,
      };

      const newState = engine.updateScore(state, 50);

      expect(newState.score).toBe(150);
      expect(newState.highScore).toBe(500);
      expect(newState.isNewHighScore).toBe(false);
      expect(newState.currentGameBeatHighScore).toBe(false);
    });
  });

  describe("calculateScore", () => {
    it("calculates total score for multiple lines", () => {
      const board = createEmptyBoard();
      // Create two lines
      for (let x = 0; x < 5; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }
      for (let y = 0; y < 5; y++) {
        board[y][5].ball = { color: BallColorEnum.Blue };
      }
      const state: GameState = {
        ...initialState,
        board,
      };

      const lineResult1 = engine.detectLines(state, { x: 2, y: 0 });
      const lineResult2 = engine.detectLines(state, { x: 5, y: 2 });
      expect(lineResult1).not.toBeNull();
      expect(lineResult2).not.toBeNull();

      const totalScore = engine.calculateScore([
        ...lineResult1!.lines,
        ...lineResult2!.lines,
      ]);

      expect(totalScore).toBeGreaterThan(0);
      expect(totalScore).toBe(lineResult1!.score + lineResult2!.score);
    });
  });

  describe("convertPreviewToReal", () => {
    it("converts preview balls to real balls", () => {
      const board = createEmptyBoard();
      board[0][0].incomingBall = { color: BallColorEnum.Red };
      board[1][1].incomingBall = { color: BallColorEnum.Blue };
      const state: GameState = {
        ...initialState,
        board,
        nextBalls: [
          BallColorEnum.Green,
          BallColorEnum.Yellow,
          BallColorEnum.Purple,
        ],
      };

      const result = engine.convertPreviewToReal(state);

      expect(result.newBoard[0][0].ball?.color).toBe(BallColorEnum.Red);
      expect(result.newBoard[0][0].incomingBall).toBeNull();
      expect(result.newBoard[1][1].ball?.color).toBe(BallColorEnum.Blue);
      expect(result.newBoard[1][1].incomingBall).toBeNull();
    });

    it("handles stepped-on incoming ball", () => {
      const board = createEmptyBoard();
      board[0][0].incomingBall = { color: BallColorEnum.Red };
      const state: GameState = {
        ...initialState,
        board,
        nextBalls: [
          BallColorEnum.Blue,
          BallColorEnum.Green,
          BallColorEnum.Yellow,
        ],
      };

      const result = engine.convertPreviewToReal(state, BallColorEnum.Red);

      // Stepped-on ball should be placed somewhere
      expect(result.newBoard).toBeDefined();
    });
  });

  describe("findPath", () => {
    it("finds path between two positions", () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      const state: GameState = {
        ...initialState,
        board,
      };

      const path = engine.findPath(state.board, { x: 0, y: 0 }, { x: 2, y: 2 });

      expect(path).not.toBeNull();
      expect(path?.length).toBeGreaterThan(1);
      expect(path?.[0]).toEqual([0, 0]);
      expect(path?.[path.length - 1]).toEqual([2, 2]);
    });

    it("returns null if no path exists", () => {
      const board = createEmptyBoard();
      // Block all paths
      for (let x = 1; x < 9; x++) {
        board[0][x].ball = { color: BallColorEnum.Red };
      }
      for (let y = 1; y < 9; y++) {
        board[y][0].ball = { color: BallColorEnum.Red };
      }
      board[0][0].ball = { color: BallColorEnum.Red };
      const state: GameState = {
        ...initialState,
        board,
      };

      const path = engine.findPath(state.board, { x: 0, y: 0 }, { x: 8, y: 8 });

      expect(path).toBeNull();
    });
  });

  describe("findUnreachableCells", () => {
    it("finds unreachable cells from a position", () => {
      const board = createEmptyBoard();
      // Block some cells
      board[0][1].ball = { color: BallColorEnum.Red };
      board[1][0].ball = { color: BallColorEnum.Red };
      const state: GameState = {
        ...initialState,
        board,
      };

      const unreachable = engine.findUnreachableCells(state.board, {
        x: 0,
        y: 0,
      });

      expect(unreachable.length).toBeGreaterThan(0);
      expect(unreachable.some(([x, y]) => x === 8 && y === 8)).toBe(true);
    });
  });

  describe("validateMove", () => {
    it("validates valid move", () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      const state: GameState = {
        ...initialState,
        board,
      };

      const isValid = engine.validateMove(
        state.board,
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      );

      expect(isValid).toBe(true);
    });

    it("rejects invalid move (no ball at source)", () => {
      const board = createEmptyBoard();
      const state: GameState = {
        ...initialState,
        board,
      };

      const isValid = engine.validateMove(
        state.board,
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      );

      expect(isValid).toBe(false);
    });

    it("rejects invalid move (target occupied)", () => {
      const board = createEmptyBoard();
      board[0][0].ball = { color: BallColorEnum.Red };
      board[1][1].ball = { color: BallColorEnum.Blue };
      const state: GameState = {
        ...initialState,
        board,
      };

      const isValid = engine.validateMove(
        state.board,
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      );

      expect(isValid).toBe(false);
    });
  });
});
