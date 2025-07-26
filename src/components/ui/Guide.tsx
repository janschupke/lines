import React from "react";

interface GuideProps {
  onClose?: () => void;
}

const Guide: React.FC<GuideProps> = ({ onClose }) => {
  return (
    <div className="h-full flex flex-col text-game-text-primary">
      <div className="flex justify-between items-center mb-4">
        <h3 className="game-title text-xl">
          How to Play
        </h3>
        {onClose && (
          <button
            className="text-game-text-primary text-2xl font-bold hover:scale-110 transition-transform cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="space-y-3 text-game-text-secondary text-sm">
          <p>• Click on a ball to select it</p>
          <p>• Click on an empty cell to move the ball</p>
          <p>• Form lines of 5+ balls to clear them</p>
          <p>
            •{" "}
            <strong>Only your moves trigger line removal and scoring</strong>
          </p>
          <p>• Automatic ball placement won't clear lines</p>
          <p>• Longer lines = more points!</p>
          <p>• Game ends when board is full</p>
        </div>
        
        <div className="mt-6">
          <h4 className="game-title mb-3 text-base">
            Scoring:
          </h4>
          <table className="w-full text-sm">
            <tbody>
              <tr className="text-game-text-accent">
                <td>5 balls:</td>
                <td>5 points</td>
              </tr>
              <tr className="text-game-text-secondary">
                <td>6 balls:</td>
                <td>8 points</td>
              </tr>
              <tr className="text-game-text-secondary">
                <td>7 balls:</td>
                <td>13 points</td>
              </tr>
              <tr className="text-game-text-secondary">
                <td>8 balls:</td>
                <td>21 points</td>
              </tr>
              <tr className="text-game-text-secondary">
                <td>9 balls:</td>
                <td>34 points</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h4 className="game-title mb-3 text-base">
            Hotkeys:
          </h4>
          <div className="space-y-2 text-sm text-game-text-secondary">
            <p>• <strong>G</strong> - Toggle guide</p>
            <p>• <strong>N</strong> - New game</p>
            <p>• <strong>Escape</strong> - Close any overlay</p>
          </div>
        </div>

        <div className="mt-6 text-game-text-accent font-semibold text-center text-base">
          Good luck!
        </div>
      </div>
    </div>
  );
};

export default Guide; 
