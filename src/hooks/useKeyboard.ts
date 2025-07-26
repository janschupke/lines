import { useEffect, useCallback } from "react";

interface KeyboardHandlers {
  onKeyG?: () => void;
  onKeyN?: () => void;
  onKeyEscape?: () => void;
}

export const useKeyboard = (handlers: KeyboardHandlers) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger hotkeys when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "g":
          handlers.onKeyG?.();
          break;
        case "n":
          handlers.onKeyN?.();
          break;
        case "escape":
          handlers.onKeyEscape?.();
          break;
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}; 
