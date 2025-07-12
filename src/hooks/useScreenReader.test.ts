import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  isScreenReaderSupported, 
  prefersReducedMotion, 
  prefersHighContrast 
} from './useScreenReader';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

describe('Screen Reader Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.skip('should detect screen reader support', () => {
    // Mock speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {}
    });

    expect(isScreenReaderSupported()).toBe(true);

    // Mock without speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: undefined
    });

    expect(isScreenReaderSupported()).toBe(false);
  });

  it('should detect reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);

    mockMatchMedia.mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });

  it('should detect high contrast preference', () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    expect(prefersHighContrast()).toBe(true);

    mockMatchMedia.mockReturnValue({ matches: false });
    expect(prefersHighContrast()).toBe(false);
  });

  it('should handle window not defined', () => {
    const originalWindow = global.window;
    (global as Record<string, unknown>).window = undefined;

    expect(prefersReducedMotion()).toBe(false);
    expect(prefersHighContrast()).toBe(false);

    global.window = originalWindow;
  });
}); 
