import React from 'react';
import styled from 'styled-components';

interface GameEndDialogProps {
  isOpen: boolean;
  score: number;
  isNewHighScore: boolean;
  onNewGame: () => void;
  onClose: () => void;
}

const DialogOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background: #23272f;
  border: 2px solid #444;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2<{ isNewHighScore: boolean }>`
  color: ${props => props.isNewHighScore ? '#ffe082' : '#fff'};
  margin: 0 0 16px 0;
  font-size: 24px;
`;

const ScoreDisplay = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #ffe082;
  margin: 16px 0;
`;

const NewHighScoreBadge = styled.div`
  background: linear-gradient(45deg, #ffe082, #ffb300);
  color: #000;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  margin: 16px 0;
  animation: bounce 1s infinite;

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.primary ? '#ffe082' : '#444'};
  color: ${props => props.primary ? '#000' : '#fff'};
  
  &:hover {
    background: ${props => props.primary ? '#ffb300' : '#555'};
  }
`;

const GameEndDialog: React.FC<GameEndDialogProps> = ({
  isOpen,
  score,
  isNewHighScore,
  onNewGame,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <DialogOverlay isOpen={isOpen}>
      <DialogContent>
        <Title isNewHighScore={isNewHighScore}>
          {isNewHighScore ? '🎉 New High Score! 🎉' : 'Game Over'}
        </Title>
        
        <ScoreDisplay>Score: {score}</ScoreDisplay>
        
        {isNewHighScore && (
          <NewHighScoreBadge>
            🏆 NEW RECORD! 🏆
          </NewHighScoreBadge>
        )}
        
        <p style={{ color: '#ccc', margin: '16px 0' }}>
          {isNewHighScore 
            ? 'Congratulations! You\'ve set a new personal best!'
            : 'Great game! Try again to beat your high score.'
          }
        </p>
        
        <ButtonContainer>
          <Button primary onClick={onNewGame}>
            New Game
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </ButtonContainer>
      </DialogContent>
    </DialogOverlay>
  );
};

export default GameEndDialog; 
