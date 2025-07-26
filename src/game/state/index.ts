import { useState, useCallback, useEffect } from "react";
import type { Cell, BallColor } from "../types";
import {
  INITIAL_BALLS,
  BALLS_PER_TURN,
  ANIMATION_DURATIONS,
  TIMER_INTERVAL_MS,
} from "../config";
import {
  getRandomNextBalls,
  createEmptyBoard,
  placeRealBalls,
  placePreviewBalls,
  findPath,
} from "../logic";
import type { GameState, GameActions, GameStatistics } from "../types";
import { GamePhaseManager } from "./gamePhaseManager";
import { useGameBoard } from "../../hooks/useGameBoard";
import { useGameTimer } from "../../hooks/useGameTimer";
import { useGameAnimation } from "../../hooks/useGameAnimation";
import { StatisticsTracker } from "../statisticsTracker";

export const useGameState = (
  initialBoard?: Cell[][],
  initialNextBalls?: BallColor[],
): [GameState, GameActions] => {
  // Board, selection, next balls
  const boardState = useGameBoard(initialBoard, initialNextBalls);
  // Timer
  const timerState = useGameTimer();
  // Animation
  const animationState = useGameAnimation();

  // Additional state
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  const [finalStatistics, setFinalStatistics] = useState<GameStatistics | null>(null);

  // Game statistics tracker
  const [statisticsTracker] = useState(() => new StatisticsTracker());

  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [pathTrail, setPathTrail] = useState<[number, number][] | null>(null);
  const [notReachable, setNotReachable] = useState<boolean>(false);

  // --- Orchestrator event handlers ---
  // Click: select or move
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (gameOver || animationState.movingBall) return;
      const cell = boardState.board[y][x];
      if (cell.ball) {
        setSelected({ x, y });
        boardState.setBoard((prev) =>
          prev.map((row, yy) =>
            row.map((c, xx) => ({
              ...c,
              active: xx === x && yy === y,
            })),
          ),
        );
        setPathTrail(null);
        setNotReachable(false);
      } else if (selected) {
        // Validate move
        if (
          !GamePhaseManager.validateMove(
            boardState.board,
            selected.x,
            selected.y,
            x,
            y,
          )
        ) {
          setNotReachable(true);
          return;
        }
        // Find path
        const path = findPath(boardState.board, selected, { x, y });
        if (path && path.length > 1) {
          // Start animation
          animationState.setMovingBall({
            color: boardState.board[selected.y][selected.x].ball!.color,
            path,
          });
          animationState.setMovingStep(0);
          setPathTrail(null);
          setNotReachable(false);
          setSelected(null);
          boardState.setBoard((prev) =>
            prev.map((row) => row.map((cell) => ({ ...cell, active: false }))),
          );
        }
      }
    },
    [gameOver, animationState, boardState, selected],
  );

  // Hover: show path preview
  const handleCellHover = useCallback(
    (x: number, y: number) => {
      if (gameOver || animationState.movingBall || !selected) return;
      const cell = boardState.board[y][x];
      if (!cell.ball && selected) {
        const path = findPath(boardState.board, selected, { x, y });
        if (path && path.length > 1) {
          setPathTrail(path);
          setNotReachable(false);
        } else {
          setPathTrail(null);
          setNotReachable(true);
        }
      }
      setHoveredCell({ x, y });
    },
    [gameOver, animationState, boardState, selected],
  );

  // Leave: clear path preview
  const handleCellLeave = useCallback(() => {
    setHoveredCell(null);
    setPathTrail(null);
    setNotReachable(false);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timerState.timerActive) return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, TIMER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [timerState.timerActive, statisticsTracker]);

  // Stop timer on game over
  useEffect(() => {
    if (gameOver) timerState.setTimerActive(false);
  }, [gameOver, timerState]);

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

        // Handle move completion using GamePhaseManager
        const moveResult = GamePhaseManager.handleMoveCompletion(
          boardState.board,
          fromX,
          fromY,
          toX,
          toY,
        );
        // Update nextBalls and board - handleMoveCompletion returns the complete board
        if (moveResult.nextBalls) {
          // When stepping on an incoming ball, handleMoveCompletion already generated 3 new balls
          boardState.setNextBalls(moveResult.nextBalls);
          boardState.setBoard(moveResult.newBoard);
        } else {
          boardState.setBoard(moveResult.newBoard);
        }

        // Update statistics - increment turns count
        statisticsTracker.recordTurn();

        // Signal activity to timer
        timerState.onActivity();

        // Start timer after first move
        if (!timerState.timerActive && timer === 0) {
          timerState.setTimerActive(true);
        }

        // Check for lines and handle removal
        const lineResult = GamePhaseManager.handleLineDetection(
          moveResult.newBoard,
          toX,
          toY,
        );

        if (lineResult) {
          // Lines were formed - handle ball removal
          setScore((s) => {
            const newScore = s + lineResult.pointsEarned!;
            // Check for high score update after every score increase
            if (newScore > s) {
              // We'll trigger high score check in the Game component
            }
            return newScore;
          });
          animationState.setPoppingBalls(
            new Set(lineResult.ballsRemoved!.map(([x, y]) => `${x},${y}`)),
          );

          // Update statistics for line removal
          statisticsTracker.recordLinePop(
            lineResult.ballsRemoved!.length,
            lineResult.pointsEarned!,
          );

          // Clear popping balls after animation
          setTimeout(() => {
            animationState.setPoppingBalls(new Set());

            // Keep incoming balls in their current positions - don't recalculate
            boardState.setBoard(lineResult.newBoard);
          }, ANIMATION_DURATIONS.POP_BALL);
        } else {
          // No lines formed - convert incoming balls
          // Skip conversion if we already handled incoming balls in handleMoveCompletion
          if (!moveResult.nextBalls) {
            // Check if we stepped on an incoming ball
            const steppedOnIncomingBall = boardState.board[toY][toX].incomingBall?.color;
            
            const conversionResult =
              GamePhaseManager.handleIncomingBallConversion(moveResult.newBoard, steppedOnIncomingBall);
            boardState.setNextBalls(conversionResult.nextBalls, conversionResult.newBoard);

            if (conversionResult.gameOver) {
              // Finalize statistics when game ends
              const finalStats = statisticsTracker.getCurrentStatistics();
              setFinalStatistics(finalStats);
              setGameOver(true);
              setShowGameEndDialog(true);
            }
          }
        }

        // Reset animation state
        animationState.setMovingBall(null);
        animationState.setMovingStep(0);
      }
      return;
    }

    // Continue animation with timer
    const animationTimer = setTimeout(() => {
      animationState.setMovingStep((prev) => prev + 1);
    }, ANIMATION_DURATIONS.MOVE_BALL);

    return () => clearTimeout(animationTimer);
  }, [
    animationState.movingBall,
    animationState.movingStep,
    boardState.board,
    boardState.nextBalls,
    timerState.timerActive,
    timer,
    score,
    statisticsTracker,
    animationState,
    boardState,
    timerState,
  ]);

  // Cleanup animation on unmount
  // (No cleanup needed for movingBall, as it's not a frame id)

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
    boardState.setNextBalls(getRandomNextBalls(BALLS_PER_TURN), finalBoard);
    setTimer(0);
    timerState.setTimerActive(false);
    timerState.resetTimer();
    animationState.setMovingBall(null);
    animationState.setMovingStep(0);
    animationState.setPoppingBalls(new Set());
    setSelected(null);
    setHoveredCell(null);
    setPathTrail(null);
    setNotReachable(false);
    setShowGameEndDialog(false);

    // Reset statistics
    statisticsTracker.reset();
    setFinalStatistics(null);
  }, [boardState, timerState, animationState, statisticsTracker]);

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
      selected,
      gameOver,
      nextBalls: boardState.nextBalls,
      timer: timerState.timer,
      timerActive: timerState.timerActive,
      movingBall: animationState.movingBall,
      movingStep: animationState.movingStep,
      poppingBalls: animationState.poppingBalls,
      hoveredCell,
      pathTrail,
      notReachable,
      showGameEndDialog,
      statistics: finalStatistics || statisticsTracker.getCurrentStatistics(),
    },
    {
      startNewGame,
      handleCellClick,
      handleCellHover,
      handleCellLeave,
      handleNewGameFromDialog,
      handleCloseDialog,
    },
  ];
};
