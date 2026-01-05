import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type {
  Cell,
  BallColor,
  GameState,
  UIState,
  GameActions,
  TurnPhase,
} from "../types";
import { ANIMATION_DURATIONS } from "../config";
import { useGameTimer } from "../hooks/useGameTimer";
import { useGameAnimation } from "../hooks/useGameAnimation";
import { StatisticsTracker } from "../services/statistics/statisticsTracker";
import {
  StorageManager,
  type PersistedGameState,
} from "../services/storage/storageManager";
import { useCellInteraction } from "./cellInteractionHandler";
import {
  TurnFlowController,
  type UIUpdateCallbacks,
} from "../logic/turnFlowController";
import { GameEngine } from "../logic/gameEngine";
import { coordToKey } from "@shared/utils/coordinates";
import { cloneBoard } from "../utils/boardUtils";

/**
 * Combined state returned to components
 *
 * Internally, GameState and UIState are separated for better testability and maintainability.
 * This interface combines them for convenient use by components.
 */
interface CombinedGameState extends GameState {
  selected: { x: number; y: number } | null;
  hoveredCell: { x: number; y: number } | null;
  pathTrail: [number, number][] | null;
  notReachable: boolean;
  movingBall: { color: BallColor; path: [number, number][] } | null;
  movingStep: number;
  poppingBalls: Set<string>;
  floatingScores: {
    id: string;
    score: number;
    x: number;
    y: number;
    timestamp: number;
  }[];
  growingBalls: {
    id: string;
    x: number;
    y: number;
    color: BallColor;
    isTransitioning: boolean;
    timestamp: number;
  }[];
}

