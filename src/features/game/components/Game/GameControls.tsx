import React from "react";
import Link from "next/link";

interface GameControlsProps {
  onNewGame: () => void;
  onToggleGuide: () => void;
  showGuide: boolean;
}

/**
 * Game Controls Component
 * Contains new game and guide toggle buttons
 */
const GameControls: React.FC<GameControlsProps> = ({
  onNewGame,
  onToggleGuide,
  showGuide,
}) => {
  return (
    <div className="flex gap-2 flex-1">
      <button
        onClick={onNewGame}
        className="game-button game-button-primary p-3 rounded-lg transition-colors"
        data-testid="new-game-button"
        title="New Game"
        aria-label="New game"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      <button
        onClick={onToggleGuide}
        className={`game-button p-3 rounded-lg transition-colors ${
          showGuide ? "game-button-accent" : "game-button-primary"
        }`}
        title="Game Guide"
        aria-label="Game guide"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <Link
        href="/leaderboard"
        className="game-button game-button-primary p-3 rounded-lg transition-colors inline-flex"
        title="Leaderboard"
        aria-label="Leaderboard"
        data-testid="leaderboard-link"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 21h8m-4-4v4m-6-8a6 6 0 0012 0V5H6v8zM6 5H4v2a3 3 0 003 3m11-5h2v2a3 3 0 01-3 3"
          />
        </svg>
      </Link>
    </div>
  );
};

export default React.memo(GameControls);
