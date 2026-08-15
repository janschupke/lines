import React from "react";
import type { ColorName } from "@/engine";
import { getBallColor } from "@/shared/utils";

interface NextBallsPreviewProps {
  preview: readonly ColorName[];
}

/**
 * Next Balls Preview Component
 * Displays the upcoming balls, derived from the ghosts on the board.
 */
const NextBallsPreview: React.FC<NextBallsPreviewProps> = ({ preview }) => {
  return (
    <div className="flex gap-1">
      {preview.map((color, index) => (
        <div
          key={index}
          className="w-7 h-7 rounded-full border-2 border-game-border-muted"
          style={{ backgroundColor: getBallColor(color) }}
        />
      ))}
    </div>
  );
};

export default React.memo(NextBallsPreview);
