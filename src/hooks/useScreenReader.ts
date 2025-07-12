import { useCallback, useRef, useEffect } from "react";

// Screen reader announcement priority
export type AnnouncementPriority = "polite" | "assertive" | "off";

// Screen reader announcement options
export interface AnnouncementOptions {
  priority?: AnnouncementPriority;
  timeout?: number;
  clearPrevious?: boolean;
}

// Screen reader hook
export const useScreenReader = () => {
  const announcementsRef = useRef<HTMLDivElement[]>([]);

  // Create a live region for announcements
  const createLiveRegion = useCallback(
    (priority: AnnouncementPriority = "polite") => {
      const liveRegion = document.createElement("div");
      liveRegion.setAttribute("aria-live", priority);
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.className = "sr-only";
      liveRegion.style.position = "absolute";
      liveRegion.style.left = "-10000px";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.overflow = "hidden";

      return liveRegion;
    },
    [],
  );

  // Announce a message to screen readers
  const announce = useCallback(
    (message: string, options: AnnouncementOptions = {}) => {
      const {
        priority = "polite",
        timeout = 1000,
        clearPrevious = false,
      } = options;

      // Clear previous announcements if requested
      if (clearPrevious) {
        try {
          announcementsRef.current.forEach((region) => {
            if (region.parentNode) {
              region.parentNode.removeChild(region);
            }
          });
          announcementsRef.current = [];
        } catch (error) {
          // Log the error for debugging, but do not throw
          console.error("Error clearing previous announcements:", error);
        }
      }

      // Create new live region
      const liveRegion = createLiveRegion(priority);
      liveRegion.textContent = message;

      // Add to document with error handling
      try {
        document.body.appendChild(liveRegion);
        announcementsRef.current.push(liveRegion);
      } catch (error) {
        // Log the error for debugging, but do not throw
        console.error("Error appending live region to document:", error);
        return; // Exit early if we can't append to document
      }

      // Remove after timeout
      setTimeout(() => {
        try {
          if (liveRegion.parentNode) {
            liveRegion.parentNode.removeChild(liveRegion);
          }
          announcementsRef.current = announcementsRef.current.filter(
            (r) => r !== liveRegion,
          );
        } catch (error) {
          // Log the error for debugging, but do not throw
          console.error("Error cleaning up live region:", error);
        }
      }, timeout);
    },
    [createLiveRegion],
  );

  // Announce with assertive priority (interrupts current speech)
  const announceAssertive = useCallback(
    (message: string, timeout = 1000) => {
      announce(message, { priority: "assertive", timeout });
    },
    [announce],
  );

  // Announce with polite priority (waits for current speech to finish)
  const announcePolite = useCallback(
    (message: string, timeout = 1000) => {
      announce(message, { priority: "polite", timeout });
    },
    [announce],
  );

  // Announce status changes
  const announceStatus = useCallback(
    (status: string) => {
      announce(`Status: ${status}`, { priority: "polite", timeout: 2000 });
    },
    [announce],
  );

  // Announce errors
  const announceError = useCallback(
    (error: string) => {
      announce(`Error: ${error}`, { priority: "assertive", timeout: 3000 });
    },
    [announce],
  );

  // Announce success
  const announceSuccess = useCallback(
    (message: string) => {
      announce(`Success: ${message}`, { priority: "polite", timeout: 2000 });
    },
    [announce],
  );

  // Announce loading state
  const announceLoading = useCallback(
    (message: string) => {
      announce(`Loading: ${message}`, { priority: "polite", timeout: 1500 });
    },
    [announce],
  );

  // Announce completion
  const announceComplete = useCallback(
    (message: string) => {
      announce(`Complete: ${message}`, { priority: "polite", timeout: 2000 });
    },
    [announce],
  );

  // Clear all announcements
  const clearAnnouncements = useCallback(() => {
    try {
      announcementsRef.current.forEach((region) => {
        if (region.parentNode) {
          region.parentNode.removeChild(region);
        }
      });
      announcementsRef.current = [];
    } catch (error) {
      // Log the error for debugging, but do not throw
      console.error("Error clearing all announcements:", error);
    }
  }, []);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      clearAnnouncements();
    };
  }, [clearAnnouncements]);

  // Utility for announcing form validation errors
  const announceValidationError = useCallback(
    (fieldName: string, error: string) => {
      announce(`Validation error for ${fieldName}: ${error}`, {
        priority: "assertive",
        timeout: 3000,
      });
    },
    [announce],
  );

  // Utility for announcing navigation
  const announceNavigation = useCallback(
    (destination: string) => {
      announce(`Navigated to ${destination}`, {
        priority: "polite",
        timeout: 1500,
      });
    },
    [announce],
  );

  // Utility for announcing modal state
  const announceModalState = useCallback(
    (isOpen: boolean, modalName: string) => {
      if (isOpen) {
        announce(`${modalName} opened`, { priority: "polite", timeout: 1500 });
      } else {
        announce(`${modalName} closed`, { priority: "polite", timeout: 1000 });
      }
    },
    [announce],
  );

  return {
    announce,
    announceAssertive,
    announcePolite,
    announceStatus,
    announceError,
    announceSuccess,
    announceLoading,
    announceComplete,
    announceValidationError,
    announceNavigation,
    announceModalState,
    clearAnnouncements,
  };
};

// Utility for checking if screen reader is supported
export const isScreenReaderSupported = (): boolean => {
  return typeof window !== "undefined" && "speechSynthesis" in window;
};

// Utility for detecting reduced motion preference
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// Utility for detecting high contrast mode
export const prefersHighContrast = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: high)").matches;
};
