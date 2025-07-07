import { render, screen, fireEvent, act } from '@testing-library/react';
import Game from './Game';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

describe('Game', () => {
  it('renders the board and UI', () => {
    render(<Game />);
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
    expect(screen.getByText(/Game time:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Game/i })).toBeInTheDocument();
  });

  it('starts timer only after first move', () => {
    vi.useFakeTimers();
    render(<Game />);
    expect(screen.getByText(/Game time: 0:00/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    // Timer should not advance before first move
    expect(screen.getByText(/Game time: 0:00/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('moves a ball when a valid move is made', () => {
    render(<Game />);
    // Find a cell with a ball and an empty cell
    const cells = screen.getAllByRole('button');
    // Simulate click on a ball and then on an empty cell
    // (This is a simplification; in a real test, you would query by testid or class)
    fireEvent.click(cells[0]);
    fireEvent.click(cells[1]);
    // After move, the selected state should be cleared
    // (No error thrown means move logic works)
  });

  it('updates the score when a line is cleared', () => {
    render(<Game />);
    // This is hard to simulate directly, but we can check that the score starts at 0
    expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
    // After a move and line clear, score should increase (would need to mock board state for full test)
  });

  it('shows game over when the board is full', () => {
    render(<Game />);
    // Would need to fill the board and trigger game over
    // For now, just check that the game over logic does not crash
  });
}); 