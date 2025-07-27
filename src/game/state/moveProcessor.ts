import { ANIMATION_DURATIONS } from "../config";
import type {
  Cell,
  BallColor,
  GameState,
  MoveResult,
  SpawnedBall,
} from "../types";
import type { StatisticsTracker, GameStatistics } from "../statisticsTracker";
import {
  handleIncomingBallConversion,
  isBoardFull,
} from "../logic/boardManagement";
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
  addGrowingBall: (
    x: number,
    y: number,
    color: BallColor,
    isTransitioning: boolean,
  ) => void;
  addSpawningBalls: (balls: SpawnedBall[]) => void;
  startPoppingAnimation: (balls: Set<string>) => void;
  stopPoppingAnimation: () => void;
  startSpawningAnimation: (balls: SpawnedBall[]) => void;
  stopSpawningAnimation: () => void;
}

/**
 * Process a completed move and handle all subsequent game logic with proper animation sequencing
 */
export async function processMove(
  board: Cell[][],
  fromX: number,
  fromY: number,
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
  // Step 1: Handle move completion
  const moveResult: MoveResult = handleMoveCompletion(
    board,
    fromX,
    fromY,
    toX,
    toY,
  );
  actions.setBoard(moveResult.newBoard);

  // Update statistics and timer
  statisticsTracker.recordTurn();
  actions.onActivity();

  // Check if we stepped on a preview ball
  const steppedOnPreview = moveResult.steppedOnIncomingBall;

  // Step 2: Check for lines formed by the move
  const lineResult = handleLineDetection(moveResult.newBoard, toX, toY);

  if (lineResult) {
    // Lines were formed by the move - handle line removal first
    // Check if the stepped-on preview ball was popped
    const wasSteppedOnBallPopped =
      steppedOnPreview &&
      lineResult.ballsRemoved?.some(([x, y]) => x === toX && y === toY);

    await handleLineRemoval(
      lineResult,
      currentScore,
      statisticsTracker,
      actions,
      currentTimer,
      currentTimerActive,
      highScore,
      isNewHighScore,
      currentGameBeatHighScore,
      steppedOnPreview,
      wasSteppedOnBallPopped,
      toX,
      toY,
    );
  } else {
    // No lines formed by the move - proceed with ball conversion
    await handleBallConversion(
      moveResult.newBoard,
      currentScore,
      statisticsTracker,
      actions,
      currentTimer,
      currentTimerActive,
      highScore,
      isNewHighScore,
      currentGameBeatHighScore,
      steppedOnPreview,
      false,
    );
  }
}

