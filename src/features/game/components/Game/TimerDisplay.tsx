import React from "react";
import { formatTime } from "@shared/utils";

interface TimerDisplayProps {
  timer: number;
  timerActive: boolean;
}

/**
 * Timer Display Component
 * Shows game timer with active/inactive state styling
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timer,
  timerActive,
}) => {
  return (
    <div
      className={`font-bold text-2xl ${
        timerActive
          ? "text-game-text-success"
          : "text-game-text-secondary"
      }`}
    >
      {formatTime(timer)}
    </div>
  );
};

export default React.memo(TimerDisplay);
