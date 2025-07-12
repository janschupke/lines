import React from 'react';

interface GameEndDialogProps {
  isOpen: boolean;
  score: number;
  isNewHighScore: boolean;
  onNewGame: () => void;
  onClose: () => void;
}

const GameEndDialog: React.FC<GameEndDialogProps> = ({
  isOpen,
  score,
  isNewHighScore,
  onNewGame,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1000]">
      <div className="bg-[#23272f] border-2 border-[#444] rounded-xl p-6 max-w-md w-11/12 text-center shadow-2xl">
        <h2 className={`m-0 mb-4 text-2xl font-bold ${isNewHighScore ? "text-[#ffe082]" : "text-white"}`}>
          {isNewHighScore ? '🎉 New High Score! 🎉' : 'Game Over'}
        </h2>
        <div className="text-3xl font-bold text-[#ffe082] my-4">Score: {score}</div>
        {isNewHighScore && (
          <div className="bg-gradient-to-r from-[#ffe082] to-[#ffb300] text-black py-2 px-4 rounded-full font-bold my-4 animate-bounce shadow-lg">
            🏆 NEW RECORD! 🏆
          </div>
        )}
        <p className="text-[#ccc] my-4 text-base">
          {isNewHighScore 
            ? 'Congratulations! You\'ve set a new personal best!'
            : 'Great game! Try again to beat your high score.'
          }
        </p>
        <div className="flex gap-3 justify-center mt-5">
          <button 
            className="py-2 px-5 rounded-md font-semibold cursor-pointer bg-[#ffe082] text-black hover:bg-[#ffb300] transition-colors shadow-md" 
            onClick={onNewGame}
          >
            New Game
          </button>
          <button 
            className="py-2 px-5 rounded-md font-semibold cursor-pointer bg-[#444] text-white hover:bg-[#555] transition-colors shadow-md" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameEndDialog; 
