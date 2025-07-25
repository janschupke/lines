import { BALLS_PER_TURN, type BallColor } from "../constants";
import {
  getRandomNextBalls,
  isBoardFull,
  findLine,
  placePreviewBalls,
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
  nextBalls?: BallColor[];
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
  ): MoveResult {
    const newBoard = board.map((row) =>
      row.map((cell) => ({ ...cell, active: false })),
    );

    // Move the ball
    newBoard[toY][toX].ball = board[fromY][fromX].ball;
    newBoard[fromY][fromX].ball = null;
    newBoard[toY][toX].incomingBall = null; // Clear incoming ball at destination

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

    const lines: [number, number][][] = findLine(board, toX, toY, movedColor);
    const ballsToRemoveSet = new Set<string>();

    lines.forEach((line: [number, number][]) => {
      line.forEach(([x, y]: [number, number]) => {
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
  static handleIncomingBallConversion(
    board: Cell[][], 
    steppedOnIncomingBall?: BallColor
  ): ConversionResult {
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
    let nextPreviewBalls: BallColor[];
    let afterBalls: Cell[][];

    if (steppedOnIncomingBall) {
      // When stepping on an incoming ball, all incoming balls get converted to real balls
      // Then we spawn 3 new incoming balls, with one being the recalculated stepped-on color
      nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN - 1); // Get 2 random colors
      nextPreviewBalls.push(steppedOnIncomingBall); // Add the recalculated color
      afterBalls = placePreviewBalls(boardWithRealBalls, nextPreviewBalls);
    } else {
      // Normal case: generate 3 new balls
      nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN);
      afterBalls = placePreviewBalls(boardWithRealBalls, nextPreviewBalls);
    }

    return {
      newBoard: afterBalls,
      nextBalls: nextPreviewBalls,
      gameOver: isBoardFull(afterBalls),
    };
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
