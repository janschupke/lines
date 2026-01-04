import type {
  Cell,
  BallColor,
  GameState,
  Line,
  LineDetectionResult,
  ConversionResult,
  Coord,
} from "../types";
import { LineDetectionEngine } from "./lines/lineDetectionEngine";
import { coordsFromKeys, coordToKey } from "@shared/utils/coordinates";
import { cloneBoard } from "../utils/boardUtils";
import {
  createEmptyBoard,
  placeRealBalls,
  placePreviewBalls,
  isBoardFull,
  handleIncomingBallConversion,
} from "./board/boardManagement";
import { getRandomNextBalls } from "./balls/ballGeneration";
import { findPath, findUnreachableCells } from "./pathfinding/pathfinding";
import { validateMove } from "./validation/validation";
import { INITIAL_BALLS, BALLS_PER_TURN } from "../config";

/**
 * GameEngine - Pure game logic
 *
 * All methods are pure functions with no side effects.
 * This class encapsulates all game rules and logic.
 */
export class GameEngine {
  private lineDetectionEngine: LineDetectionEngine;

  constructor() {
    this.lineDetectionEngine = new LineDetectionEngine();
  }

  /**
   * Create a new game state with initial board
   */
  createNewGame(): GameState {
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(INITIAL_BALLS);
    const boardWithRealBalls = placeRealBalls(board, initialBalls);
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    const finalBoard = placePreviewBalls(boardWithRealBalls, initialNext);

    return {
      board: finalBoard,
      score: 0,
      highScore: 0,
      isNewHighScore: false,
      currentGameBeatHighScore: false,
      gameOver: false,
      nextBalls: initialNext,
      timer: 0,
      timerActive: false,
      statistics: {
        turnsCount: 0,
        linesPopped: 0,
        longestLinePopped: 0,
      },
      showGameEndDialog: false,
    };
  }

  /**
   * Reset game to initial state
   */
  resetGame(currentHighScore: number): GameState {
    const newGame = this.createNewGame();
    return {
      ...newGame,
      highScore: currentHighScore,
    };
  }

  /**
   * Move a ball from one position to another
   */
  moveBall(
    state: GameState,
    from: Coord,
    to: Coord,
  ): { newState: GameState; steppedOnIncomingBall?: BallColor } {
    // Validate move with detailed error messages
    const fromRow = state.board[from.y];
    if (!fromRow) {
      throw new Error(`Invalid move: source row ${from.y} out of bounds`);
    }
    const fromCell = fromRow[from.x];
    if (!fromCell) {
      throw new Error(
        `Invalid move: source cell [${from.x}, ${from.y}] does not exist`,
      );
    }
    if (!fromCell.ball) {
      throw new Error(
        `Invalid move: source cell [${from.x}, ${from.y}] has no ball`,
      );
    }

    const toRow = state.board[to.y];
    if (!toRow) {
      throw new Error(`Invalid move: target row ${to.y} out of bounds`);
    }
    const toCell = toRow[to.x];
    if (!toCell) {
      throw new Error(
        `Invalid move: target cell [${to.x}, ${to.y}] does not exist`,
      );
    }
    if (toCell.ball) {
      throw new Error(
        `Invalid move: target cell [${to.x}, ${to.y}] is occupied by a ball`,
      );
    }

    if (from.x === to.x && from.y === to.y) {
      throw new Error("Invalid move: same cell");
    }

    // Check if we're stepping on an incoming ball
    const steppedOnIncomingBall = toCell.incomingBall?.color;

    // Clone board and move the ball
    const newBoard = cloneBoard(state.board);
    const newFromRow = newBoard[from.y];
    const newFromCell = newFromRow?.[from.x];
    const newToRow = newBoard[to.y];
    const newToCell = newToRow?.[to.x];
    if (newToCell && newFromCell) {
      newToCell.ball = fromCell.ball;
      if (newFromCell) {
        newFromCell.ball = null;
      }
      newToCell.incomingBall = null; // Clear incoming ball at destination
    }

    return {
      newState: {
        ...state,
        board: newBoard,
      },
      ...(steppedOnIncomingBall ? { steppedOnIncomingBall } : {}),
    };
  }

  /**
   * Detect lines at a position
   */
  detectLines(state: GameState, position: Coord): LineDetectionResult | null {
    return this.lineDetectionEngine.detectLinesAtPosition(state.board, [
      position.x,
      position.y,
    ]);
  }

