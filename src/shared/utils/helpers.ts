// Utility function to get CSS custom properties
const getCSSVariable = (variableName: string): number => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${variableName}`)
    .trim();

  // Convert px to number
  return parseInt(value, 10);
};

// Get game spacing values from CSS custom properties
const getGameSpacing = () => ({
  cellSize: getCSSVariable("cell-size"),
  gapSize: getCSSVariable("gap-size"),
  ballSize: getCSSVariable("ball-size"),
  boardPadding: getCSSVariable("board-padding"),
});

// Unified game sizing system
export const getGameSizing = () => {
  const { cellSize, gapSize, ballSize, boardPadding } = getGameSpacing();

  // Ball border is 2px on each side = 4px total
  const ballBorder = 4;
  const actualBallSize = ballSize + ballBorder;

  // Calculate ball offset to center it in cell
  const ballOffset = (cellSize - actualBallSize) / 2;

  return {
    // Base dimensions
    cellSize,
    gapSize,
    ballSize,
    boardPadding,
    ballBorder,
    actualBallSize,
    ballOffset,

    // Positioning helpers
    getCellPosition: (x: number, y: number) => {
      // The moving ball is positioned relative to the Board component
      // The Board has p-board-padding, but the ball is positioned relative to the content area
      // So we don't include boardPadding in the calculation
      const left = x * (cellSize + gapSize) + ballOffset;
      const top = y * (cellSize + gapSize) + ballOffset;

      return { left, top };
    },

    // Size classes
    cellSizeClass: "w-cell h-cell",
    ballSizeClass: "w-ball h-ball",
    incomingBallSizeClass: "w-incoming-ball h-incoming-ball",
  };
};

import { BallColor } from "@features/game/config";

// Helper function to get ball color
export const getBallColor = (color: BallColor | string): string => {
  const colors: Record<string, string> = {
    [BallColor.Red]: "#ef4444",
    [BallColor.Green]: "#10b981",
    [BallColor.Blue]: "#3b82f6",
    [BallColor.Yellow]: "#f59e0b",
    [BallColor.Purple]: "#8b5cf6",
    [BallColor.Pink]: "#f472b6",
    [BallColor.Black]: "#1f2937",
  };
  return colors[color] || "#ef4444";
};
