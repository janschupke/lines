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
import { StorageManager, type PersistedGameState } from "../services/storage/storageManager";
import { useCellInteraction } from "./cellInteractionHandler";
import { TurnFlowController, type UIUpdateCallbacks } from "../logic/turnFlowController";
import { GameEngine } from "../logic/gameEngine";
import { coordToKey } from "@shared/utils/coordinates";

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
  floatingScores: Array<{
    id: string;
    score: number;
    x: number;
    y: number;
    timestamp: number;
  }>;
  growingBalls: Array<{
    id: string;
    x: number;
    y: number;
    color: BallColor;
    isTransitioning: boolean;
    timestamp: number;
  }>;
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
  const uiUpdateCallbacks: UIUpdateCallbacks = useMemo(
    () => ({
      onPhaseChange: (phase: TurnPhase) => {
        // Can be used for logging/debugging
        console.debug("Turn phase:", phase);
      },
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
        if (update.type === "pop") {
          const data = update.data as { balls: [number, number][] };
          const ballSet = new Set(data.balls.map(([x, y]) => coordToKey({ x, y })));
          animationState.startPoppingAnimation(ballSet);
          setTimeout(() => {
            animationState.stopPoppingAnimation();
          }, ANIMATION_DURATIONS.POP_BALL);
        } else if (update.type === "grow") {
          const data = update.data as {
            transitioning: Array<{ x: number; y: number; color: string }>;
            new: Array<{ x: number; y: number; color: string }>;
          };
          data.transitioning.forEach((ball) => {
            animationState.addGrowingBall(
              ball.x,
              ball.y,
              ball.color as BallColor,
              true,
            );
          });
          data.new.forEach((ball) => {
            animationState.addGrowingBall(
              ball.x,
              ball.y,
              ball.color as BallColor,
              false,
            );
          });
        } else if (update.type === "floatingScore") {
          const data = update.data as { score: number; x: number; y: number };
          animationState.addFloatingScore(data.score, data.x, data.y);
        }
      },
      onAnimationComplete: async (_phase: TurnPhase) => {
        // Animation completion is handled by timeouts in TurnFlowController
        return Promise.resolve();
      },
    }),
    [animationState],
  );

  // Handle move start (called from cell interaction)
  const handleMoveStart = useCallback(
    (color: BallColor, path: [number, number][]) => {
      // Start moving animation
      setUIState((prev) => ({
        ...prev,
        movingBall: { color, path },
        movingStep: 0,
        selected: null,
      }));
      animationState.setMovingBall({ color, path });
      animationState.setMovingStep(0);
    },
    [animationState],
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
      if (uiState.movingBall) {
        // Animation complete, execute turn
        const [fromX, fromY] = uiState.movingBall.path[0];
        const [toX, toY] =
          uiState.movingBall.path[uiState.movingBall.path.length - 1];

        // Update statistics
        statisticsTracker.recordTurn();
        onActivity();

        // Execute turn using TurnFlowController
        turnFlowControllerRef.current
          .executeTurn(
            {
              ...gameState,
              statistics: statisticsTracker.getCurrentStatistics(),
            },
            { from: { x: fromX, y: fromY }, to: { x: toX, y: toY } },
            uiUpdateCallbacks,
          )
          .then((newGameState) => {
            // Update state
            setGameState(newGameState);
            statisticsTracker.loadStatistics(newGameState.statistics);

            // Clear moving animation
            setUIState((prev) => ({
              ...prev,
              movingBall: null,
              movingStep: 0,
            }));
            animationState.setMovingBall(null);
            animationState.setMovingStep(0);
          })
          .catch((error) => {
            console.error("Error executing turn:", error);
            // Clear moving animation on error
            setUIState((prev) => ({
              ...prev,
              movingBall: null,
              movingStep: 0,
            }));
            animationState.setMovingBall(null);
            animationState.setMovingStep(0);
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
  }, [
    uiState.movingBall,
    uiState.movingStep,
    gameState,
    statisticsTracker,
    onActivity,
    animationState,
    uiUpdateCallbacks,
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
      for (let x = 0; x < newGameState.board[y].length; x++) {
        const cell = newGameState.board[y][x];
        if (cell.ball) {
          animationState.addGrowingBall(x, y, cell.ball.color, false);
        }
        if (cell.incomingBall) {
          animationState.addGrowingBall(x, y, cell.incomingBall.color, false);
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

