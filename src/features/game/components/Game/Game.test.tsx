import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Game from "./Game";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  localStorage.clear();
  push.mockClear();
  // The ranked probe must fail fast and stay off the network.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("no server"))),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const renderGame = (rankedEnabled: boolean) =>
  render(
    <Game showGuide setShowGuide={vi.fn()} rankedEnabled={rankedEnabled} />,
  );

describe("Game without a database", () => {
  it("hides every ranked surface and never calls the server", () => {
    renderGame(false);
    expect(screen.queryByTestId("mode-chip")).toBeNull();
    expect(screen.queryByTestId("mode-intro")).toBeNull();
    expect(screen.queryByTestId("leaderboard-link")).toBeNull();
    expect(screen.queryByText(/Two ways to play/)).toBeNull();
    expect(screen.queryByText(/leaderboard/i)).toBeNull();
    fireEvent.keyDown(document, { key: "l" });
    expect(push).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows them all when ranked is on", () => {
    renderGame(true);
    expect(screen.getByTestId("mode-chip")).toBeInTheDocument();
    expect(screen.getByTestId("mode-intro")).toBeInTheDocument();
    expect(screen.getByTestId("leaderboard-link")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Two ways to play:" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "l" });
    expect(push).toHaveBeenCalledWith("/leaderboard");
  });
});
