import { MIN_LINE_LENGTH, SCORING_TABLE } from "../config";

/**
 * Calculate line score based on line length
 */
export function calculateLineScore(lineLength: number): number {
  if (lineLength < MIN_LINE_LENGTH) return 0;
  
  // If the line length is in the scoring table, use it
  if (lineLength in SCORING_TABLE) {
    return SCORING_TABLE[lineLength];
  }
  
  // For line lengths beyond the table, return the maximum available score
  const maxScore = Math.max(...Object.values(SCORING_TABLE));
  return maxScore;
}
