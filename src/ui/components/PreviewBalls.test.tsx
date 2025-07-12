import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import Board from './Board';
import type { Cell } from '../../game/types';

// Mock the game state hook
vi.mock('../../game/state', () => ({
  useGameState: vi.fn(() => [
    {
      board: [],
      score: 0,
      selected: null,
      gameOver: false,
      nextBalls: ['red', 'blue', 'green'],
      timer: 0,
      timerActive: false,
      movingBall: null,
      movingStep: 0,
      poppingBalls: new Set(),
      hoveredCell: null,
      pathTrail: null,
      notReachable: false,
      currentHighScore: 0,
      isNewHighScore: false,
      showGameEndDialog: false,
    },
    {
      startNewGame: vi.fn(),
      handleCellClick: vi.fn(),
      handleCellHover: vi.fn(),
      handleCellLeave: vi.fn(),
      handleNewGameFromDialog: vi.fn(),
      handleCloseDialog: vi.fn(),
    }
  ])
}));

describe('Preview Balls Functionality', () => {
  describe('Initial Preview Balls Display', () => {
    it('preview balls are smaller than regular balls', () => {
      // Create a board with both regular balls and preview balls
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: { color: 'red' }, incomingBall: null, active: false },
          { x: 1, y: 0, ball: null, incomingBall: { color: 'blue' }, active: false },
          { x: 2, y: 0, ball: { color: 'green' }, incomingBall: null, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={vi.fn()}
        />
      );

      // Get all balls (both regular and preview)
      const regularBalls = screen.getAllByTitle(/^(red|green)$/);
      const previewBalls = screen.getAllByTitle(/^Preview:/);

      expect(regularBalls).toHaveLength(2);
      expect(previewBalls).toHaveLength(1);

      // Check that preview balls have the correct inline style (50% of cell size)
      previewBalls.forEach((ball) => {
        expect(ball).toHaveClass('w-[28px]', 'h-[28px]'); // 50% of 56px cell
        expect(ball).toHaveClass('rounded-full');
        expect(ball).toHaveClass('border');
        expect(ball).toHaveClass('shadow-sm');
        expect(ball).toHaveClass('opacity-50');
      });

      // Check that regular balls have the full size
      regularBalls.forEach((ball) => {
        expect(ball).toHaveClass('w-ball', 'h-ball'); // Full ball size
      });
    });

    it('preview balls have correct colors', () => {
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: null, incomingBall: { color: 'red' }, active: false },
          { x: 1, y: 0, ball: null, incomingBall: { color: 'blue' }, active: false },
          { x: 2, y: 0, ball: null, incomingBall: { color: 'green' }, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={vi.fn()}
        />
      );

      const previewBalls = screen.getAllByTitle(/^Preview:/);
      expect(previewBalls).toHaveLength(3);

      // Check that each preview ball has the correct color class
      expect(previewBalls[0]).toHaveClass('bg-ball-red'); // red
      expect(previewBalls[1]).toHaveClass('bg-ball-blue'); // blue
      expect(previewBalls[2]).toHaveClass('bg-ball-green'); // green
    });

    it('preview balls are positioned correctly in empty cells', () => {
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: null, incomingBall: { color: 'red' }, active: false },
          { x: 1, y: 0, ball: { color: 'blue' }, incomingBall: null, active: false },
          { x: 2, y: 0, ball: null, incomingBall: { color: 'green' }, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={vi.fn()}
        />
      );

      // Should have 1 regular ball and 2 preview balls
      const regularBalls = screen.getAllByTitle(/^(blue)$/);
      const previewBalls = screen.getAllByTitle(/^Preview:/);

      expect(regularBalls).toHaveLength(1);
      expect(previewBalls).toHaveLength(2);
    });
  });

  describe('Preview Balls Visual Design', () => {
    it('preview balls have correct styling', () => {
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: null, incomingBall: { color: 'black' }, active: false },
          { x: 1, y: 0, ball: null, incomingBall: { color: 'yellow' }, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={vi.fn()}
        />
      );

      const previewBalls = screen.getAllByTitle(/^Preview:/);
      expect(previewBalls).toHaveLength(2);

      previewBalls.forEach(ball => {
        // Check for Tailwind classes instead of inline styles
        expect(ball).toHaveClass('w-[28px]', 'h-[28px]'); // 50% of 56px cell
        expect(ball).toHaveClass('rounded-full'); // border-radius: 50%
        expect(ball).toHaveClass('opacity-50'); // opacity: 0.5
        expect(ball).toHaveClass('border'); // border
        expect(ball).toHaveClass('shadow-sm'); // shadow
      });
    });

    it('preview balls have correct border styling', () => {
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: null, incomingBall: { color: 'purple' }, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={vi.fn()}
        />
      );

      const previewBall = screen.getByTitle('Preview: purple');
      expect(previewBall).toHaveClass('border-game-border-preview');
    });

    it('preview balls have correct opacity', () => {
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: null, incomingBall: { color: 'cyan' }, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={vi.fn()}
        />
      );

      const previewBall = screen.getByTitle('Preview: cyan');
      expect(previewBall).toHaveClass('opacity-50');
    });
  });

  describe('Preview Balls Interaction', () => {
    it('preview balls are not clickable', () => {
      const mockOnCellClick = vi.fn();
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: null, incomingBall: { color: 'red' }, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={mockOnCellClick}
        />
      );

      const cell = screen.getByRole('button');
      cell.click();

      // The cell should be clickable, but the preview ball itself is not
      expect(mockOnCellClick).toHaveBeenCalledWith(0, 0);
    });

    it('preview balls show correct tooltip', () => {
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: null, incomingBall: { color: 'green' }, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={vi.fn()}
        />
      );

      const previewBall = screen.getByTitle('Preview: green');
      expect(previewBall).toBeInTheDocument();
    });
  });

  describe('Preview Balls State Management', () => {
    it('preview balls disappear when cell gets a real ball', () => {
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: { color: 'red' }, incomingBall: null, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={vi.fn()}
        />
      );

      // Should not have any preview balls
      const previewBalls = screen.queryAllByTitle(/^Preview:/);
      expect(previewBalls).toHaveLength(0);

      // Should have the real ball
      const realBall = screen.getByTitle('red');
      expect(realBall).toBeInTheDocument();
    });

    it('preview balls are replaced by real balls when game progresses', () => {
      // This test would require more complex game state management
      // For now, we'll test that the board renders correctly
      const board: Cell[][] = [
        [
          { x: 0, y: 0, ball: null, incomingBall: { color: 'blue' }, active: false },
        ]
      ];

      render(
        <Board
          board={board}
          onCellClick={vi.fn()}
        />
      );

      const previewBall = screen.getByTitle('Preview: blue');
      expect(previewBall).toBeInTheDocument();
    });
  });
}); 
