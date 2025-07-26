import { ANIMATION_DURATIONS } from "../config";
import type { Cell, BallColor, GameState, GameStatistics, MoveResult } from "../types";
import type { StatisticsTracker } from "../statisticsTracker";
import { handleIncomingBallConversion } from "../logic/boardManagement";
import { handleMoveCompletion } from "../logic/moveHandler";
import { handleLineDetection } from "../logic/lineDetection";
import { StorageManager } from "../storageManager";

export interface MoveProcessorActions {
  setScore: (score: number) => void;
  setHighScore: (highScore: number) => void;
  setGameOver: (gameOver: boolean) => void;
  setShowGameEndDialog: (show: boolean) => void;
  setFinalStatistics: (stats: GameStatistics | null) => void;
  setPoppingBalls: (balls: Set<string>) => void;
  setBoard: (board: Cell[][]) => void;
  setNextBalls: (nextBalls: BallColor[], board?: Cell[][]) => void;
  onActivity: () => void;
  setTimerActive: (active: boolean) => void;
  addFloatingScore: (score: number, x: number, y: number) => void;
  addGrowingBall: (x: number, y: number, color: BallColor, isTransitioning: boolean) => void;
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
  nextBalls: BallColor[],
  statisticsTracker: StatisticsTracker,
  actions: MoveProcessorActions,
  currentTimer: number,
  currentTimerActive: boolean,
  highScore: number,
  isNewHighScore: boolean,
  currentGameBeatHighScore: boolean,
): Promise<void> {
  // Handle move completion
  const moveResult: MoveResult = handleMoveCompletion(board, fromX, fromY, toX, toY);
  actions.setBoard(moveResult.newBoard);

  // Update statistics and timer
  statisticsTracker.recordTurn();
  actions.onActivity();

  // Check for lines and handle removal
  const lineResult = handleLineDetection(moveResult.newBoard, toX, toY);

  if (lineResult) {
    await handleLineRemoval(lineResult, currentScore, statisticsTracker, actions, currentTimer, currentTimerActive, nextBalls, highScore, isNewHighScore, currentGameBeatHighScore);
  } else {
    await handleBallConversion(moveResult.newBoard, toX, toY, currentScore, statisticsTracker, actions, currentTimer, currentTimerActive, highScore, isNewHighScore, currentGameBeatHighScore);
  }
}

async function handleLineRemoval(
  lineResult: GameMoveResult,
  currentScore: number,
  statisticsTracker: StatisticsTracker,
  actions: MoveProcessorActions,
  currentTimer: number,
  currentTimerActive: boolean,
  nextBalls: BallColor[],
  highScore: number,
  isNewHighScore: boolean,
  currentGameBeatHighScore: boolean,
): Promise<void> {
  // Update score
  const newScore = currentScore + (lineResult.pointsEarned || 0);
  actions.setScore(newScore);

  // Set popping animation
  actions.setPoppingBalls(
    new Set((lineResult.ballsRemoved || []).map(([x, y]) => `${x},${y}`)),
  );

  // Add floating score animation
  if (lineResult.ballsRemoved && lineResult.ballsRemoved.length > 0) {
    // Calculate center of the popped line
    const centerX = lineResult.ballsRemoved.reduce((sum, [x]) => sum + x, 0) / lineResult.ballsRemoved.length;
    const centerY = lineResult.ballsRemoved.reduce((sum, [, y]) => sum + y, 0) / lineResult.ballsRemoved.length;
    
    actions.addFloatingScore(lineResult.pointsEarned || 0, Math.round(centerX), Math.round(centerY));
  }

  // Update statistics
  statisticsTracker.recordLinePop(
    lineResult.ballsRemoved?.length || 0,
    lineResult.pointsEarned || 0,
  );

  // Clear popping balls after animation and persist final state
  setTimeout(() => {
    actions.setPoppingBalls(new Set());
    actions.setBoard(lineResult.newBoard);
    // Persist the final state after line removal animation completes
    persistGameState(lineResult.newBoard, nextBalls, newScore, false, statisticsTracker, currentTimer, currentTimerActive, highScore, isNewHighScore, currentGameBeatHighScore);
  }, ANIMATION_DURATIONS.POP_BALL);
}

