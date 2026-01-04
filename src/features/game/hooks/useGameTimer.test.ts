import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGameTimer } from "./useGameTimer";
import { TIMER_INTERVAL_MS, INACTIVITY_TIMEOUT_MS } from "../config";

describe("useGameTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("initializes with default values", () => {
      const { result } = renderHook(() => useGameTimer());

      expect(result.current.timer).toBe(0);
      expect(result.current.timerActive).toBe(false);
    });

    it("initializes with provided values", () => {
      const { result } = renderHook(() =>
        useGameTimer(100, true),
      );

      expect(result.current.timer).toBe(100);
      expect(result.current.timerActive).toBe(true);
    });
  });

  describe("timer functionality", () => {
    it("increments timer when active", async () => {
      const { result } = renderHook(() => useGameTimer(0, true));

      expect(result.current.timer).toBe(0);

      await act(async () => {
        vi.advanceTimersByTime(TIMER_INTERVAL_MS);
      });

      expect(result.current.timer).toBe(1);

      await act(async () => {
        vi.advanceTimersByTime(TIMER_INTERVAL_MS * 2);
      });

      expect(result.current.timer).toBe(3);
    });

    it("does not increment timer when inactive", async () => {
      const { result } = renderHook(() => useGameTimer(0, false));

      await act(async () => {
        vi.advanceTimersByTime(TIMER_INTERVAL_MS * 10);
      });

      expect(result.current.timer).toBe(0);
    });

    it("stops incrementing when timer becomes inactive", async () => {
      const { result } = renderHook(() => useGameTimer(0, true));

      await act(async () => {
        vi.advanceTimersByTime(TIMER_INTERVAL_MS * 5);
      });

      expect(result.current.timer).toBe(5);

      act(() => {
        result.current.setTimerActive(false);
      });

      await act(async () => {
        vi.advanceTimersByTime(TIMER_INTERVAL_MS * 10);
      });

      expect(result.current.timer).toBe(5);
    });
  });

  describe("setTimer", () => {
    it("sets timer to specific value", () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.setTimer(100);
      });

      expect(result.current.timer).toBe(100);
    });
  });

  describe("setTimerActive", () => {
    it("activates timer", () => {
      const { result } = renderHook(() => useGameTimer(0, false));

      act(() => {
        result.current.setTimerActive(true);
      });

      expect(result.current.timerActive).toBe(true);
    });

    it("deactivates timer", () => {
      const { result } = renderHook(() => useGameTimer(0, true));

      act(() => {
        result.current.setTimerActive(false);
      });

      expect(result.current.timerActive).toBe(false);
    });
  });

  describe("onActivity", () => {
    it("activates timer if inactive", () => {
      const { result } = renderHook(() => useGameTimer(0, false));

      act(() => {
        result.current.onActivity();
      });

      expect(result.current.timerActive).toBe(true);
    });

    it("resets inactivity timeout if already active", async () => {
      const { result } = renderHook(() => useGameTimer(0, true));

      // Wait for inactivity timeout to be set
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Trigger activity
      act(() => {
        result.current.onActivity();
      });

      // Advance time but not enough to trigger inactivity
      await act(async () => {
        vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 100);
      });

      expect(result.current.timerActive).toBe(true);

      // Advance past inactivity timeout
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.timerActive).toBe(false);
    });
  });

  describe("inactivity timeout", () => {
    it("deactivates timer after inactivity timeout", async () => {
      const { result } = renderHook(() => useGameTimer(0, true));

      expect(result.current.timerActive).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS);
      });

      expect(result.current.timerActive).toBe(false);
    });

    it("resets inactivity timeout on activity", async () => {
      const { result } = renderHook(() => useGameTimer(0, true));

      // Advance partway through timeout
      await act(async () => {
        vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS / 2);
      });

      // Trigger activity
      act(() => {
        result.current.onActivity();
      });

      // Advance same amount again - should still be active
      await act(async () => {
        vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS / 2);
      });

      expect(result.current.timerActive).toBe(true);

      // Now advance full timeout
      await act(async () => {
        vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS);
      });

      expect(result.current.timerActive).toBe(false);
    });
  });

  describe("resetTimer", () => {
    it("resets timer to 0 and deactivates", () => {
      const { result } = renderHook(() => useGameTimer(100, true));

      act(() => {
        result.current.resetTimer();
      });

      expect(result.current.timer).toBe(0);
      expect(result.current.timerActive).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("cleans up intervals on unmount", async () => {
      const { result, unmount } = renderHook(() => useGameTimer(0, true));

      await act(async () => {
        vi.advanceTimersByTime(TIMER_INTERVAL_MS);
      });

      expect(result.current.timer).toBe(1);

      unmount();

      // Timer should not continue after unmount
      await act(async () => {
        vi.advanceTimersByTime(TIMER_INTERVAL_MS * 10);
      });

      // Can't check timer after unmount, but no errors should occur
    });
  });
});