async function handleLineRemoval(
  lineResult: MoveResult,
  currentScore: number,
  statisticsTracker: StatisticsTracker,
  actions: MoveProcessorActions,
  currentTimer: number,
  currentTimerActive: boolean,
  highScore: number,
  isNewHighScore: boolean,
  currentGameBeatHighScore: boolean,
  steppedOnPreview?: BallColor,
  wasSteppedOnBallPopped: boolean = false,
  toX?: number,
  toY?: number,
): Promise<void> {
  // Update score
  const newScore = currentScore + (lineResult.pointsEarned || 0);
  actions.setScore(newScore);

  // Start popping animation
  actions.startPoppingAnimation(
    new Set((lineResult.ballsRemoved || []).map(([x, y]) => `${x},${y}`)),
  );

  // Add floating score animation
  if (lineResult.ballsRemoved && lineResult.ballsRemoved.length > 0) {
    // Calculate center of the popped line
    const centerX =
      lineResult.ballsRemoved.reduce(
        (sum: number, [x]: [number, number]) => sum + x,
        0,
      ) / lineResult.ballsRemoved.length;
    const centerY =
      lineResult.ballsRemoved.reduce(
        (sum: number, [, y]: [number, number]) => sum + y,
        0,
      ) / lineResult.ballsRemoved.length;

    actions.addFloatingScore(
      lineResult.pointsEarned || 0,
      Math.round(centerX),
      Math.round(centerY),
    );
  }

  // Update statistics
  if (lineResult.ballsRemoved) {
    statisticsTracker.recordLinePop(lineResult.ballsRemoved.length);
  }

  // Wait for popping animation to complete, then handle ball conversion
  setTimeout(async () => {
    actions.stopPoppingAnimation();

    // If the stepped-on ball was popped, restore it as an incoming ball
    let boardAfterLineRemoval = lineResult.newBoard;
    if (wasSteppedOnBallPopped && steppedOnPreview && toX !== undefined && toY !== undefined) {
      // The stepped-on position is exactly where the ball was moved to (toX, toY)
      // This position should now be empty after line removal
      if (
        !lineResult.newBoard[toY][toX].ball &&
        !lineResult.newBoard[toY][toX].incomingBall
      ) {
        boardAfterLineRemoval = lineResult.newBoard.map((row) =>
          row.map((cell) => ({ ...cell })),
        );
        boardAfterLineRemoval[toY][toX].incomingBall = { color: steppedOnPreview };
      }
    }

    actions.setBoard(boardAfterLineRemoval);

    // Now handle ball conversion on the board after line removal
    await handleBallConversion(
      boardAfterLineRemoval,
      newScore,
      statisticsTracker,
      actions,
      currentTimer,
      currentTimerActive,
      highScore,
      isNewHighScore,
      currentGameBeatHighScore,
      steppedOnPreview,
      wasSteppedOnBallPopped,
      true, // Indicate that a line was popped
    );
  }, ANIMATION_DURATIONS.POP_BALL);
}

