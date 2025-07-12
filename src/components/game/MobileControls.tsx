import React from "react";
import { useMobileOptimization } from "../../hooks/useMobileOptimization";

interface MobileControlsProps {
  onNewGame: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
  showGuide: boolean;
  onToggleGuide: () => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({
  onNewGame,
  onPause,
  onResume,
  isPaused = false,
  showGuide,
  onToggleGuide,
}) => {
  const { isMobile } = useMobileOptimization();

  if (!isMobile) {
    return null; // Only show on mobile
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
      <div className="flex justify-center space-x-3">
        <button
          onClick={onNewGame}
          className="
            bg-game-button-primary text-game-text-primary
            px-4 py-3 rounded-lg
            text-base font-semibold
            touch-manipulation
            active:bg-game-button-hover
            focus:outline-none focus:ring-2 focus:ring-game-border-accent
            shadow-lg
            min-h-[44px] min-w-[44px]
          "
        >
          New Game
        </button>

        {onPause && onResume && (
          <button
            onClick={isPaused ? onResume : onPause}
            className="
              bg-game-button-accent text-black
              px-4 py-3 rounded-lg
              text-base font-semibold
              touch-manipulation
              active:bg-game-button-accent-hover
              focus:outline-none focus:ring-2 focus:ring-game-border-accent
              shadow-lg
              min-h-[44px] min-w-[44px]
            "
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        )}

        <button
          onClick={onToggleGuide}
          className={`
            px-4 py-3 rounded-lg
            text-base font-semibold
            touch-manipulation
            focus:outline-none focus:ring-2 focus:ring-game-border-accent
            shadow-lg
            min-h-[44px] min-w-[44px]
            ${
              showGuide
                ? "bg-game-button-accent text-black active:bg-game-button-accent-hover"
                : "bg-game-button-primary text-game-text-primary active:bg-game-button-hover"
            }
          `}
        >
          {showGuide ? "Hide" : "Help"}
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
