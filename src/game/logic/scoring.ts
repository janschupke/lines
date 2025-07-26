import {
  calculateLineScore as configCalculateLineScore,
} from "../config";

export const calculateLineScore = (lineLength: number): number => {
  return configCalculateLineScore(lineLength);
};
