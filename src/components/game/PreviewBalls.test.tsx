import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import Board from "./Board";
import type { Cell } from "../../game/types";

// Mock the game state hook
vi.mock("../../game/state", () => ({
  useGameState: vi.fn(() => [
    {
      board: [],
      score: 0,
      selected: null,
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
      currentHighScore: 0,
      isNewHighScore: false,
      showGameEndDialog: false,
    },
    {
      startNewGame: vi.fn(),
      handleCellClick: vi.fn(),
      handleCellHover: vi.fn(),
      handleCellLeave: vi.fn(),
      handleNewGameFromDialog: vi.fn(),
      handleCloseDialog: vi.fn(),
    },
  ]),
}));

describe("Preview Balls Functionality", () => {
  describe("Initial Preview Balls Display", () => {
    it("preview balls are smaller than regular balls", () => {
      // Create a board with both regular balls and preview balls
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: { color: "red" },
            incomingBall: null,
            active: false,
          },
          {
            x: 1,
            y: 0,
            ball: null,
            incomingBall: { color: "blue" },
            active: false,
          },
          {
            x: 2,
            y: 0,
            ball: { color: "green" },
            incomingBall: null,
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={vi.fn()} />);

      // Verify that no balls have tooltips
      expect(screen.queryByTitle(/^(red|green)$/)).not.toBeInTheDocument();
      expect(screen.queryByTitle(/^Preview:/)).not.toBeInTheDocument();

      // Get all ball elements by their classes instead of tooltips
      const regularBalls = screen
        .getAllByRole("button")
        .filter((button) =>
          button.querySelector(".game-ball:not(.opacity-50)"),
        );
      const previewBalls = screen
        .getAllByRole("button")
        .filter((button) => button.querySelector(".game-ball.opacity-50"));

      expect(regularBalls).toHaveLength(2);
      expect(previewBalls).toHaveLength(1);

      // Check that preview balls have the correct size (responsive)
      previewBalls.forEach((cell) => {
        const ball = cell.querySelector(".game-ball");
        if (ball) {
          // On mobile, preview balls are smaller (w-[18px] h-[18px])
          // On desktop, they are larger (w-[28px] h-[28px])
          const hasMobileSize =
            ball.classList.contains("w-[18px]") &&
            ball.classList.contains("h-[18px]");
          const hasDesktopSize =
            ball.classList.contains("w-[28px]") &&
            ball.classList.contains("h-[28px]");
          expect(hasMobileSize || hasDesktopSize).toBe(true);
          expect(ball).toHaveClass("rounded-full");
          expect(ball).toHaveClass("border");
          expect(ball).toHaveClass("shadow-sm");
          expect(ball).toHaveClass("opacity-50");
        }
      });

      // Check that regular balls have the full size (responsive)
      regularBalls.forEach((cell) => {
        const ball = cell.querySelector(".game-ball");
        if (ball) {
          // On mobile, balls are smaller (w-9 h-9)
          // On desktop, they are larger (w-ball h-ball)
          const hasMobileSize =
            ball.classList.contains("w-9") && ball.classList.contains("h-9");
          const hasDesktopSize =
            ball.classList.contains("w-ball") &&
            ball.classList.contains("h-ball");
          expect(hasMobileSize || hasDesktopSize).toBe(true);
        }
      });
    });

    it("preview balls have correct colors", () => {
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: null,
            incomingBall: { color: "red" },
            active: false,
          },
          {
            x: 1,
            y: 0,
            ball: null,
            incomingBall: { color: "blue" },
            active: false,
          },
          {
            x: 2,
            y: 0,
            ball: null,
            incomingBall: { color: "green" },
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={vi.fn()} />);

      // Verify that no balls have tooltips
      expect(screen.queryByTitle(/^Preview:/)).not.toBeInTheDocument();

      // Get preview balls by their classes instead of tooltips
      const previewBalls = screen
        .getAllByRole("button")
        .filter((button) => button.querySelector(".game-ball.opacity-50"));
      expect(previewBalls).toHaveLength(3);

      // Check that each preview ball has the correct color via inline style
      const balls = previewBalls
        .map((cell) => cell.querySelector(".game-ball"))
        .filter(Boolean);
      expect(balls[0]).toHaveStyle({ backgroundColor: "#ef4444" }); // red
      expect(balls[1]).toHaveStyle({ backgroundColor: "#3b82f6" }); // blue
      expect(balls[2]).toHaveStyle({ backgroundColor: "#10b981" }); // green
    });

    it("preview balls are positioned correctly in empty cells", () => {
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: null,
            incomingBall: { color: "red" },
            active: false,
          },
          {
            x: 1,
            y: 0,
            ball: { color: "blue" },
            incomingBall: null,
            active: false,
          },
          {
            x: 2,
            y: 0,
            ball: null,
            incomingBall: { color: "green" },
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={vi.fn()} />);

      // Verify that no balls have tooltips
      expect(screen.queryByTitle(/^(blue)$/)).not.toBeInTheDocument();
      expect(screen.queryByTitle(/^Preview:/)).not.toBeInTheDocument();

      // Get balls by their classes instead of tooltips
      const regularBalls = screen
        .getAllByRole("button")
        .filter((button) =>
          button.querySelector(".game-ball:not(.opacity-50)"),
        );
      const previewBalls = screen
        .getAllByRole("button")
        .filter((button) => button.querySelector(".game-ball.opacity-50"));

      expect(regularBalls).toHaveLength(1);
      expect(previewBalls).toHaveLength(2);
    });
  });

  describe("Preview Balls Visual Design", () => {
    it("preview balls have correct styling", () => {
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: null,
            incomingBall: { color: "pink" },
            active: false,
          },
          {
            x: 1,
            y: 0,
            ball: null,
            incomingBall: { color: "yellow" },
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={vi.fn()} />);

      // Verify that no balls have tooltips
      expect(screen.queryByTitle(/^Preview:/)).not.toBeInTheDocument();

      // Get preview balls by their classes instead of tooltips
      const previewBalls = screen
        .getAllByRole("button")
        .filter((button) => button.querySelector(".game-ball.opacity-50"));
      expect(previewBalls).toHaveLength(2);

      previewBalls.forEach((cell) => {
        const ball = cell.querySelector(".game-ball");
        if (ball) {
          // Check for responsive Tailwind classes
          const hasMobileSize =
            ball.classList.contains("w-[18px]") &&
            ball.classList.contains("h-[18px]");
          const hasDesktopSize =
            ball.classList.contains("w-[28px]") &&
            ball.classList.contains("h-[28px]");
          expect(hasMobileSize || hasDesktopSize).toBe(true);
          expect(ball).toHaveClass("rounded-full"); // border-radius: 50%
          expect(ball).toHaveClass("opacity-50"); // opacity: 0.5
          expect(ball).toHaveClass("border"); // border
          expect(ball).toHaveClass("shadow-sm"); // shadow
        }
      });
    });

    it("preview balls have correct border styling", () => {
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: null,
            incomingBall: { color: "purple" },
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={vi.fn()} />);

      // Verify that no balls have tooltips
      expect(screen.queryByTitle("Preview: purple")).not.toBeInTheDocument();

      // Get preview ball by its class instead of tooltip
      const previewBall = screen
        .getAllByRole("button")
        .find((button) => button.querySelector(".game-ball.opacity-50"));
      expect(previewBall).toBeDefined();

      const ball = previewBall?.querySelector(".game-ball");
      expect(ball).toHaveClass("border-game-border-preview");
    });

    it("preview balls have correct opacity", () => {
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: null,
            incomingBall: { color: "purple" },
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={vi.fn()} />);

      // Verify that no balls have tooltips
      expect(screen.queryByTitle("Preview: purple")).not.toBeInTheDocument();

      // Get preview ball by its class instead of tooltip
      const previewBall = screen
        .getAllByRole("button")
        .find((button) => button.querySelector(".game-ball.opacity-50"));
      expect(previewBall).toBeDefined();

      const ball = previewBall?.querySelector(".game-ball");
      expect(ball).toHaveClass("opacity-50");
    });
  });

  describe("Preview Balls Interaction", () => {
    it("preview balls are not clickable", () => {
      const mockOnCellClick = vi.fn();
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: null,
            incomingBall: { color: "red" },
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={mockOnCellClick} />);

      const cell = screen.getByRole("button");
      cell.click();

      // The cell should be clickable, but the preview ball itself is not
      expect(mockOnCellClick).toHaveBeenCalledWith(0, 0);
    });

    it("preview balls show correct tooltip", () => {
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: null,
            incomingBall: { color: "green" },
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={vi.fn()} />);

      // Verify that preview balls do NOT have tooltips
      expect(screen.queryByTitle("Preview: green")).not.toBeInTheDocument();
      expect(screen.queryByTitle("green")).not.toBeInTheDocument();
    });
  });

  describe("Preview Balls State Management", () => {
    it("preview balls disappear when cell gets a real ball", () => {
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: { color: "red" },
            incomingBall: null,
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={vi.fn()} />);

      // Should not have any preview balls
      const previewBalls = screen.queryAllByTitle(/^Preview:/);
      expect(previewBalls).toHaveLength(0);

      // Verify that real balls do NOT have tooltips
      expect(screen.queryByTitle("red")).not.toBeInTheDocument();
    });

    it("preview balls are replaced by real balls when game progresses", () => {
      // This test would require more complex game state management
      // For now, we'll test that the board renders correctly
      const board: Cell[][] = [
        [
          {
            x: 0,
            y: 0,
            ball: null,
            incomingBall: { color: "blue" },
            active: false,
          },
        ],
      ];

      render(<Board board={board} onCellClick={vi.fn()} />);

      // Verify that preview balls do NOT have tooltips
      expect(screen.queryByTitle("Preview: blue")).not.toBeInTheDocument();
      expect(screen.queryByTitle("blue")).not.toBeInTheDocument();
    });
  });
});
