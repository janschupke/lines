import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnectionStatus } from './useConnectionStatus';

describe('useConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with disconnected status', () => {
      const { result } = renderHook(() => useConnectionStatus());

      expect(result.current).toBe('disconnected');
    });
  });

  describe('connection status updates', () => {
    it('should update status when connection event is dispatched', () => {
      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'connected' }
        }));
      });

      expect(result.current).toBe('connected');
    });

    it('should update status to connecting', () => {
      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'connecting' }
        }));
      });

      expect(result.current).toBe('connecting');
    });

    it('should update status to disconnected', () => {
      const { result } = renderHook(() => useConnectionStatus());

      // First set to connected
      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'connected' }
        }));
      });

      expect(result.current).toBe('connected');

      // Then set to disconnected
      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'disconnected' }
        }));
      });

      expect(result.current).toBe('disconnected');
    });

    it('should handle multiple status changes', () => {
      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'connecting' }
        }));
      });

      expect(result.current).toBe('connecting');

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'connected' }
        }));
      });

      expect(result.current).toBe('connected');

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'disconnected' }
        }));
      });

      expect(result.current).toBe('disconnected');
    });
  });

  describe('event listener cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useConnectionStatus());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'highScoreConnectionStatus',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should not receive updates after unmount', () => {
      const { result, unmount } = renderHook(() => useConnectionStatus());

      unmount();

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'connected' }
        }));
      });

      // Status should remain unchanged after unmount
      expect(result.current).toBe('disconnected');
    });
  });

  describe('event handling', () => {
    it('should handle events with different detail structures', () => {
      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'connected', additional: 'data' }
        }));
      });

      expect(result.current).toBe('connected');
    });

    it('should ignore events without detail', () => {
      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus'));
      });

      expect(result.current).toBe('disconnected');
    });

    it('should ignore events without status in detail', () => {
      const { result } = renderHook(() => useConnectionStatus());

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { other: 'data' }
        }));
      });

      expect(result.current).toBe('disconnected');
    });
  });

  describe('multiple hook instances', () => {
    it('should handle multiple hook instances independently', () => {
      const { result: result1 } = renderHook(() => useConnectionStatus());
      const { result: result2 } = renderHook(() => useConnectionStatus());

      expect(result1.current).toBe('disconnected');
      expect(result2.current).toBe('disconnected');

      act(() => {
        window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
          detail: { status: 'connected' }
        }));
      });

      expect(result1.current).toBe('connected');
      expect(result2.current).toBe('connected');
    });
  });
}); 
