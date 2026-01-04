import { useState, useCallback, useEffect, useRef } from "react";
import { TIMER_INTERVAL_MS, INACTIVITY_TIMEOUT_MS } from "../config";

export interface UseGameTimerReturn {
  timer: number;
  timerActive: boolean;
  setTimer: (timer: number) => void;
  setTimerActive: (active: boolean) => void;
  onActivity: () => void;
  resetTimer: () => void;
}

/**
 * Hook for managing game timer with inactivity timeout
 */
export const useGameTimer = (
  initialTimer = 0,
  initialTimerActive = false,
): UseGameTimerReturn => {
  const [timer, setTimer] = useState(initialTimer);
  const [timerActive, setTimerActive] = useState(initialTimerActive);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear inactivity timeout
  const clearInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  // Set up inactivity timeout
  const setupInactivityTimeout = useCallback(() => {
    clearInactivityTimeout();
    if (timerActive) {
      inactivityTimeoutRef.current = setTimeout(() => {
        setTimerActive(false);
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [timerActive, clearInactivityTimeout]);

  // Timer effect - real-time updates
  useEffect(() => {
    if (!timerActive) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, TIMER_INTERVAL_MS);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerActive]);

  // Set up inactivity timeout when timer becomes active
  useEffect(() => {
    if (timerActive) {
      setupInactivityTimeout();
    } else {
      clearInactivityTimeout();
    }
  }, [timerActive, setupInactivityTimeout, clearInactivityTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Activity handler
  const onActivity = useCallback(() => {
    if (!timerActive) {
      setTimerActive(true);
    } else {
      setupInactivityTimeout();
    }
  }, [timerActive, setupInactivityTimeout]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setTimer(0);
    setTimerActive(false);
  }, []);

  return {
    timer,
    timerActive,
    setTimer,
    setTimerActive,
    onActivity,
    resetTimer,
  };
};
