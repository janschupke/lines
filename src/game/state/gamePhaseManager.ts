import { BALLS_PER_TURN, type BallColor } from "../constants";
import {
  getRandomNextBalls,
  isBoardFull,
  findLine,
  recalculateIncomingPositions,
  getRandomEmptyCells,
} from "../logic";
import type { Cell } from "../types";

export interface GamePhase {
  type: "idle" | "moving" | "popping" | "converting" | "gameOver";
  data?: Record<string, unknown>;
}

export interface MoveResult {
  newBoard: Cell[][];
  linesFormed: boolean;
  ballsRemoved?: [number, number][];
  pointsEarned?: number;
}

export interface ConversionResult {
  newBoard: Cell[][];
  nextBalls: BallColor[];
  gameOver: boolean;
}

export class GamePhaseManager {
  /**
   * Handles the completion of a ball move
   */
  static handleMoveCompletion(
    board: Cell[][],
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    nextBalls: BallColor[],
  ): MoveResult {
    const newBoard = board.map((row) =>
      row.map((cell) => ({ ...cell, active: false })),
    );

    // Move the ball
    newBoard[toY][toX].ball = board[fromY][fromX].ball;
    newBoard[fromY][fromX].ball = null;
    newBoard[toY][toX].incomingBall = null;

    // Handle incoming ball recalculation if moved to a cell with incoming ball
    if (board[toY][toX].incomingBall) {
      if (isBoardFull(newBoard)) {
        // Board is full: clear all incoming balls and end game
        const clearedBoard = newBoard.map((row) =>
          row.map((cell) => ({ ...cell, incomingBall: null })),
        );
        return {
          newBoard: clearedBoard,
          linesFormed: false,
        };
      } else {
        // Recalculate incoming positions
        const recalculatedBoard = recalculateIncomingPositions(
          newBoard,
          nextBalls,
        );
        return {
          newBoard: recalculatedBoard,
          linesFormed: false,
        };
      }
    }

    return {
      newBoard,
      linesFormed: false,
    };
  }

  /**
   * Checks for lines and handles ball removal
   */
  static handleLineDetection(
    board: Cell[][],
    toX: number,
    toY: number,
  ): MoveResult | null {
    const movedColor = board[toY][toX].ball?.color;
    if (!movedColor) return null;

    const lines = findLine(board, toX, toY, movedColor);
    const ballsToRemoveSet = new Set<string>();

    lines.forEach((line) => {
      line.forEach(([x, y]) => {
        ballsToRemoveSet.add(`${x},${y}`);
      });
    });

    if (ballsToRemoveSet.size === 0) return null;

    // Convert set back to array
    const ballsToRemove: [number, number][] = Array.from(ballsToRemoveSet).map(
      (key) => {
        const [x, y] = key.split(",").map(Number);
        return [x, y];
      },
    );

    // Remove balls
    const boardAfterRemoval = board.map((row) =>
      row.map((cell) => ({ ...cell })),
    );
    ballsToRemove.forEach(([x, y]) => {
      boardAfterRemoval[y][x].ball = null;
    });

    return {
      newBoard: boardAfterRemoval,
      linesFormed: true,
      ballsRemoved: ballsToRemove,
      pointsEarned: ballsToRemove.length,
    };
  }

  /**
   * Handles incoming ball conversion and new ball placement
   */
  static handleIncomingBallConversion(board: Cell[][]): ConversionResult {
    // Convert incoming balls to real balls
    const boardWithRealBalls = board.map((row) =>
      row.map((cell) => ({
        ...cell,
        ball: cell.incomingBall ? cell.incomingBall : cell.ball,
        incomingBall: null,
      })),
    );

    // Check if board is full after conversion
    if (isBoardFull(boardWithRealBalls)) {
      return {
        newBoard: boardWithRealBalls,
        nextBalls: getRandomNextBalls(BALLS_PER_TURN),
        gameOver: true,
      };
    }

    // Generate next preview balls
    const nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN);
    const afterBalls = this.placePreviewBalls(
      boardWithRealBalls,
      nextPreviewBalls,
    );

    return {
      newBoard: afterBalls,
      nextBalls: nextPreviewBalls,
      gameOver: isBoardFull(afterBalls),
    };
  }

  /**
   * Places preview balls on the board
   */
  private static placePreviewBalls(
    board: Cell[][],
    colors: BallColor[],
  ): Cell[][] {
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const positions = getRandomEmptyCells(newBoard, colors.length);
    positions.forEach(([x, y], i) => {
      newBoard[y][x].incomingBall = { color: colors[i] };
    });
    return newBoard;
  }

  /**
   * Validates if a move is possible
   */
  static validateMove(
    board: Cell[][],
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): boolean {
    // Check if source has a ball
    if (!board[fromY][fromX].ball) return false;

    // Check if target is empty
    if (board[toY][toX].ball) return false;

    // Check if it's the same cell
    if (fromX === toX && fromY === toY) return false;

    return true;
  }

  /**
   * Checks if the game should end
   */
  static checkGameOver(board: Cell[][]): boolean {
    return isBoardFull(board);
  }
}
