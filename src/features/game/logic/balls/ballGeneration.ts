import { BallColor } from "../../config";

/**
 * Get a random ball color from the available colors
 */
function getRandomBallColor(): BallColor {
  const colors = Object.values(BallColor);
  return colors[Math.floor(Math.random() * colors.length)] as BallColor;
}

/**
 * Get multiple random ball colors
 */
export function getRandomNextBalls(count: number): BallColor[] {
  return Array.from({ length: count }, () => getRandomBallColor());
}