async function handleBallConversion(
  board: Cell[][],
  toX: number,
  toY: number,
  currentScore: number,
  statisticsTracker: StatisticsTracker,
  actions: MoveProcessorActions,
  currentTimer: number,
  currentTimerActive: boolean,
  highScore: number,
  isNewHighScore: boolean,
  currentGameBeatHighScore: boolean,
): Promise<void> {
  // Check if we stepped on an incoming ball
  const steppedOnIncomingBall = board[toY][toX].incomingBall?.color;
  
  const conversionResult = handleIncomingBallConversion(board, steppedOnIncomingBall);
  
  // Update board state first
  actions.setNextBalls(conversionResult.nextBalls, conversionResult.newBoard);
  
  // Trigger growing ball animations for converted balls (now on the updated board)
  for (let y = 0; y < conversionResult.newBoard.length; y++) {
    for (let x = 0; x < conversionResult.newBoard[y].length; x++) {
      const newCell = conversionResult.newBoard[y][x];
      const oldCell = board[y][x];
      if (oldCell.incomingBall && newCell.ball) {
        // This is a ball transitioning from preview to real
        actions.addGrowingBall(x, y, oldCell.incomingBall.color, true);
      }
    }
  }
  
  // Trigger growing ball animations for new preview balls
  for (let y = 0; y < conversionResult.newBoard.length; y++) {
    for (let x = 0; x < conversionResult.newBoard[y].length; x++) {
      const newCell = conversionResult.newBoard[y][x];
      const oldCell = board[y][x];
      if (newCell.incomingBall && !oldCell.incomingBall) {
        // This is a new preview ball being placed
        actions.addGrowingBall(x, y, newCell.incomingBall.color, false);
      }
    }
  }
  
  if (conversionResult.linesFormed) {
    // Lines were formed by spawning balls
    const newScore = currentScore + (conversionResult.pointsEarned || 0);
    actions.setScore(newScore);
    
    actions.setPoppingBalls(
      new Set((conversionResult.ballsRemoved || []).map(([x, y]) => `${x},${y}`)),
    );

    // Add floating score animation
    if (conversionResult.ballsRemoved && conversionResult.ballsRemoved.length > 0) {
      // Calculate center of the popped line
      const centerX = conversionResult.ballsRemoved.reduce((sum: number, [x]: [number, number]) => sum + x, 0) / conversionResult.ballsRemoved.length;
      const centerY = conversionResult.ballsRemoved.reduce((sum: number, [, y]: [number, number]) => sum + y, 0) / conversionResult.ballsRemoved.length;
      
      actions.addFloatingScore(conversionResult.pointsEarned || 0, Math.round(centerX), Math.round(centerY));
    }

    statisticsTracker.recordLinePop(
      conversionResult.ballsRemoved?.length || 0,
      conversionResult.pointsEarned || 0,
    );

    setTimeout(() => {
      actions.setPoppingBalls(new Set());
      // Persist the final state after ball conversion animation completes
      persistGameState(conversionResult.newBoard, conversionResult.nextBalls, newScore, conversionResult.gameOver || false, statisticsTracker, currentTimer, currentTimerActive, highScore, isNewHighScore, currentGameBeatHighScore);
    }, ANIMATION_DURATIONS.POP_BALL);
  } else {
    // No lines formed by spawning - persist the final state immediately
    persistGameState(conversionResult.newBoard, conversionResult.nextBalls, currentScore, conversionResult.gameOver || false, statisticsTracker, currentTimer, currentTimerActive, highScore, isNewHighScore, currentGameBeatHighScore);
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
  timer: number,
  timerActive: boolean,
  highScore: number,
  isNewHighScore: boolean,
  currentGameBeatHighScore: boolean,
): void {
  const gameState: GameState = {
    board,
    score,
    highScore,
    isNewHighScore,
    currentGameBeatHighScore,
    selected: null,
    gameOver,
    nextBalls,
    timer,
    timerActive,
    movingBall: null,
    movingStep: 0,
    poppingBalls: new Set(),
    hoveredCell: null,
    pathTrail: null,
    notReachable: false,
    showGameEndDialog: false,
    floatingScores: [],
    growingBalls: [],
    statistics: statisticsTracker.getCurrentStatistics(),
  };
  StorageManager.saveGameState(gameState);
} 
