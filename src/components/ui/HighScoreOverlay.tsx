import React, { useEffect, useRef } from "react";
import type { HighScore } from "../../services/HighScoreService";

interface HighScoreOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  highScores: HighScore[];
  className?: string;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatDate = (date: Date | undefined): string => {
  if (!date || isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const HighScoreOverlay: React.FC<HighScoreOverlayProps> = ({
  isOpen,
  onClose,
  highScores,
  className = "",
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      overlayRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 bg-game-bg-board/80 backdrop-blur-sm 
        flex items-center justify-center z-50 ${className}`}
      role="dialog"
      aria-labelledby="high-scores-title"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="bg-game-bg-tertiary border border-game-border-default p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2
            id="high-scores-title"
            className="text-2xl font-bold text-game-text-accent"
          >
            High Scores
          </h2>
          <button
            onClick={onClose}
            className="text-game-text-secondary hover:text-game-text-accent transition-colors p-2"
            aria-label="Close high scores"
          >
            ✕
          </button>
        </div>

        {highScores.length === 0 ? (
          <div className="text-center text-game-text-secondary py-8">
            <p className="text-lg mb-2">No high scores yet!</p>
            <p className="text-sm">Start playing to set your first record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-game-border-default">
                  <th className="text-left py-2 text-game-text-accent font-semibold">
                    Rank
                  </th>
                  <th className="text-left py-2 text-game-text-accent font-semibold">
                    Player
                  </th>
                  <th className="text-left py-2 text-game-text-accent font-semibold">
                    Score
                  </th>
                  <th className="text-left py-2 text-game-text-accent font-semibold">
                    Date
                  </th>
                  <th className="text-left py-2 text-game-text-accent font-semibold">
                    Time
                  </th>
                  <th className="text-left py-2 text-game-text-accent font-semibold">
                    Stats
                  </th>
                </tr>
              </thead>
              <tbody>
                {highScores.map((score, index) => (
                  <tr
                    key={index}
                    className="border-b border-game-border-default/50 hover:bg-game-bg-secondary/50"
                  >
                    <td className="py-3 text-game-text-primary font-medium">
                      #{index + 1}
                    </td>
                    <td className="py-3 text-game-text-primary">
                      {score.playerName || "Anonymous"}
                    </td>
                    <td className="py-3 text-game-text-accent font-bold">
                      {score.score.toLocaleString()}
                    </td>
                    <td className="py-3 text-game-text-secondary">
                      {formatDate(score.achievedAt)}
                    </td>
                    <td className="py-3 text-game-text-secondary">
                      {score.gameDuration
                        ? formatDuration(score.gameDuration)
                        : "N/A"}
                    </td>
                    <td className="py-3 text-game-text-secondary text-xs">
                      {score.turnsCount ? `${score.turnsCount} turns` : ""}
                      {score.linesPopped ? `, ${score.linesPopped} lines` : ""}
                      {score.longestLinePopped
                        ? `, longest: ${score.longestLinePopped}`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
