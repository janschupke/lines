import React from 'react';
import styled from 'styled-components';
import type { HighScore } from '../utils/configManager';

interface HighScoreDisplayProps {
  highScores: HighScore[];
  currentScore?: number;
  isNewHighScore?: boolean;
  showTitle?: boolean;
  currentSessionScore?: number;
}

const HighScoreContainer = styled.div`
  background: #2a2e38;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
`;

const HighScoreTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #ffe082;
  font-size: 16px;
  text-align: center;
`;

const HighScoreList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HighScoreItem = styled.div<{ isNew?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${props => props.isNew ? '#4a5568' : '#3a3f4a'};
  border-radius: 6px;
  border-left: 4px solid ${props => props.isNew ? '#ffe082' : '#666'};
  animation: ${props => props.isNew ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const ScoreText = styled.span<{ isNew?: boolean }>`
  font-weight: ${props => props.isNew ? 'bold' : 'normal'};
  color: ${props => props.isNew ? '#ffe082' : '#fff'};
`;

const DateText = styled.span`
  color: #888;
  font-size: 12px;
`;

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
      <HighScoreContainer>
        {showTitle && <HighScoreTitle>High Scores</HighScoreTitle>}
        <div style={{ textAlign: 'center', color: '#888' }}>
          No high scores yet. Start playing to set your first record!
        </div>
      </HighScoreContainer>
    );
  }

  return (
    <HighScoreContainer>
      {showTitle && <HighScoreTitle>High Scores</HighScoreTitle>}
      
      {/* Show current session score if available */}
      {currentSessionScore && currentSessionScore > 0 && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#4a5568', borderRadius: 6, borderLeft: '4px solid #ffe082' }}>
          <div style={{ color: '#ffe082', fontWeight: 'bold', fontSize: '14px' }}>
            Current Session: {currentSessionScore}
          </div>
          <div style={{ color: '#888', fontSize: '12px' }}>
            This score will be saved when you start a new session
          </div>
        </div>
      )}
      
      {highScores.length > 0 && (
        <HighScoreList>
          {highScores.map((score, index) => {
            const isCurrentScore = currentScore === score.score && isNewHighScore;
            return (
              <HighScoreItem key={index} isNew={isCurrentScore}>
                <div>
                  <ScoreText isNew={isCurrentScore}>
                    #{index + 1} - {score.score}
                  </ScoreText>
                  <DateText> - {formatDate(score.date)}</DateText>
                </div>
                {isCurrentScore && (
                  <span style={{ color: '#ffe082', fontSize: '12px' }}>
                    NEW!
                  </span>
                )}
              </HighScoreItem>
            );
          })}
        </HighScoreList>
      )}
    </HighScoreContainer>
  );


};

export default HighScoreDisplay; 
