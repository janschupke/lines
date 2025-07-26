import type { Cell, BallColor, GameStatistics, MoveResult as GameMoveResult } from "../types";
import { ANIMATION_DURATIONS } from "../config";
import {
  handleMoveCompletion,
  handleLineDetection,
  handleIncomingBallConversion,
} from "../logic";
import { StatisticsTracker } from "../statisticsTracker";
import { StorageManager } from "../storageManager";

export interface MoveProcessorActions {
  setScore: (score: number) => void;
  setGameOver: (gameOver: boolean) => void;
  setShowGameEndDialog: (show: boolean) => void;
  setFinalStatistics: (stats: GameStatistics | null) => void;
  setPoppingBalls: (poppingBalls: Set<string>) => void;
  setBoard: (board: Cell[][]) => void;
  setNextBalls: (nextBalls: BallColor[], board?: Cell[][]) => void;
  onActivity: () => void;
  setTimerActive: (active: boolean) => void;
}

/**
 * Process a completed move and handle all subsequent game logic
 */
export async function processMove(
  board: Cell[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  currentScore: number,
  currentGameOver: boolean,
  nextBalls: BallColor[],
  statisticsTracker: StatisticsTracker,
  actions: MoveProcessorActions,
): Promise<void> {
  // Handle move completion
  const moveResult = handleMoveCompletion(board, fromX, fromY, toX, toY);
  actions.setBoard(moveResult.newBoard);

  // Update statistics and timer
  statisticsTracker.recordTurn();
  actions.onActivity();

  // Check for lines and handle removal
  const lineResult = handleLineDetection(moveResult.newBoard, toX, toY);

  if (lineResult) {
    await handleLineRemoval(lineResult, currentScore, statisticsTracker, actions);
  } else {
    await handleBallConversion(moveResult.newBoard, toX, toY, currentScore, statisticsTracker, actions);
  }

  // Persist game state
  persistGameState(moveResult.newBoard, nextBalls, currentScore, currentGameOver, statisticsTracker);
}

async function handleLineRemoval(
  lineResult: GameMoveResult,
  currentScore: number,
  statisticsTracker: StatisticsTracker,
  actions: MoveProcessorActions,
): Promise<void> {
  // Update score
  const newScore = currentScore + (lineResult.pointsEarned || 0);
  actions.setScore(newScore);

  // Set popping animation
  actions.setPoppingBalls(
    new Set((lineResult.ballsRemoved || []).map(([x, y]) => `${x},${y}`)),
  );

  // Update statistics
  statisticsTracker.recordLinePop(
    lineResult.ballsRemoved?.length || 0,
    lineResult.pointsEarned || 0,
  );

  // Clear popping balls after animation
  setTimeout(() => {
    actions.setPoppingBalls(new Set());
    actions.setBoard(lineResult.newBoard);
  }, ANIMATION_DURATIONS.POP_BALL);
}

async function handleBallConversion(
  board: Cell[][],
  toX: number,
  toY: number,
  currentScore: number,
  statisticsTracker: StatisticsTracker,
  actions: MoveProcessorActions,
): Promise<void> {
  // Check if we stepped on an incoming ball
  const steppedOnIncomingBall = board[toY][toX].incomingBall?.color;
  
  const conversionResult = handleIncomingBallConversion(board, steppedOnIncomingBall);
  
  if (conversionResult.linesFormed) {
    // Lines were formed by spawning balls
    const newScore = currentScore + (conversionResult.pointsEarned || 0);
    actions.setScore(newScore);
    
    actions.setPoppingBalls(
      new Set((conversionResult.ballsRemoved || []).map(([x, y]) => `${x},${y}`)),
    );

    statisticsTracker.recordLinePop(
      conversionResult.ballsRemoved?.length || 0,
      conversionResult.pointsEarned || 0,
    );

    setTimeout(() => {
      actions.setPoppingBalls(new Set());
      actions.setNextBalls(conversionResult.nextBalls, conversionResult.newBoard);
    }, ANIMATION_DURATIONS.POP_BALL);
  } else {
    // No lines formed by spawning
    actions.setNextBalls(conversionResult.nextBalls, conversionResult.newBoard);
  }

  if (conversionResult.gameOver) {
    const finalStats = statisticsTracker.getCurrentStatistics();
    actions.setFinalStatistics(finalStats);
    actions.setGameOver(true);
    actions.setShowGameEndDialog(true);
  }
}

function persistGameState(
  board: Cell[][],
  nextBalls: BallColor[],
  score: number,
  gameOver: boolean,
  statisticsTracker: StatisticsTracker,
): void {
  const gameState = {
    board,
    score,
    selected: null,
    gameOver,
    nextBalls,
    timer: 0, // Will be updated by timer hook
    timerActive: false, // Will be updated by timer hook
    movingBall: null,
    movingStep: 0,
    poppingBalls: new Set<string>(),
    hoveredCell: null,
    pathTrail: null,
    notReachable: false,
    showGameEndDialog: false,
    statistics: statisticsTracker.getCurrentStatistics(),
  };
  StorageManager.saveGameState(gameState);
} 
