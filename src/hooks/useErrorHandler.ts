import { useState, useCallback } from "react";

// Error types
export type ErrorType =
  | "network"
  | "validation"
  | "database"
  | "unknown"
  | "timeout"
  | "permission";

// Error state interface
export interface ErrorState {
  id: string;
  type: ErrorType;
  message: string;
  retryable: boolean;
  timestamp: number;
  details?: string;
}

// Error handling hook
export const useErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorState[]>([]);

  const addError = useCallback(
    (type: ErrorType, message: string, retryable = false, details?: string) => {
      const error: ErrorState = {
        id: `error-${Date.now()}-${Math.random()}`,
        type,
        message,
        retryable,
        timestamp: Date.now(),
        details,
      };

      setErrors((prev) => [...prev, error]);

      // Auto-remove errors after 10 seconds (except for validation errors)
      if (type !== "validation") {
        setTimeout(() => {
          setErrors((prev) => prev.filter((e) => e.id !== error.id));
        }, 10000);
      }
    },
    [],
  );

  const clearError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearErrorsByType = useCallback((type: ErrorType) => {
    setErrors((prev) => prev.filter((error) => error.type !== type));
  }, []);

  const getErrorsByType = useCallback(
    (type: ErrorType) => {
      return errors.filter((error) => error.type === type);
    },
    [errors],
  );

  const hasErrors = useCallback(() => {
    return errors.length > 0;
  }, [errors]);

  const hasErrorsByType = useCallback(
    (type: ErrorType) => {
      return errors.some((error) => error.type === type);
    },
    [errors],
  );

  return {
    errors,
    addError,
    clearError,
    clearAllErrors,
    clearErrorsByType,
    getErrorsByType,
    hasErrors,
    hasErrorsByType,
  };
};

// Utility functions for common error scenarios
export const createNetworkError = (message: string, retryable = true) => ({
  type: "network" as const,
  message,
  retryable,
});

export const createValidationError = (message: string) => ({
  type: "validation" as const,
  message,
  retryable: false,
});

export const createDatabaseError = (message: string, retryable = true) => ({
  type: "database" as const,
  message,
  retryable,
});

export const createTimeoutError = (message: string, retryable = true) => ({
  type: "timeout" as const,
  message,
  retryable,
});

export const createPermissionError = (message: string, retryable = false) => ({
  type: "permission" as const,
  message,
  retryable,
});

// Error message utilities
export const getErrorMessage = (
  type: ErrorType,
  defaultMessage: string,
): string => {
  const errorMessages = {
    network: "Connection error. Please check your internet connection.",
    validation: "Invalid input. Please check your data and try again.",
    database: "Database error. Please try again later.",
    timeout: "Request timed out. Please try again.",
    permission: "Access denied. You may not have permission for this action.",
    unknown: "An unexpected error occurred. Please try again.",
  };

  return errorMessages[type] || defaultMessage;
};

// Error severity levels
export const getErrorSeverity = (
  type: ErrorType,
): "low" | "medium" | "high" => {
  const severityMap = {
    validation: "low" as const,
    network: "medium" as const,
    timeout: "medium" as const,
    database: "high" as const,
    permission: "high" as const,
    unknown: "high" as const,
  };

  return severityMap[type];
};
