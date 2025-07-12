import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  BOARD_SIZE, 
  BALLS_PER_TURN, 
  ANIMATION_DURATIONS,
  type BallColor
} from './constants';
import { 
  type Cell, 
  getRandomNextBalls,
  createEmptyBoard,
  placePreviewBalls,
  recalculateIncomingPositions,
  isBoardFull,
  findLine,
  findPath,
  getRandomEmptyCells
} from './gameLogic';

import HighScoreManager from './highScoreManager';





export interface GameState {
  board: Cell[][];
  score: number;
  selected: { x: number; y: number } | null;
  gameOver: boolean;
  nextBalls: BallColor[];
  timer: number;
  timerActive: boolean;
  movingBall: { color: BallColor; path: [number, number][] } | null;
  movingStep: number;
  poppingBalls: Set<string>;
  hoveredCell: { x: number; y: number } | null;
  pathTrail: [number, number][] | null;
  notReachable: boolean;
  currentHighScore: number;
  isNewHighScore: boolean;
  showGameEndDialog: boolean;
}

export interface GameActions {
  startNewGame: () => void;
  handleCellClick: (x: number, y: number) => void;
  handleCellHover: (x: number, y: number) => void;
  handleCellLeave: () => void;
  handleNewGameFromDialog: () => void;
  handleCloseDialog: () => void;
}

