import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameTimer } from "./useGameTimer";

// Mock timers
vi.useFakeTimers();

describe("useGameTimer", () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  describe("initial state", () => {
    it("initializes with timer stopped", () => {
      const { result } = renderHook(() => useGameTimer());

      expect(result.current.timer).toBe(0);
      expect(result.current.timerActive).toBe(false);
    });

    it("provides all required methods", () => {
      const { result } = renderHook(() => useGameTimer());

      expect(result.current.setTimerActive).toBeDefined();
      expect(result.current.setTimer).toBeDefined();
      expect(result.current.startTimer).toBeDefined();
      expect(result.current.stopTimer).toBeDefined();
      expect(result.current.resetTimer).toBeDefined();
      expect(result.current.onActivity).toBeDefined();
    });
  });

  describe("timer control", () => {
    it("starts timer when setTimerActive is called with true", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.setTimerActive(true);
      });

      expect(result.current.timerActive).toBe(true);
    });

    it("stops timer when setTimerActive is called with false", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.setTimerActive(true);
        result.current.setTimerActive(false);
      });

      expect(result.current.timerActive).toBe(false);
    });

    it("increments timer when active", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.setTimerActive(true);
      });

      expect(result.current.timer).toBe(0);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timer).toBe(1);
    });

    it("does not increment timer when inactive", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timer).toBe(0);
    });
  });

  describe("timer methods", () => {
    it("startTimer activates timer", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.startTimer();
      });

      expect(result.current.timerActive).toBe(true);
    });

    it("stopTimer deactivates timer", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.startTimer();
        result.current.stopTimer();
      });

      expect(result.current.timerActive).toBe(false);
    });

    it("resetTimer resets timer to 0 and stops it", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(2000);
        result.current.resetTimer();
      });

      expect(result.current.timer).toBe(0);
      expect(result.current.timerActive).toBe(false);
    });
  });

  describe("activity handling", () => {
    it("starts timer on first activity", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.onActivity();
      });

      expect(result.current.timerActive).toBe(true);
    });

    it("resets inactivity timeout on activity when timer is active", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(5000); // Advance 5 seconds
        result.current.onActivity();
      });

      // Timer should still be active after activity
      expect(result.current.timerActive).toBe(true);
    });
  });

  describe("timer state management", () => {
    it("allows manual timer value setting", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.setTimer(42);
      });

      expect(result.current.timer).toBe(42);
    });

    it("resets timer when stopping and starting", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(3000);
        result.current.stopTimer();
        result.current.startTimer();
      });

      // Timer value should be reset when stopping and starting
      expect(result.current.timer).toBe(0);
      expect(result.current.timerActive).toBe(true);
    });

    it("resets timer when resetTimer is called", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(5000);
        result.current.resetTimer();
      });

      expect(result.current.timer).toBe(0);
      expect(result.current.timerActive).toBe(false);
    });
  });
}); 
