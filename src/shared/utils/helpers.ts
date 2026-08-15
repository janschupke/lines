import { BALL_COLORS } from "@/design/tokens";

// Helper function to get ball color — colours live in the design tokens.
export const getBallColor = (color: string): string => {
  return (BALL_COLORS as Record<string, string>)[color] ?? BALL_COLORS.red;
};
