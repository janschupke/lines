import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnectionStatusEvent } from './useConnectionStatus';

describe('useConnectionStatusEvent', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    window.removeEventListener('highScoreConnectionStatus', () => {});
  });

  it('should return disconnected by default', () => {
    const { result } = renderHook(() => useConnectionStatusEvent());
    expect(result.current).toBe('disconnected');
  });

  it('should update status when connection event is fired', () => {
    const { result } = renderHook(() => useConnectionStatusEvent());

    act(() => {
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
        detail: { status: 'connected' }
      }));
    });

    expect(result.current).toBe('connected');
  });

  it('should update status to connecting', () => {
    const { result } = renderHook(() => useConnectionStatusEvent());

    act(() => {
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
        detail: { status: 'connecting' }
      }));
    });

    expect(result.current).toBe('connecting');
  });

  it('should update status to disconnected', () => {
    const { result } = renderHook(() => useConnectionStatusEvent());

    act(() => {
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
        detail: { status: 'disconnected' }
      }));
    });

    expect(result.current).toBe('disconnected');
  });

  it('should handle multiple status changes', () => {
    const { result } = renderHook(() => useConnectionStatusEvent());

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

  it('should ignore events without status detail', () => {
    const { result } = renderHook(() => useConnectionStatusEvent());

    act(() => {
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
        detail: {}
      }));
    });

    expect(result.current).toBe('disconnected');
  });

  it('should ignore events without detail', () => {
    const { result } = renderHook(() => useConnectionStatusEvent());

    act(() => {
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus'));
    });

    expect(result.current).toBe('disconnected');
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useConnectionStatusEvent());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'highScoreConnectionStatus',
      expect.any(Function)
    );
    removeEventListenerSpy.mockRestore();
  });

  it('should handle multiple instances independently', () => {
    const { result: result1 } = renderHook(() => useConnectionStatusEvent());
    const { result: result2 } = renderHook(() => useConnectionStatusEvent());

    act(() => {
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
        detail: { status: 'connected' }
      }));
    });

    expect(result1.current).toBe('connected');
    expect(result2.current).toBe('connected');
  });

  it('should maintain state across re-renders', () => {
    const { result, rerender } = renderHook(() => useConnectionStatusEvent());

    act(() => {
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
        detail: { status: 'connected' }
      }));
    });

    expect(result.current).toBe('connected');

    rerender();

    expect(result.current).toBe('connected');
  });

  it('should handle rapid status changes', () => {
    const { result } = renderHook(() => useConnectionStatusEvent());

    act(() => {
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
        detail: { status: 'connecting' }
      }));
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
        detail: { status: 'connected' }
      }));
      window.dispatchEvent(new CustomEvent('highScoreConnectionStatus', {
        detail: { status: 'disconnected' }
      }));
    });

    expect(result.current).toBe('disconnected');
  });
}); 
