import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useAnimation,
  useFadeAnimation,
  useSlideAnimation,
  useScaleAnimation,
  ANIMATION_CONFIGS,
} from "./useAnimation";

// Mock timers
vi.useFakeTimers();

describe("useAnimation", () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useAnimation(ANIMATION_CONFIGS.fade));

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.isVisible).toBe(false);
    expect(result.current.config).toEqual(ANIMATION_CONFIGS.fade);
  });

  it("should animate in correctly", () => {
    const { result } = renderHook(() => useAnimation(ANIMATION_CONFIGS.fade));

    act(() => {
      result.current.animateIn();
    });

    expect(result.current.isAnimating).toBe(true);
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200); // fade duration
    });

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.isVisible).toBe(true);
  });

  it("should animate out correctly", () => {
    const { result } = renderHook(() => useAnimation(ANIMATION_CONFIGS.fade));

    // First animate in
    act(() => {
      result.current.animateIn();
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isVisible).toBe(true);

    // Then animate out
    act(() => {
      result.current.animateOut();
    });

    expect(result.current.isAnimating).toBe(true);
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200); // fade duration
    });

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.isVisible).toBe(false);
  });

  it("should toggle animation state correctly", () => {
    const { result } = renderHook(() => useAnimation(ANIMATION_CONFIGS.fade));

    // Toggle from hidden to visible
    act(() => {
      result.current.toggle();
    });

    expect(result.current.isAnimating).toBe(true);
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isVisible).toBe(true);

    // Toggle from visible to hidden
    act(() => {
      result.current.toggle();
    });

    expect(result.current.isAnimating).toBe(true);
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it("should handle custom animation configuration", () => {
    const customConfig = { duration: 500, easing: "ease-in-out" };
    const { result } = renderHook(() => useAnimation(customConfig));

    act(() => {
      result.current.animateIn();
    });

    expect(result.current.config).toEqual(customConfig);
    expect(result.current.isAnimating).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.isAnimating).toBe(false);
  });

  it("should handle multiple rapid animations correctly", () => {
    const { result } = renderHook(() => useAnimation(ANIMATION_CONFIGS.fade));

    // Start multiple animations rapidly
    act(() => {
      result.current.animateIn();
      result.current.animateOut();
      result.current.animateIn();
    });

    expect(result.current.isAnimating).toBe(true);
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.isVisible).toBe(true);
  });
});

describe("useFadeAnimation", () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it("should use fade animation configuration", () => {
    const { result } = renderHook(() => useFadeAnimation(300));

    expect(result.current.config).toEqual({
      duration: 300,
      easing: "ease-in-out",
    });
  });

  it("should use default duration when not specified", () => {
    const { result } = renderHook(() => useFadeAnimation());

    expect(result.current.config).toEqual({
      duration: 200,
      easing: "ease-in-out",
    });
  });
});

describe("useSlideAnimation", () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it("should use slide animation configuration", () => {
    const { result } = renderHook(() => useSlideAnimation(500));

    expect(result.current.config).toEqual({
      duration: 500,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
  });

  it("should use default duration when not specified", () => {
    const { result } = renderHook(() => useSlideAnimation());

    expect(result.current.config).toEqual({
      duration: 400,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
  });
});

describe("useScaleAnimation", () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it("should use scale animation configuration", () => {
    const { result } = renderHook(() => useScaleAnimation(400));

    expect(result.current.config).toEqual({
      duration: 400,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
  });

  it("should use default duration when not specified", () => {
    const { result } = renderHook(() => useScaleAnimation());

    expect(result.current.config).toEqual({
      duration: 300,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
  });
});

describe("ANIMATION_CONFIGS", () => {
  it("should have correct predefined configurations", () => {
    expect(ANIMATION_CONFIGS.overlay).toEqual({
      duration: 300,
      easing: "ease-in-out",
    });

    expect(ANIMATION_CONFIGS.modal).toEqual({
      duration: 250,
      easing: "ease-out",
    });

    expect(ANIMATION_CONFIGS.fade).toEqual({
      duration: 200,
      easing: "ease-in-out",
    });

    expect(ANIMATION_CONFIGS.slide).toEqual({
      duration: 400,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });

    expect(ANIMATION_CONFIGS.bounce).toEqual({
      duration: 500,
      easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    });

    expect(ANIMATION_CONFIGS.scale).toEqual({
      duration: 300,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
  });
});
