import React, { useState, useEffect, useRef, useCallback } from "react";
import { sanitizePlayerName, getPlayerNameError } from "../../utils/sanitization";

interface PlayerNameInputProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  className?: string;
}

export const PlayerNameInput: React.FC<PlayerNameInputProps> = ({
  isOpen,
  onSubmit,
  onCancel,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmedValue = inputValue.trim();
    const error = getPlayerNameError(trimmedValue);
    
    if (error) {
      setIsValid(false);
      setErrorMessage(error);
      setHasSubmitted(true);
      return;
    }

    setIsValid(true);
    setErrorMessage("");
    setHasSubmitted(true);

    // Sanitize the name before submitting
    const sanitizedName = sanitizePlayerName(trimmedValue);
    onSubmit(sanitizedName);
  }, [inputValue, onSubmit]);

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
      setIsValid(true);
      setErrorMessage("");
      setHasSubmitted(false);
      // Focus the input after a short delay to ensure the modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleEnter);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleEnter);
    };
  }, [isOpen, onCancel, handleSubmit]);

  const handleCancel = () => {
    setInputValue("");
    setIsValid(true);
    setErrorMessage("");
    setHasSubmitted(false);
    onCancel();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Reset validation state when user starts typing again
    if (hasSubmitted) {
      setIsValid(true);
      setErrorMessage("");
      setHasSubmitted(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-game-bg-board/80 backdrop-blur-sm 
        flex items-center justify-center z-50 ${className}`}
      role="dialog"
      aria-labelledby="player-name-title"
      aria-modal="true"
    >
      <div className="bg-game-bg-tertiary border border-game-border-default p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          <h2
            id="player-name-title"
            className="text-xl font-bold text-game-text-accent mb-4"
          >
            New High Score!
          </h2>
          <p className="text-game-text-secondary mb-4">
            Enter your name to save your achievement:
          </p>

          <div className="mb-4">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 
                focus:ring-game-button-accent focus:ring-offset-2 text-game-text-primary 
                bg-game-bg-secondary ${
                  !isValid && hasSubmitted
                    ? "border-red-500 focus:ring-red-500"
                    : "border-game-border-default"
                }`}
              placeholder="Enter your name..."
              maxLength={20}
              aria-label="Player name input"
            />
            {!isValid && hasSubmitted && (
              <p className="text-red-500 text-sm mt-1">
                {errorMessage || "Please enter a valid name (not just spaces)"}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleSubmit}
              className="bg-game-button-accent hover:bg-game-button-accent-hover 
                text-black font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Save Score
            </button>
            <button
              onClick={handleCancel}
              className="bg-game-button-primary hover:bg-game-button-hover 
                text-game-text-primary font-semibold px-4 py-2 rounded-lg 
                border border-game-border-default transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
