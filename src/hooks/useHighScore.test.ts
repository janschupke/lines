import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useHighScore } from "./useHighScore";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useHighScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it("should initialize with 0 when no high score exists", () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useHighScore());
    
    expect(result.current.highScore).toBe(0);
    expect(result.current.isNewHighScore).toBe(false);
  });

  it("should load existing high score from localStorage", () => {
    localStorageMock.getItem.mockReturnValue("150");
    
    const { result } = renderHook(() => useHighScore());
    
    expect(result.current.highScore).toBe(150);
    expect(result.current.isNewHighScore).toBe(false);
  });

  it("should update high score when current score is higher", () => {
    localStorageMock.getItem.mockReturnValue("100");
    
    const { result } = renderHook(() => useHighScore());
    
    act(() => {
      const isNewHighScore = result.current.checkAndUpdateHighScore(200);
      expect(isNewHighScore).toBe(true);
    });
    
    expect(result.current.highScore).toBe(200);
    expect(result.current.isNewHighScore).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith("lines-game-high-score", "200");
  });

  it("should not update high score when current score is lower", () => {
    localStorageMock.getItem.mockReturnValue("200");
    
    const { result } = renderHook(() => useHighScore());
    
    act(() => {
      const isNewHighScore = result.current.checkAndUpdateHighScore(100);
      expect(isNewHighScore).toBe(false);
    });
    
    expect(result.current.highScore).toBe(200);
    expect(result.current.isNewHighScore).toBe(false);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it("should reset new high score flag", () => {
    localStorageMock.getItem.mockReturnValue("100");
    
    const { result } = renderHook(() => useHighScore());
    
    act(() => {
      result.current.checkAndUpdateHighScore(200);
    });
    
    expect(result.current.isNewHighScore).toBe(true);
    
    act(() => {
      result.current.resetNewHighScoreFlag();
    });
    
    expect(result.current.isNewHighScore).toBe(false);
  });

  it("should handle localStorage errors gracefully", () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error("localStorage error");
    });
    
    const { result } = renderHook(() => useHighScore());
    
    expect(result.current.highScore).toBe(0);
  });

  it("should handle invalid localStorage data", () => {
    localStorageMock.getItem.mockReturnValue("invalid");
    
    const { result } = renderHook(() => useHighScore());
    
    expect(result.current.highScore).toBe(0);
  });
}); 
