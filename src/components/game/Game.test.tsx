import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import Game from "./Game";

// Mock the hooks
vi.mock("../../hooks/useHighScore", () => ({
  useHighScore: () => ({
    highScore: 100,
    currentGameBeatHighScore: false,
    checkAndUpdateHighScore: vi.fn(),
    resetNewHighScoreFlag: vi.fn(),
    resetCurrentGameHighScoreFlag: vi.fn(),
  }),
}));

vi.mock("../../game/state", () => ({
  useGameState: () => [
    {
      board: Array(9).fill(null).map((_, y) => 
        Array(9).fill(null).map((_, x) => ({
          x,
          y,
          ball: null,
          incomingBall: null,
          active: false,
        }))
      ),
      score: 0,
      gameOver: false,
      nextBalls: ["red", "blue", "green"],
      timer: 0,
      timerActive: false,
      movingBall: null,
      movingStep: 0,
      poppingBalls: new Set(),
      hoveredCell: null,
      pathTrail: null,
      notReachable: false,
      showGameEndDialog: false,
      statistics: {
        turnsCount: 0,
        gameDuration: 0,
        linesPopped: 0,
        individualBallsPopped: 0,
        longestLinePopped: 0,
        averageScorePerTurn: 0,
      },
    },
    {
      startNewGame: vi.fn(),
      handleCellClick: vi.fn(),
      handleCellHover: vi.fn(),
      handleCellLeave: vi.fn(),
      handleNewGameFromDialog: vi.fn(),
      handleCloseDialog: vi.fn(),
    },
  ],
}));

describe("Game Component", () => {
  it("renders without crashing", () => {
    const setShowGuide = vi.fn();
    render(<Game showGuide={false} setShowGuide={setShowGuide} />);
    
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(screen.getByText("Next Balls")).toBeInTheDocument();
  });

  it("shows guide when showGuide is true", () => {
    const setShowGuide = vi.fn();
    render(<Game showGuide={true} setShowGuide={setShowGuide} />);
    
    expect(screen.getByText("How to Play")).toBeInTheDocument();
    expect(screen.getByText("Hotkeys:")).toBeInTheDocument();
  });

  it("does not show guide when showGuide is false", () => {
    const setShowGuide = vi.fn();
    render(<Game showGuide={false} setShowGuide={setShowGuide} />);
    
    expect(screen.queryByText("How to Play")).not.toBeInTheDocument();
  });

  it("displays guide content when showGuide is true", () => {
    const setShowGuide = vi.fn();
    render(<Game showGuide={true} setShowGuide={setShowGuide} />);
    
    // Check that the guide is rendered
    expect(screen.getByText("How to Play")).toBeInTheDocument();
    expect(screen.getByText("Scoring:")).toBeInTheDocument();
    expect(screen.getByText("Hotkeys:")).toBeInTheDocument();
  });
}); 
