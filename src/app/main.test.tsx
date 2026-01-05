import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { App } from "./main";

// Mock the Game component
vi.mock("@features/game/components/Game/Game", () => ({
  default: () => <div data-testid="game-component">Game Component</div>,
}));

// Mock the SmallScreenWarning component
vi.mock("@shared/components/SmallScreenWarning", () => ({
  SmallScreenWarning: () => (
    <div data-testid="small-screen-warning">Small Screen Warning</div>
  ),
}));

describe("App - Small Screen Warning", () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Store original innerWidth
    originalInnerWidth = window.innerWidth;
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("shows SmallScreenWarning when screen width is less than 600px", async () => {
    // Set window width to small screen
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("small-screen-warning")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("game-component")).not.toBeInTheDocument();
  });

  it("shows Game component when screen width is 600px or more", async () => {
    // Set window width to large screen
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("game-component")).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("small-screen-warning"),
    ).not.toBeInTheDocument();
  });

  it("updates when window is resized from large to small", async () => {
    // Start with large screen
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("game-component")).toBeInTheDocument();
    });

    // Resize to small screen
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    // Trigger resize event wrapped in act
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
      // Wait a bit for state update
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Wait for state update
    await waitFor(
      () => {
        expect(screen.getByTestId("small-screen-warning")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    expect(screen.queryByTestId("game-component")).not.toBeInTheDocument();
  });

  it("updates when window is resized from small to large", async () => {
    // Start with small screen
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("small-screen-warning")).toBeInTheDocument();
    });

    // Resize to large screen
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    // Trigger resize event wrapped in act
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
      // Wait a bit for state update
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Wait for state update
    await waitFor(
      () => {
        expect(screen.getByTestId("game-component")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    expect(
      screen.queryByTestId("small-screen-warning"),
    ).not.toBeInTheDocument();
  });
});
