import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import GameShell from "./GameShell";

// Mock next/dynamic to resolve the Game mock synchronously
vi.mock("next/dynamic", () => ({
  default: () => {
    const MockGame = () => <div data-testid="game-component">Game</div>;
    return MockGame;
  },
}));

describe("GameShell", () => {
  it("renders the game at any width — the sub-600px gate is gone", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 320,
    });
    render(<GameShell />);
    await waitFor(() => {
      expect(screen.getByTestId("game-component")).toBeInTheDocument();
    });
  });
});
