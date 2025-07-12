import { useState, useCallback, useEffect } from 'react';
import { 
  BALLS_PER_TURN, 
  ANIMATION_DURATIONS,
  TIMER_INTERVAL_MS,
  type BallColor
} from '../constants';
import { 
  getRandomNextBalls,
  createEmptyBoard,
  placeRealBalls,
  placePreviewBalls,
} from '../logic';
import type { Cell, GameState, GameActions } from '../types';
import { GamePhaseManager } from './gamePhaseManager';
import { useGameBoard } from './useGameBoard';
import { useGameTimer } from './useGameTimer';
import { useGameAnimation } from './useGameAnimation';
import { useHighScores } from './useHighScores';

export const useGameState = (initialBoard?: Cell[][], initialNextBalls?: BallColor[]): [GameState, GameActions] => {
  // Board, selection, next balls
  const boardState = useGameBoard(initialBoard, initialNextBalls);
  // Timer
  const timerState = useGameTimer();
  // Animation
  const animationState = useGameAnimation();
  // High scores
  const highScoreState = useHighScores();

  // Additional state
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);
  const [pathTrail, setPathTrail] = useState<[number, number][] | null>(null);
  const [notReachable, setNotReachable] = useState<boolean>(false);

  // Timer effect
  useEffect(() => {
    if (!timerState.timerActive) return;
    const interval = setInterval(() => setTimer(t => t + 1), TIMER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [timerState.timerActive]);

  // Initialize high scores
  useEffect(() => {
    const loadHighScores = () => {
      // setCurrentHighScore(currentHigh); // This line was removed as per the edit hint.
    };
    loadHighScores();
  }, []);

  // Stop timer on game over
  useEffect(() => {
    if (gameOver) timerState.setTimerActive(false);
  }, [gameOver, timerState]);

  // Check for new high score
  const checkForNewHighScore = useCallback((currentScore: number): boolean => {
    return highScoreState.checkForNewHighScore(currentScore, timer);
  }, [timer, highScoreState]);

  // Animation effect for moving ball
  useEffect(() => {
    if (!animationState.movingBall || animationState.movingStep >= animationState.movingBall.path.length) {
      if (animationState.movingBall) {
        // Animation complete, process the move
        const [fromX, fromY] = animationState.movingBall.path[0];
        const [toX, toY] = animationState.movingBall.path[animationState.movingBall.path.length - 1];
        
        // Handle move completion using GamePhaseManager
        const moveResult = GamePhaseManager.handleMoveCompletion(boardState.board, fromX, fromY, toX, toY, boardState.nextBalls);
        boardState.setBoard(moveResult.newBoard);
        
        // Start timer after first move
        if (!timerState.timerActive && timer === 0) {
          timerState.setTimerActive(true);
        }
        
        // Check for lines and handle removal
        const lineResult = GamePhaseManager.handleLineDetection(moveResult.newBoard, toX, toY);
        
        if (lineResult) {
          // Lines were formed - handle ball removal
          setScore(s => s + lineResult.pointsEarned!);
          animationState.setPoppingBalls(new Set(lineResult.ballsRemoved!.map(([x, y]) => `${x},${y}`)));
          
          // Check for new high score
          const newScore = score + lineResult.pointsEarned!;
          checkForNewHighScore(newScore);
          
          // Clear popping balls after animation
          setTimeout(() => {
            animationState.setPoppingBalls(new Set());
            
            // Keep incoming balls in their current positions - don't recalculate
            boardState.setBoard(lineResult.newBoard);
          }, ANIMATION_DURATIONS.POP_BALL);
        } else {
          // No lines formed - convert incoming balls
          const conversionResult = GamePhaseManager.handleIncomingBallConversion(moveResult.newBoard);
          boardState.setBoard(conversionResult.newBoard);
          boardState.setNextBalls(conversionResult.nextBalls);
          
          if (conversionResult.gameOver) {
            setGameOver(true);
            setShowGameEndDialog(true);
          }
        }
        
        // Reset animation state
        animationState.setMovingBall(null);
        animationState.setMovingStep(0);
      }
      return;
    }

    // Continue animation
    animationState.setMovingStep(prev => prev + 1);
    // No cleanup needed
  }, [animationState.movingBall, animationState.movingStep, boardState.board, boardState.nextBalls, timerState.timerActive, timer, score, checkForNewHighScore]);

  // Cleanup animation on unmount
  // (No cleanup needed for movingBall, as it's not a frame id)

  // Start new game
  const startNewGame = useCallback(() => {
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(BALLS_PER_TURN);
    const boardWithRealBalls = placeRealBalls(board, initialBalls);
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    const finalBoard = placePreviewBalls(boardWithRealBalls, initialNext);
    
    boardState.setBoard(finalBoard);
    setScore(0);
    setGameOver(false);
    boardState.setNextBalls(getRandomNextBalls(BALLS_PER_TURN));
    setTimer(0);
    timerState.setTimerActive(false);
    animationState.setMovingBall(null);
    animationState.setMovingStep(0);
    animationState.setPoppingBalls(new Set());
    setHoveredCell(null);
    setPathTrail(null);
    setNotReachable(false);
    setShowGameEndDialog(false);
  }, [boardState, timerState, animationState]);

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
      selected: boardState.selected,
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
      currentHighScore: highScoreState.currentHighScore,
      isNewHighScore: highScoreState.isNewHighScore,
      showGameEndDialog,
    },
    {
      startNewGame,
      handleCellClick: boardState.handleCellClick,
      handleCellHover: boardState.handleCellHover,
      handleCellLeave: boardState.handleCellLeave,
      handleNewGameFromDialog,
      handleCloseDialog,
    }
  ];
}; 
