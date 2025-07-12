import React from 'react';

interface HighScoreButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const HighScoreButton: React.FC<HighScoreButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      if (!disabled) {
        onClick();
      }
    }
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        if (!disabled) {
          onClick();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [onClick, disabled]);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      className={`bg-game-button-primary hover:bg-game-button-hover text-game-text-primary 
        font-semibold rounded-lg border border-game-border-default cursor-pointer 
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed 
        focus:outline-none focus:ring-2 focus:ring-game-button-accent focus:ring-offset-2 
        ${className}`}
      aria-label="View high scores (H)"
    >
      High Scores (H)
    </button>
  );
}; 
