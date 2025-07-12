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
  cellSize: getCSSVariable('cell-size'),
  gapSize: getCSSVariable('gap-size'),
  ballSize: getCSSVariable('ball-size'),
  boardPadding: getCSSVariable('board-padding'),
}); 
