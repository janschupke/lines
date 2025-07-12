import { useState, useEffect, useCallback } from "react";

interface TouchStart {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeGesture {
  deltaX: number;
  deltaY: number;
  deltaTime: number;
  direction: "left" | "right" | "up" | "down";
}

export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [touchStart, setTouchStart] = useState<TouchStart | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent,
        );
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      setIsMobile(isMobileDevice || isTouchDevice);

      // Check for tablet specifically
      const isTabletDevice = /ipad|android(?=.*\b(?!.*mobile))/i.test(
        userAgent,
      );
      setIsTablet(isTabletDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Detect low-performance devices
  useEffect(() => {
    const checkPerformance = () => {
      // Check network connection
      const connection = (
        navigator as Navigator & { connection?: { effectiveType: string } }
      ).connection;
      const isSlowConnection =
        connection &&
        (connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g" ||
          connection.effectiveType === "3g");

      // Check device capabilities
      const isLowEndDevice = navigator.hardwareConcurrency <= 2;
      const hasLimitedMemory =
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory! < 4;

      setIsLowPerformance(
        Boolean(isSlowConnection || isLowEndDevice || hasLimitedMemory),
      );
    };

    checkPerformance();
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    });
  }, []);

  // Handle touch end and detect swipe
  const handleTouchEnd = useCallback(
    (
      e: React.TouchEvent,
      x: number,
      y: number,
      onTap: (x: number, y: number) => void,
      onSwipe?: (gesture: SwipeGesture) => void,
    ) => {
      e.preventDefault();

      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const deltaTime = Date.now() - touchStart.timestamp;

      // Determine if this is a swipe or tap
      const minSwipeDistance = 30; // Minimum distance for swipe
      const maxSwipeTime = 300; // Maximum time for swipe

      if (
        Math.abs(deltaX) > minSwipeDistance ||
        Math.abs(deltaY) > minSwipeDistance
      ) {
        // This is a swipe
        if (deltaTime <= maxSwipeTime && onSwipe) {
          const direction =
            Math.abs(deltaX) > Math.abs(deltaY)
              ? deltaX > 0
                ? "right"
                : "left"
              : deltaY > 0
                ? "down"
                : "up";

          onSwipe({
            deltaX,
            deltaY,
            deltaTime,
            direction,
          });
        }
      } else {
        // This is a tap
        onTap(x, y);
      }

      setTouchStart(null);
    },
    [touchStart],
  );

  // Helper to get CSS variable as number (px)
  const getVar = (name: string, fallback: number) => {
    const val = getComputedStyle(document.documentElement).getPropertyValue(
      name,
    );
    return val ? parseInt(val) : fallback;
  };

  // Get mobile-specific values
  const getMobileValues = useCallback(() => {
    return {
      cellSize: getVar("--cell-size", 56),
      gapSize: getVar("--gap-size", 8),
      ballSize: getVar("--ball-size", 40),
      boardPadding: getVar("--board-padding", 8),
      animationDuration: isLowPerformance
        ? 0
        : getVar("--game-animation-duration", 300),
      enableAnimations: !isLowPerformance,
      touchTargetSize: getVar("--touch-target-size", 44),
    };
  }, [isLowPerformance]);

  return {
    isMobile,
    isTablet,
    isLowPerformance,
    handleTouchStart,
    handleTouchEnd,
    getMobileValues,
    touchStart,
  };
};