export const useGameState = (initialBoard?: Cell[][], initialNextBalls?: BallColor[]): [GameState, GameActions] => {
  const [board, setBoard] = useState<Cell[][]>(() => {
    if (initialBoard && initialNextBalls) {
      return placePreviewBalls(initialBoard, initialNextBalls);
    }
    // Start with empty board, add 3 real balls, then add 3 incoming preview balls
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(BALLS_PER_TURN);
    const boardWithRealBalls = placePreviewBalls(board, initialBalls);
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    return placePreviewBalls(boardWithRealBalls, initialNext);
  });
  
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<{x: number, y: number} | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [nextBalls, setNextBalls] = useState<BallColor[]>(() => getRandomNextBalls(BALLS_PER_TURN));
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [movingBall, setMovingBall] = useState<null | {color: BallColor; path: [number, number][]}>(null);
  const [movingStep, setMovingStep] = useState(0);
  const animationRef = useRef<number | null>(null);
  
  // High score state
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  
  const [poppingBalls, setPoppingBalls] = useState<Set<string>>(new Set());
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);
  const [pathTrail, setPathTrail] = useState<[number, number][] | null>(null);
  const [notReachable, setNotReachable] = useState<boolean>(false);

  const highScoreManager = useRef(new HighScoreManager());

  // Timer effect
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Initialize high scores
  useEffect(() => {
    const loadHighScores = () => {
      const currentHigh = highScoreManager.current.getCurrentHighScore();
      setCurrentHighScore(currentHigh);
    };
    loadHighScores();
  }, []);

  // Stop timer on game over
  useEffect(() => {
    if (gameOver) setTimerActive(false);
  }, [gameOver]);

  // Check for new high score
  const checkForNewHighScore = useCallback((currentScore: number): boolean => {
    if (highScoreManager.current.isNewHighScore(currentScore)) {
      const success = highScoreManager.current.addHighScore(currentScore, timer);
      if (success) {
        setCurrentHighScore(highScoreManager.current.getCurrentHighScore());
        setIsNewHighScore(true);
        return true;
      }
    }
    return false;
  }, [timer]);

  // Handle cell click: select or move
  const handleCellClick = useCallback((x: number, y: number) => {
    if (gameOver || movingBall) return;
    const cell = board[y][x];
    if (cell.ball) {
      setSelected({ x, y });
      setBoard(prev => prev.map((row, yy) => row.map((c, xx) => ({ ...c, active: xx === x && yy === y }))));
    } else if (selected) {
      const path = findPath(board, selected, { x, y });
      if (path && path.length > 1) {
        // Start animation
        setMovingBall({ color: board[selected.y][selected.x].ball!.color, path });
        setMovingStep(0);
        setPathTrail(null);
        setNotReachable(false);
      }
    }
  }, [board, gameOver, movingBall, selected]);

  // Handle cell hover for path preview
  const handleCellHover = useCallback((x: number, y: number) => {
    if (gameOver || movingBall || !selected) return;
    
    const cell = board[y][x];
    if (!cell.ball && selected) {
      const path = findPath(board, selected, { x, y });
      if (path && path.length > 1) {
        setPathTrail(path);
        setNotReachable(false);
      } else {
        setPathTrail(null);
        setNotReachable(true);
      }
    }
    setHoveredCell({ x, y });
  }, [board, gameOver, movingBall, selected]);

  const handleCellLeave = useCallback(() => {
    setHoveredCell(null);
    setPathTrail(null);
    setNotReachable(false);
  }, []);

  // Animation effect for moving ball
  useEffect(() => {
    if (!movingBall || movingStep >= movingBall.path.length) {
      if (movingBall) {
        // Animation complete, process the move
        const [fromX, fromY] = movingBall.path[0];
        const [toX, toY] = movingBall.path[movingBall.path.length - 1];
        const newBoard = board.map(row => row.map(cell => ({ ...cell, active: false })));
        newBoard[toY][toX].ball = board[fromY][fromX].ball;
        newBoard[fromY][fromX].ball = null;
        // Explicitly clear incomingBall for the destination cell
        newBoard[toY][toX].incomingBall = null;
        
        // If we moved to a position that had a preview ball, recalculate incoming positions
        if (board[toY][toX].incomingBall) {
          if (isBoardFull(newBoard)) {
            // Board is full: clear all incoming balls, preserve the moved ball, and end game
            const clearedBoard = newBoard.map(row => row.map(cell => ({ ...cell, incomingBall: null })));
            setBoard(clearedBoard);
            setGameOver(true);
            setShowGameEndDialog(true);
          } else {
            // Not full: recalculate incoming positions as usual
            const recalculatedBoard = recalculateIncomingPositions(newBoard, nextBalls);
            setBoard(recalculatedBoard);
          }
        } else {
          setBoard(newBoard);
        }
        
        setSelected(null);
        setMovingBall(null);
        setMovingStep(0);
        // Start timer after first move
        if (!timerActive && timer === 0) {
          setTimerActive(true);
        }
        
        // Check for lines
        const movedColor = newBoard[toY][toX].ball?.color;
        const allLines: Set<string> = new Set();
        const ballsToRemove: [number, number][] = [];
        let lines: [number, number][][] = [];
        
        if (movedColor) {
          lines = findLine(newBoard, toX, toY, movedColor);
          lines.forEach(line => {
            line.forEach(([x, y]) => {
              allLines.add(`${x},${y}`);
              ballsToRemove.push([x, y]);
            });
          });
        }
        
        if (ballsToRemove.length > 0) {
          // Remove balls and update score
          const newBoard = board.map(row => row.map(cell => ({ ...cell })));
          ballsToRemove.forEach(([x, y]) => {
            newBoard[y][x].ball = null;
          });
          
          const pointsEarned = ballsToRemove.length;
          setScore(s => s + pointsEarned);
          
          // Set popping animation
          setPoppingBalls(new Set(ballsToRemove.map(([x, y]) => `${x},${y}`)));
          
          // Check for new high score
          const newScore = score + pointsEarned;
          checkForNewHighScore(newScore);
          
          // Clear popping balls after animation
          setTimeout(() => {
            setPoppingBalls(new Set());
            
            // Check if board is full after removing balls
            if (isBoardFull(newBoard)) {
              // Ensure the moved ball is present and all incomingBall are cleared
              const clearedBoard = newBoard.map(row => row.map(cell => ({ ...cell, incomingBall: null })));
              setBoard(clearedBoard);
              setGameOver(true);
              setShowGameEndDialog(true);
            }
            setNextBalls(getRandomNextBalls(BALLS_PER_TURN));
          }, ANIMATION_DURATIONS.POP_BALL);
        } else {
          // Only spawn as many balls as there are empty cells
          const emptyCount = getRandomEmptyCells(newBoard, BOARD_SIZE * BOARD_SIZE).length;
          if (emptyCount === 0) {
            // Board is full after move: clear all incoming balls, do not convert them, and end game
            const clearedBoard = newBoard.map(row => row.map(cell => ({ ...cell, incomingBall: null })));
            setBoard(clearedBoard);
            setGameOver(true);
            setShowGameEndDialog(true);
            return;
          }
          // Only convert incoming balls if there is at least one empty cell
          const ballsToAdd = Math.min(BALLS_PER_TURN, emptyCount);
          const boardWithRealBalls = newBoard.map(row => row.map(cell => ({
            ...cell,
            ball: cell.incomingBall ? cell.incomingBall : cell.ball,
            incomingBall: null
          })));
          // Generate next preview balls ONCE
          const nextPreviewBalls = getRandomNextBalls(BALLS_PER_TURN);
          // Add new preview balls for next turn, but only if there is space
          const afterBalls = ballsToAdd > 0 ? placePreviewBalls(boardWithRealBalls, nextPreviewBalls.slice(0, ballsToAdd)) : boardWithRealBalls;
          setBoard(afterBalls);
          setNextBalls(nextPreviewBalls);
          if (isBoardFull(afterBalls)) {
            setGameOver(true);
            setShowGameEndDialog(true);
          }
        }
      }
      return () => { if (animationRef.current) clearTimeout(animationRef.current); };
    }

    // Continue animation
    animationRef.current = setTimeout(() => {
      setMovingStep(step => step + 1);
    }, ANIMATION_DURATIONS.MOVE_BALL);
  }, [movingBall, movingStep, board, nextBalls, timerActive, timer, score, checkForNewHighScore]);

  // Start new game with 3 real balls and 3 incoming preview balls
  const startNewGame = useCallback(() => {
    const board = createEmptyBoard();
    const initialBalls = getRandomNextBalls(BALLS_PER_TURN);
    const boardWithRealBalls = placePreviewBalls(board, initialBalls);
    const initialNext = getRandomNextBalls(BALLS_PER_TURN);
    const boardWithPreview = placePreviewBalls(boardWithRealBalls, initialNext);
    setBoard(boardWithPreview);
    setScore(0);
    setSelected(null);
    setGameOver(false);
    setIsNewHighScore(false);
    setShowGameEndDialog(false);
    setNextBalls(initialNext);
    setTimer(0);
    setTimerActive(false);
  }, []);

  // Game end dialog handlers
  const handleNewGameFromDialog = useCallback(() => {
    setShowGameEndDialog(false);
    startNewGame();
  }, [startNewGame]);

  const handleCloseDialog = useCallback(() => {
    setShowGameEndDialog(false);
  }, []);

  const gameState: GameState = {
    board,
    score,
    selected,
    gameOver,
    nextBalls,
    timer,
    timerActive,
    movingBall,
    movingStep,
    poppingBalls,
    hoveredCell,
    pathTrail,
    notReachable,
    currentHighScore,
    isNewHighScore,
    showGameEndDialog,
  };

  const gameActions: GameActions = {
    startNewGame,
    handleCellClick,
    handleCellHover,
    handleCellLeave,
    handleNewGameFromDialog,
    handleCloseDialog,
  };

  return [gameState, gameActions];
}; 
