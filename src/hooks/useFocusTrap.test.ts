import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFocusTrap, useSimpleFocusTrap, useModalFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct ref', () => {
    const { result } = renderHook(() => useFocusTrap({ active: false }));

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.containerRef.current).toBeNull();
  });

  it('should return focus management utilities', () => {
    const { result } = renderHook(() => useFocusTrap({ active: true }));

    expect(result.current.focusNext).toBeDefined();
    expect(result.current.focusPrevious).toBeDefined();
    expect(result.current.focusFirst).toBeDefined();
    expect(result.current.focusLast).toBeDefined();
    expect(result.current.getFocusableElements).toBeDefined();
  });

  it('should get focusable elements correctly', () => {
    const { result } = renderHook(() => useFocusTrap({ active: true }));

    act(() => {
      result.current.containerRef.current = document.createElement('div');
    });

    const focusableElements = result.current.getFocusableElements();
    expect(Array.isArray(focusableElements)).toBe(true);
  });

  it('should handle inactive state', () => {
    const { result } = renderHook(() => useFocusTrap({ active: false }));

    expect(result.current.containerRef).toBeDefined();
  });
});

describe('useSimpleFocusTrap', () => {
  it('should create simple focus trap with default options', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() => useSimpleFocusTrap(true, onEscape));

    expect(result.current.containerRef).toBeDefined();
  });
});

describe('useModalFocusTrap', () => {
  it('should create modal focus trap with close handler', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useModalFocusTrap(true, onClose));

    expect(result.current.containerRef).toBeDefined();
  });
}); 
