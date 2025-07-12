import { calculateLineScore, calculateBonusScore } from './scoring';
import { describe, it, expect } from 'vitest';

describe('calculateLineScore', () => {
  it('returns 0 for lines shorter than 5', () => {
    expect(calculateLineScore(4)).toBe(0);
    expect(calculateLineScore(0)).toBe(0);
  });
  it('returns correct Fibonacci-based score for line length', () => {
    expect(calculateLineScore(5)).toBe(100);
    expect(calculateLineScore(6)).toBe(100);
    expect(calculateLineScore(7)).toBe(200);
    expect(calculateLineScore(8)).toBe(300);
    expect(calculateLineScore(9)).toBe(500);
    expect(calculateLineScore(10)).toBe(800);
    expect(calculateLineScore(11)).toBe(1300);
    expect(calculateLineScore(12)).toBe(2100);
    expect(calculateLineScore(13)).toBe(3400);
    expect(calculateLineScore(14)).toBe(5500);
    expect(calculateLineScore(15)).toBe(8900);
    expect(calculateLineScore(16)).toBe(14400);
    expect(calculateLineScore(17)).toBe(23300);
    expect(calculateLineScore(18)).toBe(37700);
    expect(calculateLineScore(19)).toBe(61000);
    expect(calculateLineScore(30)).toBe(61000);
  });
});

describe('calculateBonusScore', () => {
  it('returns 0 for no bonuses', () => {
    expect(calculateBonusScore(0, 0, 0)).toBe(0);
  });
  it('adds bonus for consecutive high scores', () => {
    expect(calculateBonusScore(3, 0, 0)).toBe(150);
    expect(calculateBonusScore(5, 0, 0)).toBe(250);
  });
  it('adds bonus for averageScorePerTurn > 100', () => {
    expect(calculateBonusScore(0, 150, 0)).toBe(30);
  });
  it('adds strategic bonus', () => {
    expect(calculateBonusScore(0, 0, 42)).toBe(42);
  });
  it('combines all bonuses', () => {
    expect(calculateBonusScore(4, 200, 50)).toBe(4*50 + 40 + 50);
  });
}); 
