import React from "react";

interface GuideProps {
  onClose?: () => void;
}

const Guide: React.FC<GuideProps> = ({ onClose }) => {
  return (
    <div className="h-full flex flex-col text-game-text-primary">
      <div className="flex justify-between items-center mb-4">
        <h3 className="game-title text-xl">How to Play</h3>
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
        <div className="space-y-4 text-game-text-secondary text-base">
          <p>
            Welcome to Lines! This is a strategic puzzle game where you need to
            clear colored balls by forming lines of 5 or more matching colors.
          </p>

          <p>
            To play, simply click on a ball to select it, then click on an empty
            cell where you'd like to move it. The game will automatically find
            the best path for your ball to reach its destination.
          </p>

          <p>
            The longer the line you create, the more points you'll earn. Try to
            plan ahead and create multiple lines at once for maximum scoring
            potential.
          </p>

          <p>
            The game ends when the board becomes completely full. Your goal is
            to achieve the highest score possible before that happens!
          </p>
        </div>

        <div className="mt-6 flex gap-6">
          <div className="flex-1">
            <h4 className="game-title mb-3 text-base">Scoring:</h4>
            <table className="w-full text-base">
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

          <div className="flex-1">
            <h4 className="game-title mb-3 text-base">Hotkeys:</h4>
            <div className="space-y-2 text-base text-game-text-secondary">
              <p>
                • <strong>G</strong> - Toggle guide
              </p>
              <p>
                • <strong>N</strong> - New game
              </p>
              <p>
                • <strong>Escape</strong> - Close any overlay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;
