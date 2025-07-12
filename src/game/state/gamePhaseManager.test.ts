import { describe, it, expect, beforeEach } from 'vitest';
import { GamePhaseManager } from './gamePhaseManager';
import { createEmptyBoard, getRandomNextBalls } from '../logic';
import type { Cell } from '../types';
import type { BallColor } from '../constants';

describe('GamePhaseManager', () => {
  let board: Cell[][];
  let nextBalls: BallColor[];

  beforeEach(() => {
    board = createEmptyBoard();
    nextBalls = getRandomNextBalls(3);
  });

  describe('validateMove', () => {
    it('validates valid moves correctly', () => {
      // Manually place a ball at (0,0) instead of using random placement
      const boardWithBall = board.map(row => row.map(cell => ({ ...cell })));
      boardWithBall[0][0].ball = { color: 'red' as BallColor };
      
      // Valid move from (0,0) to (1,1)
      expect(GamePhaseManager.validateMove(boardWithBall, 0, 0, 1, 1)).toBe(true);
    });

    it('rejects moves to same cell', () => {
      const boardWithBall = board.map(row => row.map(cell => ({ ...cell })));
      boardWithBall[0][0].ball = { color: 'red' as BallColor };
      
      // Invalid move: same cell
      expect(GamePhaseManager.validateMove(boardWithBall, 0, 0, 0, 0)).toBe(false);
    });

    it('rejects moves from empty cell', () => {
      // Invalid move: no ball at source
      expect(GamePhaseManager.validateMove(board, 0, 0, 1, 1)).toBe(false);
    });

    it('rejects moves to occupied cell', () => {
      const boardWithBalls = board.map(row => row.map(cell => ({ ...cell })));
      boardWithBalls[0][0].ball = { color: 'red' as BallColor };
      boardWithBalls[1][1].ball = { color: 'blue' as BallColor };
      
      // Invalid move: target cell occupied
      expect(GamePhaseManager.validateMove(boardWithBalls, 0, 0, 1, 1)).toBe(false);
    });
  });

  describe('handleMoveCompletion', () => {
    it('moves ball correctly', () => {
      const boardWithBall = board.map(row => row.map(cell => ({ ...cell })));
      boardWithBall[0][0].ball = { color: 'red' as BallColor };
      
      const result = GamePhaseManager.handleMoveCompletion(boardWithBall, 0, 0, 1, 1, nextBalls);
      
      expect(result.newBoard[0][0].ball).toBeNull();
      expect(result.newBoard[1][1].ball?.color).toBe('red');
      expect(result.linesFormed).toBe(false);
    });

    it('clears incoming ball from destination', () => {
      const boardWithBall = board.map(row => row.map(cell => ({ ...cell })));
      boardWithBall[0][0].ball = { color: 'red' as BallColor };
      boardWithBall[1][1].incomingBall = { color: 'blue' as BallColor };
      
      const result = GamePhaseManager.handleMoveCompletion(boardWithBall, 0, 0, 1, 1, nextBalls);
      
      expect(result.newBoard[1][1].incomingBall).toBeNull();
    });

    it('handles move to cell with incoming ball', () => {
      const boardWithBall = board.map(row => row.map(cell => ({ ...cell })));
      boardWithBall[0][0].ball = { color: 'red' as BallColor };
      boardWithBall[1][1].incomingBall = { color: 'blue' as BallColor };
      
      const result = GamePhaseManager.handleMoveCompletion(boardWithBall, 0, 0, 1, 1, nextBalls);
      
      // Should recalculate incoming positions
      expect(result.newBoard[1][1].ball?.color).toBe('red');
      expect(result.newBoard[1][1].incomingBall).toBeNull();
    });
  });

  describe('handleLineDetection', () => {
    it('detects horizontal lines', () => {
      // Create a horizontal line of 5 red balls
      const testBoard = createEmptyBoard();
      for (let i = 0; i < 5; i++) {
        testBoard[0][i].ball = { color: 'red' as BallColor };
      }
      
      const result = GamePhaseManager.handleLineDetection(testBoard, 2, 0);
      
      expect(result).not.toBeNull();
      expect(result?.linesFormed).toBe(true);
      expect(result?.pointsEarned).toBe(5);
      expect(result?.ballsRemoved).toHaveLength(5);
    });

    it('detects vertical lines', () => {
      // Create a vertical line of 5 red balls
      const testBoard = createEmptyBoard();
      for (let i = 0; i < 5; i++) {
        testBoard[i][0].ball = { color: 'red' as BallColor };
      }
      
      const result = GamePhaseManager.handleLineDetection(testBoard, 0, 2);
      
      expect(result).not.toBeNull();
      expect(result?.linesFormed).toBe(true);
      expect(result?.pointsEarned).toBe(5);
    });

    it('detects diagonal lines', () => {
      // Create a diagonal line of 5 red balls
      const testBoard = createEmptyBoard();
      for (let i = 0; i < 5; i++) {
        testBoard[i][i].ball = { color: 'red' as BallColor };
      }
      
      const result = GamePhaseManager.handleLineDetection(testBoard, 2, 2);
      
      expect(result).not.toBeNull();
      expect(result?.linesFormed).toBe(true);
      expect(result?.pointsEarned).toBe(5);
    });

    it('returns null when no lines are formed', () => {
      const boardWithBall = board.map(row => row.map(cell => ({ ...cell })));
      boardWithBall[0][0].ball = { color: 'red' as BallColor };
      
      const result = GamePhaseManager.handleLineDetection(boardWithBall, 0, 0);
      
      expect(result).toBeNull();
    });

    it('handles multiple lines simultaneously', () => {
      // Create a cross pattern that forms both horizontal and vertical lines
      const testBoard = createEmptyBoard();
      
      // Horizontal line at row 2
      for (let i = 0; i < 5; i++) {
        testBoard[2][i].ball = { color: 'red' as BallColor };
      }
      
      // Vertical line at column 2
      for (let i = 0; i < 5; i++) {
        testBoard[i][2].ball = { color: 'red' as BallColor };
      }
      
      const result = GamePhaseManager.handleLineDetection(testBoard, 2, 2);
      
      expect(result).not.toBeNull();
      expect(result?.linesFormed).toBe(true);
      // Should count all unique balls (9 total, but intersection counted once)
      expect(result?.pointsEarned).toBe(9);
    });

    it('preserves incoming balls when lines are removed', () => {
      // Create a board with incoming balls and a line
      const testBoard = createEmptyBoard();
      
      // Place incoming balls at specific positions
      testBoard[0][0].incomingBall = { color: 'blue' as BallColor };
      testBoard[1][1].incomingBall = { color: 'green' as BallColor };
      testBoard[2][2].incomingBall = { color: 'yellow' as BallColor };
      
      // Create a horizontal line of 5 red balls
      for (let i = 0; i < 5; i++) {
        testBoard[3][i].ball = { color: 'red' as BallColor };
      }
      
      const result = GamePhaseManager.handleLineDetection(testBoard, 2, 3);
      
      expect(result).not.toBeNull();
      expect(result?.linesFormed).toBe(true);
      expect(result?.pointsEarned).toBe(5);
      
      // Check that incoming balls are preserved in their original positions
      expect(result?.newBoard[0][0].incomingBall?.color).toBe('blue');
      expect(result?.newBoard[1][1].incomingBall?.color).toBe('green');
      expect(result?.newBoard[2][2].incomingBall?.color).toBe('yellow');
      
      // Check that the line balls were removed
      for (let i = 0; i < 5; i++) {
        expect(result?.newBoard[3][i].ball).toBeNull();
      }
    });
  });

  describe('handleIncomingBallConversion', () => {
    it('converts incoming balls to real balls', () => {
      // Manually place incoming balls at specific positions
      const boardWithIncoming = board.map(row => row.map(cell => ({ ...cell })));
      boardWithIncoming[0][0].incomingBall = { color: 'red' as BallColor };
      boardWithIncoming[1][1].incomingBall = { color: 'blue' as BallColor };
      boardWithIncoming[2][2].incomingBall = { color: 'green' as BallColor };
      
      const result = GamePhaseManager.handleIncomingBallConversion(boardWithIncoming);
      
      // Should convert incoming balls to real balls
      let realBallCount = 0;
      let incomingBallCount = 0;
      
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].ball) realBallCount++;
          if (result.newBoard[y][x].incomingBall) incomingBallCount++;
        }
      }
      
      // Should have 3 real balls (converted from incoming balls)
      expect(realBallCount).toBe(3);
      // Should have new preview balls placed
      expect(incomingBallCount).toBeGreaterThan(0);
      expect(result.gameOver).toBe(false);
    });

    it('handles board full scenario', () => {
      // Fill the board completely
      const fullBoard = board.map(row => 
        row.map(cell => ({ ...cell, ball: { color: 'red' as BallColor } }))
      );
      
      const result = GamePhaseManager.handleIncomingBallConversion(fullBoard);
      
      expect(result.gameOver).toBe(true);
      
      // Should clear all incoming balls
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].incomingBall) incomingBallCount++;
        }
      }
      expect(incomingBallCount).toBe(0);
    });

    it('places fewer balls when limited space available', () => {
      // Fill most of the board, leave only 1 empty cell
      const almostFullBoard = board.map((row, y) => 
        row.map((cell, x) => {
          if (x === 8 && y === 8) return cell; // Leave one empty cell
          return { ...cell, ball: { color: 'red' as BallColor } };
        })
      );
      
      const result = GamePhaseManager.handleIncomingBallConversion(almostFullBoard);
      
      // Should place as many balls as possible given the space
      let realBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.newBoard[y][x].ball) realBallCount++;
        }
      }
      
      // Should have 80 balls (79 original + 1 from the empty cell)
      expect(realBallCount).toBe(80);
      // Game should not be over because there's still space for preview balls
      expect(result.gameOver).toBe(false);
    });
  });

  describe('checkGameOver', () => {
    it('detects full board', () => {
      const fullBoard = board.map(row => 
        row.map(cell => ({ ...cell, ball: { color: 'red' as BallColor } }))
      );
      
      expect(GamePhaseManager.checkGameOver(fullBoard)).toBe(true);
    });

    it('detects non-full board', () => {
      expect(GamePhaseManager.checkGameOver(board)).toBe(false);
    });

    it('detects partially filled board', () => {
      const partialBoard = board.map(row => row.map(cell => ({ ...cell })));
      partialBoard[0][0].ball = { color: 'red' as BallColor };
      partialBoard[1][1].ball = { color: 'blue' as BallColor };
      
      expect(GamePhaseManager.checkGameOver(partialBoard)).toBe(false);
    });
  });

  describe('Integration: Line removal preserves incoming balls', () => {
    it('incoming balls stay in position after line removal', () => {
      // Create a board with incoming balls and a line
      const testBoard = createEmptyBoard();
      
      // Place incoming balls at specific positions
      testBoard[0][0].incomingBall = { color: 'blue' as BallColor };
      testBoard[1][1].incomingBall = { color: 'green' as BallColor };
      testBoard[2][2].incomingBall = { color: 'yellow' as BallColor };
      
      // Create a horizontal line of 5 red balls
      for (let i = 0; i < 5; i++) {
        testBoard[3][i].ball = { color: 'red' as BallColor };
      }
      
      // Simulate line removal
      const lineResult = GamePhaseManager.handleLineDetection(testBoard, 2, 3);
      
      expect(lineResult).not.toBeNull();
      expect(lineResult?.linesFormed).toBe(true);
      
      // Verify that incoming balls are preserved exactly where they were
      const boardAfterRemoval = lineResult!.newBoard;
      
      // Incoming balls should be in the same positions
      expect(boardAfterRemoval[0][0].incomingBall?.color).toBe('blue');
      expect(boardAfterRemoval[1][1].incomingBall?.color).toBe('green');
      expect(boardAfterRemoval[2][2].incomingBall?.color).toBe('yellow');
      
      // Line balls should be removed
      for (let i = 0; i < 5; i++) {
        expect(boardAfterRemoval[3][i].ball).toBeNull();
      }
      
      // No new incoming balls should be placed
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (boardAfterRemoval[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }
      
      // Should have exactly 3 incoming balls (the original ones)
      expect(incomingBallCount).toBe(3);
    });

    it('game state preserves incoming balls after line removal', () => {
      // This test simulates the actual game state behavior
      const testBoard = createEmptyBoard();
      
      // Place incoming balls at specific positions
      testBoard[0][0].incomingBall = { color: 'blue' as BallColor };
      testBoard[1][1].incomingBall = { color: 'green' as BallColor };
      testBoard[2][2].incomingBall = { color: 'yellow' as BallColor };
      
      // Create a horizontal line of 5 red balls
      for (let i = 0; i < 5; i++) {
        testBoard[3][i].ball = { color: 'red' as BallColor };
      }
      
      // Simulate the game state behavior: line removal without recalculation
      const lineResult = GamePhaseManager.handleLineDetection(testBoard, 2, 3);
      
      expect(lineResult).not.toBeNull();
      
      // The board after line removal should have the same incoming balls
      const boardAfterRemoval = lineResult!.newBoard;
      
      // Verify incoming balls are preserved
      expect(boardAfterRemoval[0][0].incomingBall?.color).toBe('blue');
      expect(boardAfterRemoval[1][1].incomingBall?.color).toBe('green');
      expect(boardAfterRemoval[2][2].incomingBall?.color).toBe('yellow');
      
      // Verify line was removed
      for (let i = 0; i < 5; i++) {
        expect(boardAfterRemoval[3][i].ball).toBeNull();
      }
      
      // Verify no recalculation happened (incoming balls stay in same positions)
      const originalIncomingPositions = [
        { x: 0, y: 0, color: 'blue' },
        { x: 1, y: 1, color: 'green' },
        { x: 2, y: 2, color: 'yellow' }
      ];
      
      originalIncomingPositions.forEach(({ x, y, color }) => {
        expect(boardAfterRemoval[y][x].incomingBall?.color).toBe(color);
      });
    });

    it('automatic ball placement does not trigger line removal', () => {
      // This test verifies that when incoming balls are automatically converted to real balls
      // and form a valid line, the line is NOT removed (only user moves trigger line removal)
      
      // Create a board with a line that would be formed by automatic placement
      const testBoard = createEmptyBoard();
      
      // Create a horizontal line of 4 red balls
      for (let i = 0; i < 4; i++) {
        testBoard[0][i].ball = { color: 'red' as BallColor };
      }
      
      // Place an incoming ball that would complete the line
      testBoard[0][4].incomingBall = { color: 'red' as BallColor };
      
      // Simulate automatic ball conversion (what happens after a user move)
      const conversionResult = GamePhaseManager.handleIncomingBallConversion(testBoard);
      
      // The line should NOT be removed because automatic placement doesn't trigger line detection
      // We verify this by checking that the ball is still there
      expect(conversionResult.newBoard[0][4].ball?.color).toBe('red');
      
      // The line should remain intact (5 balls in a row)
      for (let i = 0; i < 5; i++) {
        expect(conversionResult.newBoard[0][i].ball?.color).toBe('red');
      }
      
      // No scoring should occur from automatic placement
      // This is verified by the fact that line detection is not called during conversion
    });
  });
}); 
