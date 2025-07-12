import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { HighScoreButton } from './HighScoreButton';

describe('HighScoreButton', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders with correct text and accessibility label', () => {
    render(<HighScoreButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /view high scores \(h\)/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('High Scores (H)');
  });

  it('calls onClick when clicked', () => {
    render(<HighScoreButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when H key is pressed', () => {
    render(<HighScoreButton onClick={mockOnClick} />);
    
    fireEvent.keyDown(document, { key: 'h' });
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when H key is pressed (uppercase)', () => {
    render(<HighScoreButton onClick={mockOnClick} />);
    
    fireEvent.keyDown(document, { key: 'H' });
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when other keys are pressed', () => {
    render(<HighScoreButton onClick={mockOnClick} />);
    
    fireEvent.keyDown(document, { key: 'a' });
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Space' });
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when disabled', () => {
    render(<HighScoreButton onClick={mockOnClick} disabled />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'h' });
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<HighScoreButton onClick={mockOnClick} className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has correct disabled styling when disabled', () => {
    render(<HighScoreButton onClick={mockOnClick} disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toHaveClass('disabled:cursor-not-allowed');
  });

  it('has correct focus styling', () => {
    render(<HighScoreButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none');
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-game-button-accent');
  });
}); 