async function handleBallConversion(
  board: Cell[][],
  currentScore: number,
  statisticsTracker: StatisticsTracker,
  actions: MoveProcessorActions,
  currentTimer: number,
  currentTimerActive: boolean,
  highScore: number,
  isNewHighScore: boolean,
  currentGameBeatHighScore: boolean,
  steppedOnPreview?: BallColor,
  wasSteppedOnBallPopped: boolean = false,
  lineWasPopped: boolean = false,
): Promise<void> {
  // If a line was popped, skip ball spawning and keep incoming balls as they are
  if (lineWasPopped) {
    // Keep incoming balls as incoming balls - don't convert them to real balls
    // Just check if the board is full with the current state
    if (isBoardFull(board)) {
      const finalStats = statisticsTracker.getCurrentStatistics();
      actions.setFinalStatistics(finalStats);
      actions.setGameOver(true);
      actions.setShowGameEndDialog(true);
    }

    // Update board state (keeping incoming balls as they are)
    actions.setBoard(board);

    // Persist game state
    persistGameState(
      board,
      [], // No new balls spawned
      currentScore,
      isBoardFull(board),
      statisticsTracker,
      currentTimer,
      currentTimerActive,
      highScore,
      isNewHighScore,
      currentGameBeatHighScore,
    );

    // Start timer after first move
    if (!currentTimerActive && currentTimer === 0) {
      actions.setTimerActive(true);
    }

    return;
  }

  // Handle incoming ball conversion with correct logic for stepped-on balls
  const conversionResult = handleIncomingBallConversion(
    board,
    steppedOnPreview,
    wasSteppedOnBallPopped,
  );

  // Track balls transitioning from preview to real for growing animation
  const transitioningBalls: SpawnedBall[] = [];

  // Track balls transitioning from preview to real
  for (let y = 0; y < conversionResult.newBoard.length; y++) {
    for (let x = 0; x < conversionResult.newBoard[y].length; x++) {
      const newCell = conversionResult.newBoard[y][x];
      const oldCell = board[y][x];
      if (oldCell.incomingBall && newCell.ball) {
        // This is a ball transitioning from preview to real
        transitioningBalls.push({
          x,
          y,
          color: oldCell.incomingBall.color,
          isTransitioning: true,
        });
      }
    }
  }

  // Track new preview balls being placed for growing animation
  const newPreviewBalls: SpawnedBall[] = [];
  for (let y = 0; y < conversionResult.newBoard.length; y++) {
    for (let x = 0; x < conversionResult.newBoard[y].length; x++) {
      const newCell = conversionResult.newBoard[y][x];
      const oldCell = board[y][x];
      if (newCell.incomingBall && !oldCell.incomingBall) {
        // This is a new preview ball being placed
        newPreviewBalls.push({
          x,
          y,
          color: newCell.incomingBall.color,
          isTransitioning: false,
        });
      }
    }
  }

  // Update board state first
  actions.setNextBalls(conversionResult.nextBalls, conversionResult.newBoard);

  // Add growing animations for transitioning balls (preview to real) immediately
  // Add growing animations for transitioning balls (preview to real)
  transitioningBalls.forEach((ball) => {
    actions.addGrowingBall(ball.x, ball.y, ball.color, true);
  });

  // Add growing animations for new preview balls
  newPreviewBalls.forEach((ball) => {
    actions.addGrowingBall(ball.x, ball.y, ball.color, false);
  });

  // Check if lines were formed by spawned balls
  if (conversionResult.linesFormed) {
    // Lines were formed by spawning - handle them after growing animation completes
    setTimeout(async () => {
      const newScore = currentScore + (conversionResult.pointsEarned || 0);
      actions.setScore(newScore);

      // Start popping animation for lines formed by spawning
      actions.startPoppingAnimation(
        new Set(
          (conversionResult.ballsRemoved || []).map(([x, y]) => `${x},${y}`),
        ),
      );

      // Add floating score animation
      if (
        conversionResult.ballsRemoved &&
        conversionResult.ballsRemoved.length > 0
      ) {
        const centerX =
          conversionResult.ballsRemoved.reduce(
            (sum: number, [x]: [number, number]) => sum + x,
            0,
          ) / conversionResult.ballsRemoved.length;
        const centerY =
          conversionResult.ballsRemoved.reduce(
            (sum: number, [, y]: [number, number]) => sum + y,
            0,
          ) / conversionResult.ballsRemoved.length;
        actions.addFloatingScore(
          conversionResult.pointsEarned || 0,
          centerX,
          centerY,
        );
      }

      // Update statistics
      if (conversionResult.ballsRemoved) {
        statisticsTracker.recordLinePop(conversionResult.ballsRemoved.length);
      }

      // Wait for popping animation to complete
      setTimeout(() => {
        actions.stopPoppingAnimation();
        actions.setBoard(conversionResult.newBoard);

        // Persist game state after popping animation completes
        persistGameState(
          conversionResult.newBoard,
          conversionResult.nextBalls,
          newScore,
          conversionResult.gameOver || false,
          statisticsTracker,
          currentTimer,
          currentTimerActive,
          highScore,
          isNewHighScore,
          currentGameBeatHighScore,
        );

        // Handle game over if needed
        if (conversionResult.gameOver) {
          const finalStats = statisticsTracker.getCurrentStatistics();
          actions.setFinalStatistics(finalStats);
          actions.setGameOver(true);
          actions.setShowGameEndDialog(true);
        }
      }, ANIMATION_DURATIONS.POP_BALL);
    }, ANIMATION_DURATIONS.GROW_BALL);
  } else {
    // No lines formed by spawning - complete after growing animation
    setTimeout(() => {
      persistGameState(
        conversionResult.newBoard,
        conversionResult.nextBalls,
        currentScore,
        conversionResult.gameOver || false,
        statisticsTracker,
        currentTimer,
        currentTimerActive,
        highScore,
        isNewHighScore,
        currentGameBeatHighScore,
      );

      // Handle game over if needed
      if (conversionResult.gameOver) {
        const finalStats = statisticsTracker.getCurrentStatistics();
        actions.setFinalStatistics(finalStats);
        actions.setGameOver(true);
        actions.setShowGameEndDialog(true);
      }
    }, ANIMATION_DURATIONS.GROW_BALL);
  }

  // Start timer after first move
  if (!currentTimerActive && currentTimer === 0) {
    actions.setTimerActive(true);
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
