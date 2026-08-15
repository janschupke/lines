import React from "react";
import { formatTime } from "@/shared/utils";

interface TimerDisplayProps {
  elapsedMs: number;
  timerActive: boolean;
}

/**
 * Timer Display Component
 * Shows game timer with active/inactive state styling
 */
const TimerDisplay: React.FC<TimerDisplayProps> = ({
  elapsedMs,
  timerActive,
}) => {
  return (
    <div
      className={`font-bold text-2xl ${
        timerActive ? "text-game-text-success" : "text-game-text-secondary"
      }`}
    >
      {formatTime((elapsedMs / 1000) | 0)}
    </div>
  );
};

export default React.memo(TimerDisplay);
