import React from "react";

interface HighScoreButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const HighScoreButton: React.FC<HighScoreButtonProps> = ({
  onClick,
  disabled = false,
  className = "",
}) => {
  // Store the latest onClick in a ref to avoid useEffect dependency
  const onClickRef = React.useRef(onClick);

  // Update the ref when onClick changes
  React.useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "h" || e.key === "H") {
      e.preventDefault();
      if (!disabled) {
        onClick();
      }
    }
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check if the target is an input or textarea element
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return; // Don't trigger the shortcut when typing in input fields
      }

      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        if (!disabled) {
          onClickRef.current();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [disabled]); // Only depend on disabled, not onClick

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
