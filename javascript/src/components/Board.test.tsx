import { render, screen, fireEvent } from '@testing-library/react';
import Board from './Board';
import type { BallColor } from './Game';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

describe('Board', () => {
  const board = Array.from({ length: 3 }, (_, y) =>
    Array.from({ length: 3 }, (_, x) => ({
      x,
      y,
      ball: x === 0 && y === 0 ? { color: 'red' as BallColor } : null,
      active: false,
    }))
  );

  it('renders the board and balls', () => {
    render(<Board board={board} onCellClick={() => {}} />);
    expect(screen.getAllByRole('button').length).toBe(9);
    expect(screen.getByTitle('red')).toBeInTheDocument();
  });

  it('calls onCellClick when a cell is clicked', () => {
    const onCellClick = vi.fn();
    render(<Board board={board} onCellClick={onCellClick} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onCellClick).toHaveBeenCalled();
  });

  it('hides the ball in the source cell when movingBall is set', () => {
    render(
      <Board
        board={board}
        onCellClick={() => {}}
        movingBall={{ color: 'red' as BallColor, path: [[0, 0], [1, 1]] }}
      />
    );
    expect(screen.queryByTitle('red')).not.toBeInTheDocument();
  });
}); 