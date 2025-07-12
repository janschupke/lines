import { useState, useEffect, useCallback } from 'react';
import { TIMER_INTERVAL_MS } from '../game/constants';

export const useGameTimer = () => {
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer(t => t + 1), TIMER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [timerActive]);

  const startTimer = useCallback(() => setTimerActive(true), []);
  const stopTimer = useCallback(() => setTimerActive(false), []);
  const resetTimer = useCallback(() => setTimer(0), []);

  return {
    timer,
    timerActive,
    setTimerActive,
    setTimer,
    startTimer,
    stopTimer,
    resetTimer,
  };
}; 
