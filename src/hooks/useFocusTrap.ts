import { useEffect, useRef, useCallback } from 'react';

// Focus trap configuration
export interface FocusTrapConfig {
  active: boolean;
  returnFocus?: boolean;
  onEscape?: () => void;
  onTabOut?: () => void;
}

// Focus trap hook
export const useFocusTrap = (config: FocusTrapConfig) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const container = containerRef.current;
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];
    
    const elements = container.querySelectorAll(focusableSelectors.join(', '));
    return Array.from(elements) as HTMLElement[];
  }, []);

  // Focus the first focusable element
  const focusFirstElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  // Focus the last focusable element
  const focusLastElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!config.active) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(currentElement);

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        
        if (e.shiftKey) {
          // Shift + Tab: move to previous element
          if (currentIndex <= 0) {
            focusableElements[focusableElements.length - 1].focus();
          } else {
            focusableElements[currentIndex - 1].focus();
          }
        } else {
          // Tab: move to next element
          if (currentIndex >= focusableElements.length - 1) {
            focusableElements[0].focus();
          } else {
            focusableElements[currentIndex + 1].focus();
          }
        }
        break;

      case 'Escape':
        if (config.onEscape) {
          config.onEscape();
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown': {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        const nextIndex = (currentIndex + direction + focusableElements.length) % focusableElements.length;
        focusableElements[nextIndex].focus();
        break;
      }

      case 'Home':
        e.preventDefault();
        focusFirstElement();
        break;

      case 'End':
        e.preventDefault();
        focusLastElement();
        break;
    }
  }, [config.active, config.onEscape, getFocusableElements, focusFirstElement, focusLastElement]);

  // Set up focus trap
  useEffect(() => {
    if (!config.active || !containerRef.current) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first element in the trap
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Add event listeners
    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus when trap is deactivated
      if (config.returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [config.active, config.returnFocus, handleKeyDown, getFocusableElements]);

  // Focus management utilities
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(currentElement);
    
    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(currentElement);
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    } else if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  const focusFirst = useCallback(() => {
    focusFirstElement();
  }, [focusFirstElement]);

  const focusLast = useCallback(() => {
    focusLastElement();
  }, [focusLastElement]);

  return {
    containerRef,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    getFocusableElements
  };
};

// Utility hook for simple focus trap
export const useSimpleFocusTrap = (isActive: boolean, onEscape?: () => void) => {
  return useFocusTrap({
    active: isActive,
    returnFocus: true,
    onEscape
  });
};

// Utility hook for modal focus trap
export const useModalFocusTrap = (isOpen: boolean, onClose?: () => void) => {
  return useFocusTrap({
    active: isOpen,
    returnFocus: true,
    onEscape: onClose
  });
}; 
