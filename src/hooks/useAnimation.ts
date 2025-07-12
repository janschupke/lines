import { useState, useCallback, useRef, useEffect } from 'react';

// Animation configuration types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// Animation state interface
export interface AnimationState {
  isAnimating: boolean;
  isVisible: boolean;
}

// Predefined animation configurations
export const ANIMATION_CONFIGS = {
  overlay: { duration: 300, easing: 'ease-in-out' },
  modal: { duration: 250, easing: 'ease-out' },
  fade: { duration: 200, easing: 'ease-in-out' },
  slide: { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  bounce: { duration: 500, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  scale: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
} as const;

// Animation hook
export const useAnimation = (config: AnimationConfig) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timeouts
  const clearAnimTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearAnimTimeout();
    };
  }, [clearAnimTimeout]);

  const animateIn = useCallback(() => {
    clearAnimTimeout();
    setIsAnimating(true);
    setIsVisible(true);
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      timeoutRef.current = null;
    }, config.duration);
  }, [config.duration, clearAnimTimeout]);

  const animateOut = useCallback(() => {
    clearAnimTimeout();
    setIsAnimating(true);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
      timeoutRef.current = null;
    }, config.duration);
  }, [config.duration, clearAnimTimeout]);

  const toggle = useCallback(() => {
    if (isVisible) {
      animateOut();
    } else {
      animateIn();
    }
  }, [isVisible, animateIn, animateOut]);

  return {
    isAnimating,
    isVisible,
    animateIn,
    animateOut,
    toggle,
    config
  };
};

// Utility hook for fade animations
export const useFadeAnimation = (duration = 200) => {
  return useAnimation({ duration, easing: 'ease-in-out' });
};

// Utility hook for slide animations
export const useSlideAnimation = (duration = 400) => {
  return useAnimation({ 
    duration, 
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)' 
  });
};

// Utility hook for scale animations
export const useScaleAnimation = (duration = 300) => {
  return useAnimation({ 
    duration, 
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)' 
  });
}; 
