const FIBONACCI_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];

export const calculateLineScore = (lineLength: number): number => {
  if (lineLength < 5) return 0;
  const fibonacciIndex = Math.min(lineLength - 5, FIBONACCI_SEQUENCE.length - 1);
  return FIBONACCI_SEQUENCE[fibonacciIndex] * 100;
};

export const calculateBonusScore = (
  consecutiveHighScores: number,
  averageScorePerTurn: number,
  strategicBonus: number
): number => {
  let bonus = 0;
  if (consecutiveHighScores >= 3) {
    bonus += consecutiveHighScores * 50;
  }
  if (averageScorePerTurn > 100) {
    bonus += Math.floor(averageScorePerTurn * 0.2);
  }
  bonus += strategicBonus;
  return bonus;
}; 
