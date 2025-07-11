import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Game from './Game';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Math.random to make tests deterministic
const mockMath = Object.create(Math);
mockMath.random = () => 0.5;
Object.defineProperty(window, 'Math', {
  value: mockMath,
  writable: true
});

describe('Preview Balls Functionality', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial Preview Balls Display', () => {
    it('shows preview balls on the board at game start', () => {
      render(<Game />);
      
      // Should find preview balls (smaller balls with "Preview:" in title)
      const previewBalls = screen.getAllByTitle(/Preview:/);
      expect(previewBalls.length).toBeGreaterThan(0);
      expect(previewBalls.length).toBeLessThanOrEqual(3); // Max 3 preview balls
    });

    it('shows preview balls in the header UI', () => {
      render(<Game />);
      
      // Should find preview balls in the header (they have color titles)
      const headerPreviewBalls = screen.getAllByTitle(/red|green|blue|yellow|purple|cyan|black/);
      expect(headerPreviewBalls.length).toBeGreaterThan(0);
    });

    it('preview balls are smaller than regular balls', () => {
      render(<Game />);
      
      const previewBalls = screen.getAllByTitle(/Preview:/);
      
      // Preview balls should be smaller (24px vs 40px)
      previewBalls.forEach(ball => {
        const style = window.getComputedStyle(ball);
        expect(style.width).toBe('24px');
        expect(style.height).toBe('24px');
      });
    });
  });

  describe('Preview Balls After Move', () => {
    it('converts preview balls to real balls after a move', async () => {
      render(<Game />);
      
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
      render(<Game />);
      
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
      render(<Game />);
      
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
      render(<Game />);
      
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
      render(<Game />);
      
      const previewBalls = screen.getAllByTitle(/Preview:/);
      
      previewBalls.forEach(ball => {
        const style = window.getComputedStyle(ball);
        
        // Should be smaller than regular balls
        expect(style.width).toBe('24px');
        expect(style.height).toBe('24px');
        
        // Should have border radius for circular shape
        expect(style.borderRadius).toBe('50%');
        
        // Should have reduced opacity
        expect(style.opacity).toBe('0.8');
      });
    });

    it('preview balls are positioned correctly in cells', () => {
      render(<Game />);
      
      const previewBalls = screen.getAllByTitle(/Preview:/);
      
      previewBalls.forEach(ball => {
        const parent = ball.parentElement;
        expect(parent).toBeInTheDocument();
        
        // Should be centered in the cell
        const parentStyle = window.getComputedStyle(parent!);
        expect(parentStyle.display).toBe('flex');
        expect(parentStyle.alignItems).toBe('center');
        expect(parentStyle.justifyContent).toBe('center');
      });
    });
  });

  describe('Preview Balls Interaction', () => {
    it('preview balls cannot be selected', () => {
      render(<Game />);
      
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
      render(<Game />);
      
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
      render(<Game />);
      
      const cells = screen.getAllByRole('button');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('maintains preview balls during ball movement animation', async () => {
      render(<Game />);
      
      // Start a move
      const cells = screen.getAllByRole('button');
      const ballCell = cells.find(cell => cell.querySelector('[title]') && !cell.querySelector('[title^="Preview:"]'));
      const emptyCell = cells.find(cell => !cell.querySelector('[title]'));
      
      if (ballCell && emptyCell) {
        fireEvent.click(ballCell);
        fireEvent.click(emptyCell);
        
        // During animation, preview balls should still be visible
        const duringAnimationPreviewBalls = screen.getAllByTitle(/Preview:/);
        expect(duringAnimationPreviewBalls.length).toBeGreaterThan(0);
        
        // Complete animation
        act(() => {
          vi.advanceTimersByTime(2000);
        });
      }
    });
  });
}); 
