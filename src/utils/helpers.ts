// Utility function to get CSS custom properties
export const getCSSVariable = (variableName: string): number => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${variableName}`)
    .trim();

  // Convert px to number
  return parseInt(value, 10);
};

// Get game spacing values from CSS custom properties
export const getGameSpacing = () => ({
  cellSize: getCSSVariable("cell-size"),
  gapSize: getCSSVariable("gap-size"),
  ballSize: getCSSVariable("ball-size"),
  boardPadding: getCSSVariable("board-padding"),
});

// Helper function to get ball color
export const getBallColor = (color: string): string => {
  const colors: Record<string, string> = {
    red: '#ef4444',
    green: '#10b981',
    blue: '#3b82f6',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    black: '#1f2937'
  };
  return colors[color] || '#ef4444';
};
