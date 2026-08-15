import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import SmallScreenGate from "./SmallScreenGate";

// Mock next/dynamic to resolve the Game mock synchronously
vi.mock("next/dynamic", () => ({
  default: () => {
    const MockGame = () => <div data-testid="game-component">Game</div>;
    return MockGame;
  },
}));

// Mock the SmallScreenWarning component
vi.mock("@/shared/components/SmallScreenWarning", () => ({
  SmallScreenWarning: () => (
    <div data-testid="small-screen-warning">Small Screen Warning</div>
  ),
}));

describe("SmallScreenGate", () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  const setWidth = (value: number) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value,
    });
  };

  it("shows SmallScreenWarning when screen width is less than 600px", async () => {
    setWidth(500);
    render(<SmallScreenGate />);

    await waitFor(() => {
      expect(screen.getByTestId("small-screen-warning")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("game-component")).not.toBeInTheDocument();
  });

  it("shows Game component when screen width is 600px or more", async () => {
    setWidth(800);
    render(<SmallScreenGate />);

    await waitFor(() => {
      expect(screen.getByTestId("game-component")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("small-screen-warning"),
    ).not.toBeInTheDocument();
  });

  it("switches to the warning when the window shrinks below 600px", async () => {
    setWidth(800);
    render(<SmallScreenGate />);
    await waitFor(() => {
      expect(screen.getByTestId("game-component")).toBeInTheDocument();
    });

    act(() => {
      setWidth(500);
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("small-screen-warning")).toBeInTheDocument();
    });
  });

  it("switches back to the game when the window grows to 600px", async () => {
    setWidth(500);
    render(<SmallScreenGate />);
    await waitFor(() => {
      expect(screen.getByTestId("small-screen-warning")).toBeInTheDocument();
    });

    act(() => {
      setWidth(600);
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("game-component")).toBeInTheDocument();
    });
  });
});
