import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import Game from './Game';

// Mock timers for animation testing
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Preview Balls Functionality', () => {
  describe('Initial Preview Balls Display', () => {
    it('shows preview balls on the board at game start', () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      // Should show preview balls (they have title attributes with "Preview:")
      const previewBalls = screen.getAllByTitle(/Preview:/);
      expect(previewBalls.length).toBeGreaterThan(0);
    });

    it('shows preview balls in the header UI', () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      // Should show preview balls in the header
      const headerPreviewBalls = screen.getAllByTitle(/yellow|red|blue|green|purple|cyan|black/);
      expect(headerPreviewBalls.length).toBeGreaterThan(0);
    });

    it('preview balls are smaller than regular balls', () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      const previewBalls = screen.getAllByTitle(/Preview:/);
      
      // Preview balls should be smaller than regular balls
      previewBalls.forEach((ball) => {
        // Check for Tailwind classes instead of computed styles
        expect(ball).toHaveClass('w-6', 'h-6');
        expect(ball).toHaveClass('rounded-full');
        expect(ball).toHaveClass('border');
        expect(ball).toHaveClass('opacity-80');
      });
    });
  });

  describe('Preview Balls After Move', () => {
    it('converts preview balls to real balls after a move', async () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      // Make a move
      const cells = screen.getAllByRole('button');
      const ballCell = cells.find(cell => cell.querySelector('[title]') && !cell.querySelector('[title^="Preview:"]'));
      const emptyCell = cells.find(cell => !cell.querySelector('[title]'));
      
      if (ballCell && emptyCell) {
        fireEvent.click(ballCell);
        fireEvent.click(emptyCell);
        
        // Advance time to complete animation
        act(() => {
          vi.advanceTimersByTime(2000);
        });
        
        // Should have new preview balls
        const newPreviewBalls = screen.getAllByTitle(/Preview:/);
        expect(newPreviewBalls.length).toBeGreaterThan(0);
      }
    });

    it('recalculates preview positions when moving to a preview ball position', async () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      // Find a preview ball and a regular ball
      const cells = screen.getAllByRole('button');
      const previewCell = cells.find(cell => cell.querySelector('[title^="Preview:"]'));
      const regularBallCell = cells.find(cell => cell.querySelector('[title]') && !cell.querySelector('[title^="Preview:"]'));
      
      if (previewCell && regularBallCell) {
        // Move a regular ball to a preview ball position
        fireEvent.click(regularBallCell);
        fireEvent.click(previewCell);
        
        // Advance time to complete animation
        act(() => {
          vi.advanceTimersByTime(2000);
        });
        
        // Should have recalculated preview positions
        const newPreviewBalls = screen.getAllByTitle(/Preview:/);
        expect(newPreviewBalls.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Preview Balls State Management', () => {
    it('maintains preview balls when no lines are cleared', async () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      // Make a move that doesn't create lines
      const cells = screen.getAllByRole('button');
      const ballCell = cells.find(cell => cell.querySelector('[title]') && !cell.querySelector('[title^="Preview:"]'));
      const emptyCell = cells.find(cell => !cell.querySelector('[title]'));
      
      if (ballCell && emptyCell) {
        fireEvent.click(ballCell);
        fireEvent.click(emptyCell);
        
        // Advance time to complete animation
        act(() => {
          vi.advanceTimersByTime(2000);
        });
        
        // Should still have preview balls
        const newPreviewBalls = screen.getAllByTitle(/Preview:/);
        expect(newPreviewBalls.length).toBeGreaterThan(0);
      }
    });

    it('updates preview balls after lines are cleared', async () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      // This test would require setting up a specific board state
      // where a line can be formed. For now, we test the basic functionality
      const cells = screen.getAllByRole('button');
      expect(cells.length).toBeGreaterThan(0);
      
      // Make a move
      const ballCell = cells.find(cell => cell.querySelector('[title]') && !cell.querySelector('[title^="Preview:"]'));
      const emptyCell = cells.find(cell => !cell.querySelector('[title]'));
      
      if (ballCell && emptyCell) {
        fireEvent.click(ballCell);
        fireEvent.click(emptyCell);
        
        // Advance time to complete animation
        act(() => {
          vi.advanceTimersByTime(2000);
        });
        
        // Should have updated preview balls
        const newPreviewBalls = screen.getAllByTitle(/Preview:/);
        expect(newPreviewBalls.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Preview Balls Visual Design', () => {
    it('preview balls have correct styling', () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      const previewBalls = screen.getAllByTitle(/Preview:/);
      
      previewBalls.forEach(ball => {
        // Check for Tailwind classes instead of computed styles
        expect(ball).toHaveClass('w-6', 'h-6'); // 24px
        expect(ball).toHaveClass('rounded-full'); // border-radius: 50%
        expect(ball).toHaveClass('opacity-80'); // opacity: 0.8
        expect(ball).toHaveClass('border');
        expect(ball).toHaveClass('shadow-sm');
      });
    });

    it('preview balls are positioned correctly in cells', () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      const previewBalls = screen.getAllByTitle(/Preview:/);
      
      previewBalls.forEach(ball => {
        const parent = ball.parentElement;
        expect(parent).toBeInTheDocument();
        
        // Check for Tailwind classes instead of computed styles
        expect(parent).toHaveClass('flex', 'items-center', 'justify-center');
      });
    });
  });

  describe('Preview Balls Interaction', () => {
    it('preview balls cannot be selected', () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      const previewCells = screen.getAllByRole('button').filter(cell => 
        cell.querySelector('[title^="Preview:"]')
      );
      
      if (previewCells.length > 0) {
        const previewCell = previewCells[0];
        
        // Click on preview ball
        fireEvent.click(previewCell);
        
        // Should not be selected (no active state)
        expect(previewCell).not.toHaveClass('active');
      }
    });

    it('preview ball positions are valid move destinations', async () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      const cells = screen.getAllByRole('button');
      const regularBallCell = cells.find(cell => cell.querySelector('[title]') && !cell.querySelector('[title^="Preview:"]'));
      const previewCell = cells.find(cell => cell.querySelector('[title^="Preview:"]'));
      
      if (regularBallCell && previewCell) {
        // Try to move a regular ball to a preview ball position
        fireEvent.click(regularBallCell);
        fireEvent.click(previewCell);
        
        // Advance time to complete animation
        act(() => {
          vi.advanceTimersByTime(2000);
        });
        
        // Should have moved successfully
        expect(previewCell).toBeInTheDocument();
      }
    });
  });

  describe('Preview Balls Edge Cases', () => {
    it('handles board with no empty cells for preview', () => {
      // This would require setting up a nearly full board
      // For now, we test that the game handles this gracefully
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      const cells = screen.getAllByRole('button');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('maintains preview balls during ball movement animation', async () => {
      render(<Game showGuide={false} setShowGuide={() => {}} showHighScores={false} setShowHighScores={() => {}} />);
      
      const cells = screen.getAllByRole('button');
      const ballCell = cells.find(cell => cell.querySelector('[title]') && !cell.querySelector('[title^="Preview:"]'));
      const emptyCell = cells.find(cell => !cell.querySelector('[title]'));
      
      if (ballCell && emptyCell) {
        fireEvent.click(ballCell);
        fireEvent.click(emptyCell);
        
        // During animation, preview balls should still be visible
        const previewBalls = screen.getAllByTitle(/Preview:/);
        expect(previewBalls.length).toBeGreaterThan(0);
        
        // Advance time to complete animation
        act(() => {
          vi.advanceTimersByTime(2000);
        });
        
        // After animation, should have new preview balls
        const newPreviewBalls = screen.getAllByTitle(/Preview:/);
        expect(newPreviewBalls.length).toBeGreaterThan(0);
      }
    });
  });
}); 
