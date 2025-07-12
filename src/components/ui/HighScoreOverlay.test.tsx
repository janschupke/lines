import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HighScoreOverlay } from "./HighScoreOverlay";
import type { HighScore } from "../../services/HighScoreService";

describe("HighScoreOverlay", () => {
  const mockOnClose = vi.fn();
  const mockHighScores: HighScore[] = [
    {
      score: 1000,
      achievedAt: new Date("2024-01-15"),
      gameDuration: 120,
      playerName: "Player1",
      turnsCount: 25,
      ballsCleared: 50,
      linesPopped: 8,
      longestLinePopped: 7,
      individualBallsPopped: 50,
    },
    {
      score: 800,
      achievedAt: new Date("2024-01-14"),
      gameDuration: 90,
      playerName: "Player2",
      turnsCount: 20,
      ballsCleared: 40,
      linesPopped: 6,
      longestLinePopped: 6,
      individualBallsPopped: 40,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    render(
      <HighScoreOverlay
        isOpen={false}
        onClose={mockOnClose}
        highScores={mockHighScores}
      />,
    );

    expect(screen.queryByText("High Scores")).not.toBeInTheDocument();
  });

  it("renders overlay when isOpen is true", () => {
    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={mockHighScores}
      />,
    );

    expect(screen.getByText("High Scores")).toBeInTheDocument();
  });

  it("displays high scores in table format", () => {
    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={mockHighScores}
      />,
    );

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("Player1")).toBeInTheDocument();
    expect(screen.getByText("Player2")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByText("800")).toBeInTheDocument();
  });

  it("displays empty state when no high scores", () => {
    render(
      <HighScoreOverlay isOpen={true} onClose={mockOnClose} highScores={[]} />,
    );

    expect(screen.getByText("No high scores yet!")).toBeInTheDocument();
    expect(
      screen.getByText("Start playing to set your first record."),
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={mockHighScores}
      />,
    );

    const closeButton = screen.getByRole("button", {
      name: /close high scores/i,
    });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={mockHighScores}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("displays player name as Anonymous when not provided", () => {
    const scoresWithoutNames: HighScore[] = [
      {
        score: 1000,
        achievedAt: new Date("2024-01-15"),
        gameDuration: 120,
        playerName: "",
        ballsCleared: 50,
        turnsCount: 25,
        individualBallsPopped: 50,
        linesPopped: 8,
        longestLinePopped: 7,
      },
    ];

    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={scoresWithoutNames}
      />,
    );

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  it("displays game time in MM:SS format", () => {
    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={mockHighScores}
      />,
    );

    expect(screen.getByText("2:00")).toBeInTheDocument(); // 120 seconds = 2:00
    expect(screen.getByText("1:30")).toBeInTheDocument(); // 90 seconds = 1:30
  });

  it("displays N/A when game time is not provided", () => {
    const scoresWithoutTime: HighScore[] = [
      {
        score: 1000,
        achievedAt: new Date("2024-01-15"),
        gameDuration: 0,
        playerName: "Player1",
        ballsCleared: 50,
        turnsCount: 25,
        individualBallsPopped: 50,
        linesPopped: 8,
        longestLinePopped: 7,
      },
    ];

    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={scoresWithoutTime}
      />,
    );

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("displays statistics when available", () => {
    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={mockHighScores}
      />,
    );
    // Use a function matcher to allow for split text nodes
    const statsMatcher1 = (content, node) => {
      if (!node || !node.textContent) return false;
      const text = node.textContent.trim();
      return text === "25 turns, 8 lines, longest: 7";
    };
    const statsMatcher2 = (content, node) => {
      if (!node || !node.textContent) return false;
      const text = node.textContent.trim();
      return text === "20 turns, 6 lines, longest: 6";
    };
    expect(screen.getByText(statsMatcher1)).toBeInTheDocument();
    expect(screen.getByText(statsMatcher2)).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={mockHighScores}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "high-scores-title");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("applies custom className", () => {
    render(
      <HighScoreOverlay
        isOpen={true}
        onClose={mockOnClose}
        highScores={mockHighScores}
        className="custom-class"
      />,
    );

    const overlay = screen.getByRole("dialog");
    expect(overlay).toHaveClass("custom-class");
  });
});
