import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  useErrorHandler, 
  createNetworkError, 
  createValidationError, 
  createDatabaseError,
  createTimeoutError,
  createPermissionError,
  getErrorMessage,
  getErrorSeverity
} from './useErrorHandler';

// Mock timers
vi.useFakeTimers();

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty errors array', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.errors).toEqual([]);
    expect(result.current.hasErrors()).toBe(false);
  });

  it('should add errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('network', 'Connection failed', true);
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]).toMatchObject({
      type: 'network',
      message: 'Connection failed',
      retryable: true
    });
    expect(result.current.hasErrors()).toBe(true);
  });

  it('should clear individual errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('network', 'Connection failed');
      result.current.addError('validation', 'Invalid input');
    });

    expect(result.current.errors).toHaveLength(2);

    const firstErrorId = result.current.errors[0].id;

    act(() => {
      result.current.clearError(firstErrorId);
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].type).toBe('validation');
  });

  it('should clear all errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('network', 'Connection failed');
      result.current.addError('validation', 'Invalid input');
    });

    expect(result.current.errors).toHaveLength(2);

    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.errors).toHaveLength(0);
    expect(result.current.hasErrors()).toBe(false);
  });

  it('should clear errors by type', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('network', 'Connection failed');
      result.current.addError('validation', 'Invalid input');
      result.current.addError('network', 'Another connection error');
    });

    expect(result.current.errors).toHaveLength(3);

    act(() => {
      result.current.clearErrorsByType('network');
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].type).toBe('validation');
  });

  it('should get errors by type', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('network', 'Connection failed');
      result.current.addError('validation', 'Invalid input');
      result.current.addError('network', 'Another connection error');
    });

    const networkErrors = result.current.getErrorsByType('network');
    expect(networkErrors).toHaveLength(2);
    expect(networkErrors.every(error => error.type === 'network')).toBe(true);

    const validationErrors = result.current.getErrorsByType('validation');
    expect(validationErrors).toHaveLength(1);
    expect(validationErrors[0].type).toBe('validation');
  });

  it('should check for errors by type', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.hasErrorsByType('network')).toBe(false);

    act(() => {
      result.current.addError('network', 'Connection failed');
    });

    expect(result.current.hasErrorsByType('network')).toBe(true);
    expect(result.current.hasErrorsByType('validation')).toBe(false);
  });

  it('should auto-remove non-validation errors after 10 seconds', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('network', 'Connection failed');
      result.current.addError('validation', 'Invalid input');
    });

    expect(result.current.errors).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].type).toBe('validation');
  });

  it('should not auto-remove validation errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('validation', 'Invalid input');
    });

    expect(result.current.errors).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].type).toBe('validation');
  });

  it('should include error details when provided', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('network', 'Connection failed', true, 'HTTP 500');
    });

    expect(result.current.errors[0].details).toBe('HTTP 500');
  });
});

describe('Error creation utilities', () => {
  it('should create network error correctly', () => {
    const error = createNetworkError('Connection failed', true);
    
    expect(error).toEqual({
      type: 'network',
      message: 'Connection failed',
      retryable: true
    });
  });

  it('should create validation error correctly', () => {
    const error = createValidationError('Invalid input');
    
    expect(error).toEqual({
      type: 'validation',
      message: 'Invalid input',
      retryable: false
    });
  });

  it('should create database error correctly', () => {
    const error = createDatabaseError('Database connection failed', true);
    
    expect(error).toEqual({
      type: 'database',
      message: 'Database connection failed',
      retryable: true
    });
  });

  it('should create timeout error correctly', () => {
    const error = createTimeoutError('Request timed out', true);
    
    expect(error).toEqual({
      type: 'timeout',
      message: 'Request timed out',
      retryable: true
    });
  });

  it('should create permission error correctly', () => {
    const error = createPermissionError('Access denied', false);
    
    expect(error).toEqual({
      type: 'permission',
      message: 'Access denied',
      retryable: false
    });
  });
});

describe('Error message utilities', () => {
  it('should return correct error messages for each type', () => {
    expect(getErrorMessage('network', 'Custom message')).toBe('Connection error. Please check your internet connection.');
    expect(getErrorMessage('validation', 'Custom message')).toBe('Invalid input. Please check your data and try again.');
    expect(getErrorMessage('database', 'Custom message')).toBe('Database error. Please try again later.');
    expect(getErrorMessage('timeout', 'Custom message')).toBe('Request timed out. Please try again.');
    expect(getErrorMessage('permission', 'Custom message')).toBe('Access denied. You may not have permission for this action.');
    expect(getErrorMessage('unknown', 'Custom message')).toBe('An unexpected error occurred. Please try again.');
  });

  it('should return default message for unknown error type', () => {
    expect(getErrorMessage('unknown' as never, 'Custom message')).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('Error severity utilities', () => {
  it('should return correct severity levels', () => {
    expect(getErrorSeverity('validation')).toBe('low');
    expect(getErrorSeverity('network')).toBe('medium');
    expect(getErrorSeverity('timeout')).toBe('medium');
    expect(getErrorSeverity('database')).toBe('high');
    expect(getErrorSeverity('permission')).toBe('high');
    expect(getErrorSeverity('unknown')).toBe('high');
  });
}); 
