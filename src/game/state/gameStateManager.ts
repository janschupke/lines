import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type {
  Cell,
  BallColor,
  GameState,
  GameActions,
  GameStatistics,
} from "../types";
import { TIMER_INTERVAL_MS, INITIAL_BALLS, BALLS_PER_TURN, INACTIVITY_TIMEOUT_MS } from "../config";
import { useGameBoard } from "../../hooks/useGameBoard";
import { useGameAnimation } from "../../hooks/useGameAnimation";
import { StatisticsTracker } from "../statisticsTracker";
import { StorageManager, type PersistedGameState } from "../storageManager";
import { useCellInteraction } from "./cellInteractionHandler";
import { processMove } from "./moveProcessor";
import {
  createEmptyBoard,
  getRandomNextBalls,
  placeRealBalls,
  placePreviewBalls,
} from "../logic";

export const useGameStateManager = (
  initialBoard?: Cell[][],
  initialNextBalls?: BallColor[],
): [GameState, GameActions] => {
  // Load saved game state on initialization
  const [savedState] = useState<PersistedGameState | null>(() => {
    return StorageManager.loadGameState();
  });

  // Core state hooks
  const boardState = useGameBoard(
    savedState?.board || initialBoard,
    savedState?.nextBalls || initialNextBalls,
  );
  const animationState = useGameAnimation();

  // Timer state - single source of truth
  const [timer, setTimer] = useState(savedState?.timer || 0);
  const [timerActive, setTimerActive] = useState(savedState?.timerActive || false);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear inactivity timeout
  const clearInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  // Set up inactivity timeout
  const setupInactivityTimeout = useCallback(() => {
    clearInactivityTimeout();
    if (timerActive) {
      inactivityTimeoutRef.current = setTimeout(() => {
        setTimerActive(false);
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [timerActive, clearInactivityTimeout]);

  // Timer effect - real-time updates
  useEffect(() => {
    if (!timerActive) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, TIMER_INTERVAL_MS);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerActive]);

  // Set up inactivity timeout when timer becomes active
  useEffect(() => {
    if (timerActive) {
      setupInactivityTimeout();
    } else {
      clearInactivityTimeout();
    }
  }, [timerActive, setupInactivityTimeout, clearInactivityTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Activity handler
  const onActivity = useCallback(() => {
    if (!timerActive) {
      setTimerActive(true);
    } else {
      setupInactivityTimeout();
    }
  }, [timerActive, setupInactivityTimeout]);

  // Game state
  const [score, setScore] = useState(savedState?.score || 0);
  const [highScore, setHighScore] = useState(() => {
    // Load high score from saved state or from separate storage
    if (savedState?.highScore !== undefined) {
      return savedState.highScore;
    }
    // Fallback to separate storage for legacy states
    return StorageManager.loadHighScore();
  });
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [gameOver, setGameOver] = useState(savedState?.gameOver || false);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  const [finalStatistics, setFinalStatistics] = useState<GameStatistics | null>(
    null,
  );

  // High score management
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [currentGameBeatHighScore, setCurrentGameBeatHighScore] =
    useState(false);

  // Check and update high score
  const checkAndUpdateHighScore = useCallback(
    (currentScore: number) => {
      if (currentScore > highScore) {
        setHighScore(currentScore);
        setIsNewHighScore(true);
        setCurrentGameBeatHighScore(true);
        return true;
      } else if (currentScore === highScore && currentScore > 0) {
        // If score equals current high score, don't set new high score flag
        setIsNewHighScore(false);
      }
      return false;
    },
    [highScore],
  );

  // Reset high score flags
  const resetNewHighScoreFlag = useCallback(() => {
    setIsNewHighScore(false);
  }, []);

  const resetCurrentGameHighScoreFlag = useCallback(() => {
    setCurrentGameBeatHighScore(false);
  }, []);

  // UI state
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [pathTrail, setPathTrail] = useState<[number, number][] | null>(null);
  const [notReachable, setNotReachable] = useState<boolean>(false);

  // Statistics tracker
  const [statisticsTracker] = useState(() => {
    const tracker = new StatisticsTracker();
    if (savedState?.statistics) {
      tracker.loadStatistics(savedState.statistics);
    }
    return tracker;
  });

  // Cell interaction actions
  const cellInteractionActions = {
    setSelected,
    setHoveredCell,
    setPathTrail,
    setNotReachable,
    clearPathPreview: () => {
      setPathTrail(null);
      setNotReachable(false);
    },
  };

  // Cell interaction handlers
  const cellHandlers = useCellInteraction(
    boardState.board,
    gameOver,
    !!animationState.movingBall,
    selected,
    cellInteractionActions,
    (color: BallColor, path: [number, number][]) => {
      animationState.setMovingBall({ color, path });
      animationState.setMovingStep(0);
      setSelected(null);
      boardState.setBoard((prev) =>
        prev.map((row) => row.map((cell) => ({ ...cell, active: false }))),
      );
    },
  );

  // Move processor actions
  const moveProcessorActions = useMemo(
    () => ({
      setScore,
      setHighScore,
      setGameOver,
      setShowGameEndDialog,
      setFinalStatistics,
      setPoppingBalls: animationState.setPoppingBalls,
      setBoard: boardState.setBoard,
      setNextBalls: boardState.setNextBalls,
      onActivity,
      setTimerActive,
      addFloatingScore: animationState.addFloatingScore,
      addGrowingBall: animationState.addGrowingBall,
      addSpawningBalls: animationState.addSpawningBalls,
      startPoppingAnimation: animationState.startPoppingAnimation,
      stopPoppingAnimation: animationState.stopPoppingAnimation,
      startSpawningAnimation: animationState.startSpawningAnimation,
      stopSpawningAnimation: animationState.stopSpawningAnimation,
    }),
    [
      animationState,
      boardState,
      onActivity,
    ],
  );

  // Stop timer on game over
  useEffect(() => {
    if (gameOver) setTimerActive(false);
  }, [gameOver]);

  // Animation effect for moving ball
  useEffect(() => {
    if (
      !animationState.movingBall ||
      animationState.movingStep >= animationState.movingBall.path.length
    ) {
      if (animationState.movingBall) {
        // Animation complete, process the move
        const [fromX, fromY] = animationState.movingBall.path[0];
        const [toX, toY] =
          animationState.movingBall.path[
            animationState.movingBall.path.length - 1
          ];

        // Process the move
        processMove(
          boardState.board,
          fromX,
          fromY,
          toX,
          toY,
          score,
          statisticsTracker,
          moveProcessorActions,
          timer,
          timerActive,
          highScore,
          isNewHighScore,
          currentGameBeatHighScore,
        );

        // Reset animation state
        animationState.setMovingBall(null);
        animationState.setMovingStep(0);
      }
      return;
    }

    // Continue animation with timer
    const animationTimer = setTimeout(() => {
      animationState.setMovingStep((prev) => prev + 1);
    }, 100); // Animation duration

    return () => clearTimeout(animationTimer);
  }, [
    animationState.movingBall,
    animationState.movingStep,
    boardState.board,
    boardState.nextBalls,
    timerActive,
    timer,
    score,
    statisticsTracker,
    animationState,
    boardState,
    moveProcessorActions,
    currentGameBeatHighScore,
    highScore,
    isNewHighScore,
  ]);

  // Start new game
  const startNewGame = useCallback(() => {
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(INITIAL_BALLS);
    const boardWithRealBalls = placeRealBalls(board, initialBalls);
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    const finalBoard = placePreviewBalls(boardWithRealBalls, initialNext);

    boardState.setBoard(finalBoard);
    setScore(0);
    setGameOver(false);
    boardState.setNextBalls(initialNext, finalBoard);
    setTimerActive(false);
    setTimer(0);
    animationState.resetAnimationState();
    setSelected(null);
    setHoveredCell(null);
    setPathTrail(null);
    setNotReachable(false);
    setShowGameEndDialog(false);

    // Reset statistics
    statisticsTracker.reset();
    setFinalStatistics(null);

    // Animate initial balls growing from zero size
    for (let y = 0; y < finalBoard.length; y++) {
      for (let x = 0; x < finalBoard[y].length; x++) {
        const cell = finalBoard[y][x];
        if (cell.ball) {
          // Real balls should grow from zero size
          animationState.addGrowingBall(x, y, cell.ball.color, false);
        }
        if (cell.incomingBall) {
          // Preview balls should grow from zero size
          animationState.addGrowingBall(x, y, cell.incomingBall.color, false);
        }
      }
    }

    // Clear saved game state and persist new game
    StorageManager.clearGameState();
    const newGameState: GameState = {
      board: finalBoard,
      score: 0,
      highScore,
      isNewHighScore: false,
      currentGameBeatHighScore: false,
      selected: null,
      gameOver: false,
      nextBalls: initialNext,
      timer: 0,
      timerActive: false,
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
    StorageManager.saveGameState(newGameState);
  }, [boardState, animationState, statisticsTracker, highScore]);

  const handleNewGameFromDialog = useCallback(() => {
    setShowGameEndDialog(false);
    startNewGame();
  }, [startNewGame]);

  const handleCloseDialog = useCallback(() => {
    setShowGameEndDialog(false);
  }, []);

  return [
    {
      board: boardState.board,
      score,
      highScore,
      isNewHighScore,
      currentGameBeatHighScore,
      selected,
      gameOver,
      nextBalls: boardState.nextBalls,
      timer,
      timerActive,
      movingBall: animationState.movingBall,
      movingStep: animationState.movingStep,
      poppingBalls: animationState.poppingBalls,
      hoveredCell,
      pathTrail,
      notReachable,
      showGameEndDialog,
      floatingScores: animationState.floatingScores,
      growingBalls: animationState.growingBalls,
      statistics: finalStatistics || statisticsTracker.getCurrentStatistics(),
    },
    {
      startNewGame,
      handleCellClick: cellHandlers.handleCellClick,
      handleCellHover: cellHandlers.handleCellHover,
      handleCellLeave: cellHandlers.handleCellLeave,
      handleNewGameFromDialog,
      handleCloseDialog,
      checkAndUpdateHighScore,
      resetNewHighScoreFlag,
      resetCurrentGameHighScoreFlag,
    },
  ];
};