export const useGameStateManager = (
  initialBoard?: Cell[][],
  initialNextBalls?: BallColor[],
): [CombinedGameState, GameActions] => {
  // Load saved game state on initialization
  const [savedState] = useState<PersistedGameState | null>(() => {
    return StorageManager.loadGameState();
  });

  // Initialize GameEngine and TurnFlowController
  const gameEngineRef = useRef(new GameEngine());
  const turnFlowControllerRef = useRef(new TurnFlowController());

  // Separated Game State (pure game data)
  const [gameState, setGameState] = useState<GameState>(() => {
    if (savedState) {
      return {
        board: savedState.board,
        score: savedState.score,
        highScore: savedState.highScore,
        isNewHighScore: false,
        currentGameBeatHighScore: false,
        gameOver: savedState.gameOver,
        nextBalls: savedState.nextBalls,
        timer: savedState.timer,
        timerActive: savedState.timerActive,
        statistics: savedState.statistics,
        showGameEndDialog: false,
      };
    }
    if (initialBoard && initialNextBalls) {
      return {
        board: initialBoard,
        score: 0,
        highScore: StorageManager.loadHighScore(),
        isNewHighScore: false,
        currentGameBeatHighScore: false,
        gameOver: false,
        nextBalls: initialNextBalls,
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
    return gameEngineRef.current.createNewGame();
  });

  // UI State (presentation)
  const [uiState, setUIState] = useState<UIState>(() => ({
    selected: null,
    hoveredCell: null,
    pathTrail: null,
    notReachable: false,
    movingBall: null,
    movingStep: 0,
    poppingBalls: new Set(),
    floatingScores: [],
    growingBalls: [],
  }));

  // Animation state hook
  const animationState = useGameAnimation();

  // Ref to track if turn is being processed to prevent multiple executions
  const isProcessingTurnRef = useRef(false);

  // Statistics tracker
  const [statisticsTracker] = useState(() => {
    const tracker = new StatisticsTracker();
    if (savedState?.statistics) {
      tracker.loadStatistics(savedState.statistics);
    }
    return tracker;
  });

  // Timer hook
  const gameTimer = useGameTimer(gameState.timer, gameState.timerActive);

  // Sync timer state with game state
  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      timer: gameTimer.timer,
      timerActive: gameTimer.timerActive,
    }));
  }, [gameTimer.timer, gameTimer.timerActive]);

  // Activity handler
  const onActivity = useCallback(() => {
    gameTimer.onActivity();
  }, [gameTimer]);

  // High score management - automatically check and update when score changes
  useEffect(() => {
    if (gameState.score > 0 && gameState.score > gameState.highScore) {
      const newHighScore = gameState.score;
      setGameState((prev) => ({
        ...prev,
        highScore: newHighScore,
        isNewHighScore: true,
        currentGameBeatHighScore: true,
      }));
      StorageManager.saveHighScore(newHighScore);
    }
  }, [gameState.score, gameState.highScore]);

  // Reset high score flags when starting new game
  useEffect(() => {
    if (!gameState.gameOver) {
      setGameState((prev) => ({
        ...prev,
        isNewHighScore: false,
        currentGameBeatHighScore: false,
      }));
    }
  }, [gameState.gameOver]);

  // Cell interaction actions
  const cellInteractionActions = {
    setSelected: (selected: { x: number; y: number } | null) => {
      setUIState((prev) => ({ ...prev, selected }));
    },
    setHoveredCell: (hoveredCell: { x: number; y: number } | null) => {
      setUIState((prev) => ({ ...prev, hoveredCell }));
    },
    setPathTrail: (pathTrail: [number, number][] | null) => {
      setUIState((prev) => ({ ...prev, pathTrail }));
    },
    setNotReachable: (notReachable: boolean) => {
      setUIState((prev) => ({ ...prev, notReachable }));
    },
    clearPathPreview: () => {
      setUIState((prev) => ({
        ...prev,
        pathTrail: null,
        notReachable: false,
      }));
    },
  };

  // UI Update callbacks for TurnFlowController
  // Use refs to ensure stable callbacks that don't cause re-renders
  const animationStateRef = useRef(animationState);
  useEffect(() => {
    animationStateRef.current = animationState;
  }, [animationState]);

  const uiUpdateCallbacks: UIUpdateCallbacks = useMemo(
    () => ({
      onGameStateUpdate: (newState: GameState) => {
        setGameState(newState);
        // Persist after every turn
        StorageManager.saveGameState({
          ...newState,
          board: newState.board,
          score: newState.score,
          highScore: newState.highScore,
          nextBalls: newState.nextBalls,
          timer: newState.timer,
          timerActive: newState.timerActive,
          gameOver: newState.gameOver,
          statistics: newState.statistics,
        } as PersistedGameState);
      },
      onUIUpdate: (update) => {
        const currentAnimationState = animationStateRef.current;
        if (update.type === "pop") {
          const data = update.data as { balls: [number, number][] };
          const ballSet = new Set(
            data.balls.map(([x, y]) => coordToKey({ x, y })),
          );

          // Clear moving ball animation so the ball at destination can be popped
          // The game state has already been updated with the ball at destination,
          // so clearing the moving animation will show the regular ball which can then pop
          setUIState((prev) => ({
            ...prev,
            movingBall: null,
            movingStep: 0,
          }));
          currentAnimationState.setMovingBall(null);
          currentAnimationState.setMovingStep(0);

          // Small delay to ensure React has rendered the ball at destination
          setTimeout(() => {
            currentAnimationState.startPoppingAnimation(ballSet);
            setTimeout(() => {
              currentAnimationState.stopPoppingAnimation();
            }, ANIMATION_DURATIONS.POP_BALL);
          }, 0);
        } else if (update.type === "grow") {
          const data = update.data as {
            transitioning: { x: number; y: number; color: string }[];
            new: { x: number; y: number; color: string }[];
          };
          data.transitioning.forEach((ball) => {
            currentAnimationState.addGrowingBall(
              ball.x,
              ball.y,
              ball.color as BallColor,
              true,
            );
          });
          data.new.forEach((ball) => {
            currentAnimationState.addGrowingBall(
              ball.x,
              ball.y,
              ball.color as BallColor,
              false,
            );
          });
        } else if (update.type === "floatingScore") {
          const data = update.data as { score: number; x: number; y: number };
          currentAnimationState.addFloatingScore(data.score, data.x, data.y);
        }
      },
      onAnimationComplete: async (_phase: TurnPhase) => {
        // Animation completion is handled by timeouts in TurnFlowController
        return Promise.resolve();
      },
    }),
    [], // Empty dependency array - callbacks are stable, use refs for current state
  );

  // Handle move start (called from cell interaction)
  // Capture the board state at move start to ensure validation uses correct state
  const handleMoveStart = useCallback(
    (
      color: BallColor,
      path: [number, number][],
      from: { x: number; y: number },
      to: { x: number; y: number },
    ) => {
      // Capture board state snapshot at move start
      const boardSnapshot = cloneBoard(gameState.board);

      // Start moving animation
      setUIState((prev) => ({
        ...prev,
        movingBall: { color, path, from, to, boardSnapshot }, // Store from/to and board snapshot
        movingStep: 0,
        selected: null,
      }));
      animationState.setMovingBall({ color, path });
      animationState.setMovingStep(0);
    },
    [animationState, gameState.board],
  );

  // Cell interaction handlers
  const cellHandlers = useCellInteraction(
    gameState.board,
    gameState.gameOver,
    !!uiState.movingBall,
    uiState.selected,
    cellInteractionActions,
    handleMoveStart,
  );

  // Animation effect for moving ball
  useEffect(() => {
    if (
      !uiState.movingBall ||
      uiState.movingStep >= uiState.movingBall.path.length
    ) {
      if (uiState.movingBall && !isProcessingTurnRef.current) {
        // Animation complete, execute turn
        // Use the stored from/to coordinates and board snapshot
        const { from, to, boardSnapshot } = uiState.movingBall;

        // Mark as processing to prevent this effect from running again
        // when gameState updates during turn execution
        isProcessingTurnRef.current = true;

        // Update statistics - only called once per turn now
        statisticsTracker.recordTurn();
        onActivity();

        // Execute turn using TurnFlowController with the board snapshot from when move started
        turnFlowControllerRef.current
          .executeTurn(
            {
              ...gameState,
              board: boardSnapshot, // Use board snapshot from when move started
              statistics: statisticsTracker.getCurrentStatistics(),
            },
            { from, to },
            uiUpdateCallbacks,
          )
          .then((newGameState) => {
            // State already updated via onGameStateUpdate callbacks during turn execution
            // Clear moving animation AFTER board state is updated to prevent flicker
            setUIState((prev) => ({
              ...prev,
              movingBall: null,
              movingStep: 0,
            }));
            animationState.setMovingBall(null);
            animationState.setMovingStep(0);
            isProcessingTurnRef.current = false;

            // Update statistics tracker
            statisticsTracker.loadStatistics(newGameState.statistics);
          })
          .catch((error) => {
            console.error("Error executing turn:", error);
            // Clear animation and reset flag on error
            setUIState((prev) => ({
              ...prev,
              movingBall: null,
              movingStep: 0,
            }));
            animationState.setMovingBall(null);
            animationState.setMovingStep(0);
            isProcessingTurnRef.current = false;
          });
      }
      return;
    }

    // Continue animation with timer
    const animationTimer = setTimeout(() => {
      setUIState((prev) => ({
        ...prev,
        movingStep: (prev.movingStep || 0) + 1,
      }));
      animationState.setMovingStep((uiState.movingStep || 0) + 1);
    }, ANIMATION_DURATIONS.MOVING_STEP);

    return () => clearTimeout(animationTimer);
    // uiUpdateCallbacks is stable (empty deps in useMemo), so we don't need it in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    uiState.movingBall,
    uiState.movingStep,
    gameState,
    statisticsTracker,
    onActivity,
    animationState,
  ]);

  // Stop timer on game over
  useEffect(() => {
    if (gameState.gameOver) {
      gameTimer.setTimerActive(false);
    }
  }, [gameState.gameOver, gameTimer]);

  // Start new game
  const startNewGame = useCallback(() => {
    const newGameState = gameEngineRef.current.resetGame(gameState.highScore);
    setGameState(newGameState);
    gameTimer.resetTimer();
    setUIState({
      selected: null,
      hoveredCell: null,
      pathTrail: null,
      notReachable: false,
      movingBall: null,
      movingStep: 0,
      poppingBalls: new Set(),
      floatingScores: [],
      growingBalls: [],
    });
    animationState.resetAnimationState();
    statisticsTracker.reset();

    // Animate initial balls
    for (let y = 0; y < newGameState.board.length; y++) {
      const row = newGameState.board[y];
      if (row) {
        for (let x = 0; x < row.length; x++) {
          const cell = row[x];
          if (cell) {
            if (cell.ball) {
              animationState.addGrowingBall(x, y, cell.ball.color, false);
            }
            if (cell.incomingBall) {
              animationState.addGrowingBall(
                x,
                y,
                cell.incomingBall.color,
                false,
              );
            }
          }
        }
      }
    }

    StorageManager.clearGameState();
    StorageManager.saveGameState({
      ...newGameState,
      board: newGameState.board,
      score: newGameState.score,
      highScore: newGameState.highScore,
      nextBalls: newGameState.nextBalls,
      timer: newGameState.timer,
      timerActive: newGameState.timerActive,
      gameOver: newGameState.gameOver,
      statistics: newGameState.statistics,
    } as PersistedGameState);
  }, [gameState.highScore, animationState, statisticsTracker, gameTimer]);

  const handleNewGameFromDialog = useCallback(() => {
    setGameState((prev) => ({ ...prev, showGameEndDialog: false }));
    startNewGame();
  }, [startNewGame]);

  const handleCloseDialog = useCallback(() => {
    setGameState((prev) => ({ ...prev, showGameEndDialog: false }));
  }, []);

  // Combine states for backward compatibility
  const combinedState: CombinedGameState = {
    ...gameState,
    ...uiState,
    floatingScores: animationState.floatingScores,
    growingBalls: animationState.growingBalls,
    poppingBalls: animationState.poppingBalls,
    movingBall: animationState.movingBall,
    movingStep: animationState.movingStep,
  };

  return [
    combinedState,
    {
      startNewGame,
      handleCellClick: cellHandlers.handleCellClick,
      handleCellHover: cellHandlers.handleCellHover,
      handleCellLeave: cellHandlers.handleCellLeave,
      handleNewGameFromDialog,
      handleCloseDialog,
    },
  ];
};
