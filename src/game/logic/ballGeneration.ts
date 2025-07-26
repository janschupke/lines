import { BALL_COLORS } from "../config";
import type { BallColor } from "../types";

/**
 * Get a random ball color from the available colors
 */
export function getRandomBallColor(): BallColor {
  return BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
}

/**
 * Get multiple random ball colors
 */
export function getRandomNextBalls(count: number): BallColor[] {
  return Array.from({ length: count }, () => getRandomBallColor());
}