  /**
   * Detect lines at multiple positions
   */
  detectLinesAtPositions(
    state: GameState,
    positions: Coord[],
  ): LineDetectionResult | null {
    const coords: [number, number][] = positions.map((p) => [p.x, p.y]);
    return this.lineDetectionEngine.detectLinesAtPositions(state.board, coords);
  }

  /**
   * Remove lines from board
   */
  removeLines(state: GameState, lines: Line[]): GameState {
    const ballsToRemoveSet = new Set<string>();
    lines.forEach((line) => {
      line.cells.forEach(([x, y]) => {
        ballsToRemoveSet.add(coordToKey({ x, y }));
      });
    });

    const newBoard = cloneBoard(state.board);
    coordsFromKeys(ballsToRemoveSet).forEach((coord) => {
      const row = newBoard[coord.y];
      if (row) {
        const cell = row[coord.x];
        if (cell) {
          cell.ball = null;
        }
      }
    });

    return {
      ...state,
      board: newBoard,
    };
  }

  /**
   * Check for blocked preview balls and recalculate if needed
   */
  checkBlockedPreviewBalls(state: GameState): {
    needsRecalculation: boolean;
    newState?: GameState;
  } {
    // Check if any preview balls are blocked (cell has a real ball now)
    let needsRecalculation = false;
    for (const row of state.board) {
      for (const cell of row) {
        if (cell.incomingBall && cell.ball) {
          needsRecalculation = true;
          break;
        }
      }
      if (needsRecalculation) break;
    }

    if (!needsRecalculation) {
      return { needsRecalculation: false };
    }

    // Recalculate preview ball positions
    const newBoard = state.board.map((row) =>
      row.map((cell) => ({
        ...cell,
        incomingBall: null,
      })),
    );
    const recalculatedBoard = placePreviewBalls(newBoard, state.nextBalls);

    return {
      needsRecalculation: true,
      newState: {
        ...state,
        board: recalculatedBoard,
      },
    };
  }

  /**
   * Convert preview balls to real balls and place new preview balls
   */
  convertPreviewToReal(
    state: GameState,
    steppedOnIncomingBall?: BallColor,
    wasSteppedOnBallPopped = false,
  ): ConversionResult {
    return handleIncomingBallConversion(
      state.board,
      steppedOnIncomingBall,
      wasSteppedOnBallPopped,
    );
  }

  /**
   * Check if game is over
   */
  checkGameOver(state: GameState): boolean {
    return isBoardFull(state.board);
  }

  /**
   * Calculate score for lines
   */
  calculateScore(lines: Line[]): number {
    return lines.reduce(
      (total, line) =>
        total + this.lineDetectionEngine.calculateLineScore(line),
      0,
    );
  }

  /**
   * Update score in game state
   */
  updateScore(state: GameState, points: number): GameState {
    const newScore = state.score + points;
    const isNewHighScore = newScore > state.highScore;
    return {
      ...state,
      score: newScore,
      highScore: isNewHighScore ? newScore : state.highScore,
      isNewHighScore,
      currentGameBeatHighScore: isNewHighScore,
    };
  }

  /**
   * Update statistics
   */
  updateStatistics(
    state: GameState,
    updates: {
      turnsCount?: number;
      linesPopped?: number;
      longestLinePopped?: number;
    },
  ): GameState {
    return {
      ...state,
      statistics: {
        turnsCount: state.statistics.turnsCount + (updates.turnsCount || 0),
        linesPopped: state.statistics.linesPopped + (updates.linesPopped || 0),
        longestLinePopped: Math.max(
          state.statistics.longestLinePopped,
          updates.longestLinePopped || 0,
        ),
      },
    };
  }

  /**
   * Find path between two positions
   */
  findPath(board: Cell[][], from: Coord, to: Coord): [number, number][] | null {
    return findPath(board, from, to);
  }

  /**
   * Find unreachable cells from a position
   */
  findUnreachableCells(board: Cell[][], from: Coord): [number, number][] {
    return findUnreachableCells(board, from);
  }

  /**
   * Validate a move
   */
  validateMove(board: Cell[][], from: Coord, to: Coord): boolean {
    return validateMove(board, from.x, from.y, to.x, to.y);
  }
}
