import React from 'react';
import type { HighScore } from '../utils/configManager';

interface HighScoreDisplayProps {
  highScores: HighScore[];
  currentScore?: number;
  isNewHighScore?: boolean;
  showTitle?: boolean;
  currentSessionScore?: number;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const HighScoreDisplay: React.FC<HighScoreDisplayProps> = ({
  highScores,
  currentScore,
  isNewHighScore = false,
  showTitle = true,
  currentSessionScore
}) => {
  if (highScores.length === 0 && !currentSessionScore) {
    return (
      <div className="bg-[#2a2e38] border border-[#444] rounded-lg p-4 my-2 shadow-lg">
        {showTitle && <h3 className="m-0 mb-3 text-[#ffe082] text-base text-center font-semibold">High Scores</h3>}
        <div className="text-center text-[#ccc]">
          No high scores yet. Start playing to set your first record!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2e38] border border-[#444] rounded-lg p-4 my-2 shadow-lg">
      {showTitle && <h3 className="m-0 mb-3 text-[#ffe082] text-base text-center font-semibold">High Scores</h3>}
      {/* Show current session score if available */}
      {currentSessionScore && currentSessionScore > 0 && (
        <div className="mb-3 p-3 bg-[#4a5568] rounded-md border-l-4 border-[#ffe082] shadow-sm">
          <div className="text-[#ffe082] font-bold text-sm">
            Current Session: {currentSessionScore}
          </div>
          <div className="text-[#ccc] text-xs mt-1">
            This score will be saved when you start a new session
          </div>
        </div>
      )}
      {highScores.length > 0 && (
        <div className="flex flex-col gap-2">
          {highScores.map((score, index) => {
            const isCurrentScore = currentScore === score.score && isNewHighScore;
            return (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-md border-l-4 shadow-sm ${
                  isCurrentScore 
                    ? 'bg-[#4a5568] border-[#ffe082] animate-pulse' 
                    : 'bg-[#3a3f4a] border-[#666]'
                }`}
              >
                <div>
                  <span className={isCurrentScore ? 'font-bold text-[#ffe082]' : 'text-white'}>
                    #{index + 1} - {score.score}
                  </span>
                  <span className="text-[#ccc] text-xs ml-2"> - {formatDate(score.date)}</span>
                </div>
                {isCurrentScore && (
                  <span className="text-[#ffe082] text-xs font-bold">NEW!</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HighScoreDisplay; 
