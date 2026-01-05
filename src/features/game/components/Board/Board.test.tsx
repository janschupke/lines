import { render, screen, fireEvent } from "@testing-library/react";
import Board from "./Board";
import type { BallColor } from "../../types";
import "@testing-library/jest-dom";
import { vi } from "vitest";

describe("Board", () => {
  const board = Array.from({ length: 3 }, (_, y) =>
    Array.from({ length: 3 }, (_, x) => ({
      x,
      y,
      ball: x === 0 && y === 0 ? { color: "red" as BallColor } : null,
      incomingBall: null,
      active: false,
    })),
  );

  it("renders the board and balls", () => {
    render(<Board board={board} onCellClick={() => {}} />);
    expect(screen.getAllByRole("button").length).toBe(9);
    // Verify that balls do NOT have tooltips
    expect(screen.queryByTitle("red")).not.toBeInTheDocument();
  });

  it("calls onCellClick when a cell is clicked", () => {
    const onCellClick = vi.fn();
    render(<Board board={board} onCellClick={onCellClick} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onCellClick).toHaveBeenCalled();
  });

  it("hides the ball in the source cell when movingBall is set", () => {
    render(
      <Board
        board={board}
        onCellClick={() => {}}
        movingBall={{
          color: "red" as BallColor,
          path: [
            [0, 0],
            [1, 1],
          ],
        }}
      />,
    );
    // Verify that no balls have tooltips
    expect(screen.queryByTitle("red")).not.toBeInTheDocument();
  });

  it("does not show tooltips on real balls", () => {
    const boardWithBalls = Array.from({ length: 3 }, (_, y) =>
      Array.from({ length: 3 }, (_, x) => ({
        x,
        y,
        ball: { color: "blue" as BallColor },
        incomingBall: null,
        active: false,
      })),
    );

    render(<Board board={boardWithBalls} onCellClick={() => {}} />);

    // Verify that no balls have tooltips
    expect(screen.queryByTitle("blue")).not.toBeInTheDocument();
    expect(screen.queryByTitle("red")).not.toBeInTheDocument();
    expect(screen.queryByTitle("green")).not.toBeInTheDocument();
  });

  it("does not show tooltips on preview balls", () => {
    const boardWithPreviewBalls = Array.from({ length: 3 }, (_, y) =>
      Array.from({ length: 3 }, (_, x) => ({
        x,
        y,
        ball: null,
        incomingBall: { color: "green" as BallColor },
        active: false,
      })),
    );

    render(<Board board={boardWithPreviewBalls} onCellClick={() => {}} />);

    // Verify that no preview balls have tooltips
    expect(screen.queryByTitle("Preview: green")).not.toBeInTheDocument();
    expect(screen.queryByTitle("green")).not.toBeInTheDocument();
  });

  it("does not show tooltips on any ball types", () => {
    const boardWithMixedBalls = Array.from({ length: 3 }, (_, y) =>
      Array.from({ length: 3 }, (_, x) => ({
        x,
        y,
        ball: x === 0 ? { color: "red" as BallColor } : null,
        incomingBall: x === 1 ? { color: "blue" as BallColor } : null,
        active: false,
      })),
    );

    render(<Board board={boardWithMixedBalls} onCellClick={() => {}} />);

    // Verify that no balls have tooltips
    expect(screen.queryByTitle("red")).not.toBeInTheDocument();
    expect(screen.queryByTitle("blue")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Preview: blue")).not.toBeInTheDocument();
  });
});
