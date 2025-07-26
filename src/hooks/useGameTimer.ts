import { useState, useEffect, useCallback, useRef } from "react";
import { TIMER_INTERVAL_MS, INACTIVITY_TIMEOUT_MS } from "../game/config";

export const useGameTimer = () => {
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Timer effect
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(
      () => setTimer((t) => t + 1),
      TIMER_INTERVAL_MS,
    );
    return () => clearInterval(interval);
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
    };
  }, []);

  const startTimer = useCallback(() => {
    setTimerActive(true);
  }, []);

  const stopTimer = useCallback(() => {
    setTimerActive(false);
    clearInactivityTimeout();
  }, [clearInactivityTimeout]);

  const resetTimer = useCallback(() => {
    setTimer(0);
    setTimerActive(false);
    clearInactivityTimeout();
  }, [clearInactivityTimeout]);

  const onActivity = useCallback(() => {
    if (!timerActive) {
      // Start timer if it's not active
      setTimerActive(true);
    } else {
      // Reset inactivity timeout if timer is already active
      setupInactivityTimeout();
    }
  }, [timerActive, setupInactivityTimeout]);

  return {
    timer,
    timerActive,
    setTimerActive,
    setTimer,
    startTimer,
    stopTimer,
    resetTimer,
    onActivity,
  };
};
