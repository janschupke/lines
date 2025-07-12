import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HighScoreDisplay from '../ui/HighScoreDisplay';
import type { HighScore } from '../../utils/configManager';

describe('HighScoreDisplay', () => {
  const mockHighScores: HighScore[] = [
    { score: 100, date: new Date('2024-01-01') },
    { score: 80, date: new Date('2024-01-02') },
    { score: 60, date: new Date('2024-01-03') },
  ];

  it('renders high scores correctly', () => {
    render(<HighScoreDisplay highScores={mockHighScores} />);
    
    expect(screen.getByText('#1 - 100')).toBeInTheDocument();
    expect(screen.getByText('#2 - 80')).toBeInTheDocument();
    expect(screen.getByText('#3 - 60')).toBeInTheDocument();
  });

  it('shows new high score indicator', () => {
    render(
      <HighScoreDisplay 
        highScores={mockHighScores} 
        currentScore={100}
        isNewHighScore={true}
      />
    );
    
    expect(screen.getByText('NEW!')).toBeInTheDocument();
  });

  it('shows empty state when no high scores', () => {
    render(<HighScoreDisplay highScores={[]} />);
    
    expect(screen.getByText(/No high scores yet/)).toBeInTheDocument();
  });

  it('hides title when showTitle is false', () => {
    render(<HighScoreDisplay highScores={mockHighScores} showTitle={false} />);
    
    expect(screen.queryByText('High Scores')).not.toBeInTheDocument();
  });
}); 
