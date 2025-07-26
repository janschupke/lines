import { MIN_LINE_LENGTH, FIBONACCI_SEQUENCE } from "../config";

/**
 * Calculate line score based on line length
 */
export function calculateLineScore(lineLength: number): number {
  if (lineLength < MIN_LINE_LENGTH) return 0;
  const fibonacciIndex = Math.min(
    lineLength - MIN_LINE_LENGTH,
    FIBONACCI_SEQUENCE.length - 1,
  );
  return FIBONACCI_SEQUENCE[fibonacciIndex];
}
