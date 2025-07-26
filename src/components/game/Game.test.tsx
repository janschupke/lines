import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Game from "./Game";

// Mock the game state hook
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
      score: 100,
      highScore: 500,
      isNewHighScore: false,
      currentGameBeatHighScore: false,
      gameOver: false,
      nextBalls: ["red", "blue", "green"],
      timer: 60,
      timerActive: true,
      movingBall: null,
      movingStep: 0,
      poppingBalls: new Set(),
      hoveredCell: null,
      pathTrail: null,
      notReachable: false,
      showGameEndDialog: false,
      statistics: {
        turnsCount: 5,
        gameDuration: 60,
        linesPopped: 2,
        individualBallsPopped: 10,
        longestLinePopped: 6,
        averageScorePerTurn: 20,
        totalScore: 100,
        scoreProgression: [50, 50],
        lineScores: [50, 50],
        peakScore: 50,
        consecutiveHighScores: 1,
        ballsCleared: 10,
      },
    },
    {
      startNewGame: vi.fn(),
      handleCellClick: vi.fn(),
      handleCellHover: vi.fn(),
      handleCellLeave: vi.fn(),
      handleNewGameFromDialog: vi.fn(),
      handleCloseDialog: vi.fn(),
      checkAndUpdateHighScore: vi.fn(),
      resetNewHighScoreFlag: vi.fn(),
      resetCurrentGameHighScoreFlag: vi.fn(),
    },
  ],
}));

// Mock the keyboard hook
vi.mock("../../hooks/useKeyboard", () => ({
  useKeyboard: vi.fn(),
}));

describe("Game", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the game board", () => {
    render(<Game showGuide={false} setShowGuide={vi.fn()} />);
    
    // Check that the game board container is rendered
    expect(screen.getByText("Next Balls")).toBeInTheDocument();
  });

  it("displays score and high score", () => {
    render(<Game showGuide={false} setShowGuide={vi.fn()} />);
    
    expect(screen.getByTestId("score-value")).toHaveTextContent("100");
    expect(screen.getByTestId("high-score-value")).toHaveTextContent("500");
  });

  it("displays next balls preview", () => {
    render(<Game showGuide={false} setShowGuide={vi.fn()} />);
    
    expect(screen.getByText("Next Balls")).toBeInTheDocument();
  });



  it("renders New Game button", () => {
    render(<Game showGuide={false} setShowGuide={vi.fn()} />);
    
    const newGameButton = screen.getByTestId("new-game-button");
    expect(newGameButton).toBeInTheDocument();
    // Check that the button has the refresh icon (SVG)
    expect(newGameButton.querySelector("svg")).toBeInTheDocument();
  });

  it("renders New Game button with correct icon", () => {
    render(<Game showGuide={false} setShowGuide={vi.fn()} />);
    
    const newGameButton = screen.getByTestId("new-game-button");
    expect(newGameButton).toBeInTheDocument();
    // Check that the button has the refresh icon (SVG)
    expect(newGameButton.querySelector("svg")).toBeInTheDocument();
    // Check that the button has the correct title
    expect(newGameButton).toHaveAttribute("title", "New Game");
  });
}); 
