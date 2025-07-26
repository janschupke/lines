import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { processMove } from "./moveProcessor";
import type { Cell, BallColor, GameStatistics } from "../types";
import type { StatisticsTracker } from "../statisticsTracker";

// Mock dependencies
vi.mock("../logic/boardManagement", () => ({
  handleIncomingBallConversion: vi.fn(),
  isBoardFull: vi.fn(),
}));

vi.mock("../logic/moveHandler", () => ({
  handleMoveCompletion: vi.fn(),
}));

vi.mock("../logic/lineDetection", () => ({
  handleLineDetection: vi.fn(),
}));

vi.mock("../storageManager", () => ({
  StorageManager: {
    saveGameState: vi.fn(),
  },
}));

import {
  handleIncomingBallConversion,
  isBoardFull,
} from "../logic/boardManagement";
import { handleMoveCompletion } from "../logic/moveHandler";
import { handleLineDetection } from "../logic/lineDetection";

describe("processMove", () => {
  let mockBoard: Cell[][];
  let mockActions: any;
  let mockStatisticsTracker: StatisticsTracker;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create a mock board
    mockBoard = Array(9)
      .fill(null)
      .map(() =>
        Array(9)
          .fill(null)
          .map(() => ({
            x: 0,
            y: 0,
            ball: null,
            incomingBall: null,
            active: false,
          })),
      );

    // Mock actions
    mockActions = {
      setScore: vi.fn(),
      setHighScore: vi.fn(),
      setGameOver: vi.fn(),
      setShowGameEndDialog: vi.fn(),
      setFinalStatistics: vi.fn(),
      setPoppingBalls: vi.fn(),
      setBoard: vi.fn(),
      setNextBalls: vi.fn(),
      onActivity: vi.fn(),
      setTimerActive: vi.fn(),
      addFloatingScore: vi.fn(),
      addGrowingBall: vi.fn(),
      addSpawningBalls: vi.fn(),
      startPoppingAnimation: vi.fn(),
      stopPoppingAnimation: vi.fn(),
      startSpawningAnimation: vi.fn(),
      stopSpawningAnimation: vi.fn(),
    };

    // Mock statistics tracker
    mockStatisticsTracker = {
      recordTurn: vi.fn(),
      recordLinePop: vi.fn(),
      getCurrentStatistics: vi.fn(() => ({}) as GameStatistics),
      reset: vi.fn(),
    } as any;

    // Reset all mocks
    vi.clearAllMocks();

    // Set up default mock return values
    (isBoardFull as any).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("basic move processing", () => {
    it("processes a simple move without lines", async () => {
      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: undefined,
      };

      const conversionResult = {
        newBoard: mockBoard,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        gameOver: false,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(null);
      (handleIncomingBallConversion as any).mockReturnValue(conversionResult);

      await processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      expect(handleMoveCompletion).toHaveBeenCalledWith(mockBoard, 0, 0, 1, 1);
      expect(handleLineDetection).toHaveBeenCalledWith(
        moveResult.newBoard,
        1,
        1,
      );
      expect(handleIncomingBallConversion).toHaveBeenCalledWith(
        moveResult.newBoard,
        undefined,
        false,
      );
      expect(mockActions.setBoard).toHaveBeenCalledWith(moveResult.newBoard);
      expect(mockActions.setNextBalls).toHaveBeenCalledWith(
        conversionResult.nextBalls,
        conversionResult.newBoard,
      );
    });

    it("handles move that steps on a preview ball", async () => {
      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: "blue" as BallColor,
      };

      const conversionResult = {
        newBoard: mockBoard,
        nextBalls: ["red", "green", "yellow"] as BallColor[],
        gameOver: false,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(null);
      (handleIncomingBallConversion as any).mockReturnValue(conversionResult);

      await processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      expect(handleIncomingBallConversion).toHaveBeenCalledWith(
        moveResult.newBoard,
        "blue",
        false,
      );
    });
  });

  describe("line formation and removal", () => {
    it("handles move that forms lines", async () => {
      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: undefined,
      };

      const lineResult = {
        newBoard: mockBoard,
        linesFormed: true,
        ballsRemoved: [
          [1, 1],
          [1, 2],
          [1, 3],
          [1, 4],
          [1, 5],
        ],
        pointsEarned: 5,
      };

      const conversionResult = {
        newBoard: mockBoard,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        gameOver: false,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(lineResult);
      (handleIncomingBallConversion as any).mockReturnValue(conversionResult);

      await processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      expect(mockActions.startPoppingAnimation).toHaveBeenCalledWith(
        new Set(["1,1", "1,2", "1,3", "1,4", "1,5"]),
      );
      expect(mockActions.addFloatingScore).toHaveBeenCalledWith(5, 1, 3);
    });

    it("handles lines formed by spawning balls", async () => {
      // Set up board with incoming balls so spawning animation will be triggered
      const boardWithIncoming = mockBoard.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      boardWithIncoming[0][0].incomingBall = { color: "red" as BallColor };
      boardWithIncoming[1][1].incomingBall = { color: "blue" as BallColor };
      boardWithIncoming[2][2].incomingBall = { color: "green" as BallColor };

      const moveResult = {
        newBoard: boardWithIncoming,
        linesFormed: false,
        steppedOnIncomingBall: undefined,
      };

      // Create a new board where incoming balls become real balls and new incoming balls are placed
      const boardAfterConversion = boardWithIncoming.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      // Convert incoming balls to real balls
      boardAfterConversion[0][0].ball = { color: "red" as BallColor };
      boardAfterConversion[0][0].incomingBall = null;
      boardAfterConversion[1][1].ball = { color: "blue" as BallColor };
      boardAfterConversion[1][1].incomingBall = null;
      boardAfterConversion[2][2].ball = { color: "green" as BallColor };
      boardAfterConversion[2][2].incomingBall = null;
      // Add new incoming balls
      boardAfterConversion[3][3].incomingBall = {
        color: "yellow" as BallColor,
      };
      boardAfterConversion[4][4].incomingBall = {
        color: "purple" as BallColor,
      };
      boardAfterConversion[5][5].incomingBall = {
        color: "orange" as BallColor,
      };

      const conversionResult = {
        newBoard: boardAfterConversion,
        nextBalls: ["yellow", "purple", "orange"] as BallColor[],
        gameOver: false,
        linesFormed: true,
        ballsRemoved: [
          [2, 2],
          [2, 3],
          [2, 4],
          [2, 5],
          [2, 6],
        ],
        pointsEarned: 5,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(null);
      (handleIncomingBallConversion as any).mockReturnValue(conversionResult);

      const promise = processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      // For this test: move -> spawn -> pop (from spawning)
      // First advance to spawning animation completion
      vi.advanceTimersByTime(600);

      // Should add growing ball animations instead of spawning animation
      expect(mockActions.addGrowingBall).toHaveBeenCalled();

      // Then advance to popping animation completion (from spawning)
      vi.advanceTimersByTime(300);

      await promise;

      // Verify that handleBallConversion was called
      expect(handleIncomingBallConversion).toHaveBeenCalled();
      expect(mockActions.startPoppingAnimation).toHaveBeenCalledWith(
        new Set(["2,2", "2,3", "2,4", "2,5", "2,6"]),
      );
    });
  });

  describe("animation sequencing", () => {
    it("sequences animations properly: move -> pop -> spawn", async () => {
      // Set up board with incoming balls so spawning animation will be triggered
      mockBoard[0][0].incomingBall = { color: "red" as BallColor };
      mockBoard[1][1].incomingBall = { color: "blue" as BallColor };
      mockBoard[2][2].incomingBall = { color: "green" as BallColor };

      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: undefined,
      };

      const lineResult = {
        newBoard: mockBoard,
        linesFormed: true,
        ballsRemoved: [
          [1, 1],
          [1, 2],
          [1, 3],
          [1, 4],
          [1, 5],
        ],
        pointsEarned: 5,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(lineResult);

      const promise = processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      // Should start popping animation immediately
      expect(mockActions.startPoppingAnimation).toHaveBeenCalled();

      // Fast-forward to popping animation completion
      vi.advanceTimersByTime(300);

      // Should stop popping but NOT spawn new balls (line was popped)
      expect(mockActions.stopPoppingAnimation).toHaveBeenCalled();
      expect(mockActions.addGrowingBall).not.toHaveBeenCalled();

      // Should preserve the board state with incoming balls remaining as incoming balls
      expect(mockActions.setBoard).toHaveBeenCalledWith(mockBoard);

      await promise;
    });

    it("sequences animations properly: move -> spawn (no lines)", async () => {
      // Set up board with incoming balls so spawning animation will be triggered
      mockBoard[0][0].incomingBall = { color: "red" as BallColor };
      mockBoard[1][1].incomingBall = { color: "blue" as BallColor };
      mockBoard[2][2].incomingBall = { color: "green" as BallColor };

      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: undefined,
      };

      // Create a new board where incoming balls become real balls and new incoming balls are placed
      const boardAfterConversion = mockBoard.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      // Convert incoming balls to real balls
      boardAfterConversion[0][0].ball = { color: "red" as BallColor };
      boardAfterConversion[0][0].incomingBall = null;
      boardAfterConversion[1][1].ball = { color: "blue" as BallColor };
      boardAfterConversion[1][1].incomingBall = null;
      boardAfterConversion[2][2].ball = { color: "green" as BallColor };
      boardAfterConversion[2][2].incomingBall = null;
      // Add new incoming balls
      boardAfterConversion[3][3].incomingBall = {
        color: "yellow" as BallColor,
      };
      boardAfterConversion[4][4].incomingBall = {
        color: "purple" as BallColor,
      };
      boardAfterConversion[5][5].incomingBall = {
        color: "orange" as BallColor,
      };

      const conversionResult = {
        newBoard: boardAfterConversion,
        nextBalls: ["yellow", "purple", "orange"] as BallColor[],
        gameOver: false,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(null);
      (handleIncomingBallConversion as any).mockReturnValue(conversionResult);

      const promise = processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      // Should start spawning animation immediately (no popping)
      expect(mockActions.addGrowingBall).toHaveBeenCalled();
      expect(mockActions.startPoppingAnimation).not.toHaveBeenCalled();

      // Fast-forward to spawning animation completion
      vi.advanceTimersByTime(600);

      await promise;
    });
  });

  describe("stepped-on preview ball handling", () => {
    it("preserves stepped-on preview ball when move forms lines", async () => {
      // Set up board with incoming balls so spawning animation will be triggered
      mockBoard[0][0].incomingBall = { color: "red" as BallColor };
      mockBoard[1][1].incomingBall = { color: "blue" as BallColor };
      mockBoard[2][2].incomingBall = { color: "green" as BallColor };

      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: "blue" as BallColor,
      };

      // Create a new board where the stepped-on ball is placed as a real ball
      const boardAfterConversion = mockBoard.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
      // Convert incoming balls to real balls
      boardAfterConversion[0][0].ball = { color: "red" as BallColor };
      boardAfterConversion[0][0].incomingBall = null;
      boardAfterConversion[1][1].ball = { color: "blue" as BallColor };
      boardAfterConversion[1][1].incomingBall = null;
      boardAfterConversion[2][2].ball = { color: "green" as BallColor };
      boardAfterConversion[2][2].incomingBall = null;
      // Add new incoming balls
      boardAfterConversion[3][3].incomingBall = {
        color: "yellow" as BallColor,
      };
      boardAfterConversion[4][4].incomingBall = {
        color: "purple" as BallColor,
      };
      boardAfterConversion[5][5].incomingBall = {
        color: "orange" as BallColor,
      };

      const conversionResult = {
        newBoard: boardAfterConversion,
        nextBalls: ["yellow", "purple", "orange"] as BallColor[],
        gameOver: false,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(null); // No lines formed by the move
      (handleIncomingBallConversion as any).mockReturnValue(conversionResult);

      const promise = processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      // Should pass the stepped-on preview color to conversion
      expect(handleIncomingBallConversion).toHaveBeenCalledWith(
        moveResult.newBoard,
        "blue",
        false,
      );

      // Fast-forward to spawning animation completion
      vi.advanceTimersByTime(600);

      await promise;
    });
  });

  describe("game over handling", () => {
    it("handles game over from ball conversion", async () => {
      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: undefined,
      };

      const conversionResult = {
        newBoard: mockBoard,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        gameOver: true,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(null);
      (handleIncomingBallConversion as any).mockReturnValue(conversionResult);

      const promise = processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      // Fast-forward to spawning animation completion
      vi.advanceTimersByTime(600);

      await promise;

      expect(mockActions.setGameOver).toHaveBeenCalledWith(true);
      expect(mockActions.setShowGameEndDialog).toHaveBeenCalledWith(true);
      expect(mockActions.setFinalStatistics).toHaveBeenCalled();
    });

    it("handles game over from line removal", async () => {
      // Set up board with incoming balls so spawning animation will be triggered
      mockBoard[0][0].incomingBall = { color: "red" as BallColor };
      mockBoard[1][1].incomingBall = { color: "blue" as BallColor };
      mockBoard[2][2].incomingBall = { color: "green" as BallColor };

      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: undefined,
      };

      const lineResult = {
        newBoard: mockBoard,
        linesFormed: true,
        ballsRemoved: [
          [1, 1],
          [1, 2],
          [1, 3],
          [1, 4],
          [1, 5],
        ],
        pointsEarned: 5,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(lineResult);
      (isBoardFull as any).mockReturnValue(true); // Board will be full after line removal

      const promise = processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      // Fast-forward to popping animation completion
      vi.advanceTimersByTime(300);

      await promise;

      expect(mockActions.setGameOver).toHaveBeenCalledWith(true);
      expect(mockActions.setShowGameEndDialog).toHaveBeenCalledWith(true);
      expect(mockActions.setFinalStatistics).toHaveBeenCalled();
    });
  });

  describe("timer management", () => {
    it("starts timer after first move", async () => {
      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: undefined,
      };

      const conversionResult = {
        newBoard: mockBoard,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        gameOver: false,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(null);
      (handleIncomingBallConversion as any).mockReturnValue(conversionResult);

      const promise = processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        0,
        false,
        500,
        false,
        false,
      );

      // Fast-forward to spawning animation completion
      vi.advanceTimersByTime(600);

      await promise;

      expect(mockActions.setTimerActive).toHaveBeenCalledWith(true);
    });

    it("does not start timer if already active", async () => {
      const moveResult = {
        newBoard: mockBoard,
        linesFormed: false,
        steppedOnIncomingBall: undefined,
      };

      const conversionResult = {
        newBoard: mockBoard,
        nextBalls: ["red", "blue", "green"] as BallColor[],
        gameOver: false,
      };

      (handleMoveCompletion as any).mockReturnValue(moveResult);
      (handleLineDetection as any).mockReturnValue(null);
      (handleIncomingBallConversion as any).mockReturnValue(conversionResult);

      const promise = processMove(
        mockBoard,
        0,
        0,
        1,
        1,
        100,
        mockStatisticsTracker,
        mockActions,
        10,
        true,
        500,
        false,
        false,
      );

      // Fast-forward to spawning animation completion
      vi.advanceTimersByTime(600);

      await promise;

      expect(mockActions.setTimerActive).not.toHaveBeenCalled();
    });
  });
});
