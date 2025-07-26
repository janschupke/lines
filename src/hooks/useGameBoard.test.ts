import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameBoard } from "./useGameBoard";
import { createEmptyBoard } from "../game/logic/boardManagement";
import type { BallColor } from "../game/types";

describe("useGameBoard", () => {
  describe("initialization", () => {
    it("initializes with default values when no parameters provided", () => {
      const { result } = renderHook(() => useGameBoard());

      expect(result.current.board).toBeDefined();
      expect(result.current.nextBalls).toBeDefined();
      expect(result.current.nextBalls).toHaveLength(3);
      expect(result.current.setNextBalls).toBeDefined();
      expect(result.current.setBoard).toBeDefined();
    });

    it("initializes with provided board and next balls", () => {
      const customBoard = createEmptyBoard();
      const customNextBalls = ["yellow", "purple"] as BallColor[];

      const { result } = renderHook(() =>
        useGameBoard(customBoard, customNextBalls),
      );

      expect(result.current.board).toBeDefined();
      expect(result.current.nextBalls).toEqual(customNextBalls);
    });

    it("creates board with initial balls when no board provided", () => {
      const { result } = renderHook(() => useGameBoard());

      // Should have some real balls placed
      let realBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.current.board[y][x].ball) {
            realBallCount++;
          }
        }
      }

      expect(realBallCount).toBeGreaterThan(0);
    });

    it("places preview balls on board", () => {
      const { result } = renderHook(() => useGameBoard());

      // Should have some incoming balls placed
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.current.board[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }

      expect(incomingBallCount).toBeGreaterThan(0);
    });
  });

  describe("setNextBalls", () => {
    it("updates next balls and board", () => {
      const { result } = renderHook(() => useGameBoard());
      const newNextBalls = ["pink", "black"] as BallColor[];

      act(() => {
        result.current.setNextBalls(newNextBalls);
      });

      expect(result.current.nextBalls).toEqual(newNextBalls);
    });

    it("preserves existing incoming balls when baseBoard provided", () => {
      const { result } = renderHook(() => useGameBoard());
      const newNextBalls = ["pink", "black"] as BallColor[];

      // Create a board with existing incoming balls
      const boardWithIncoming = createEmptyBoard();
      boardWithIncoming[0][0].incomingBall = { color: "red" as BallColor };
      boardWithIncoming[1][1].incomingBall = { color: "blue" as BallColor };

      act(() => {
        result.current.setNextBalls(newNextBalls, boardWithIncoming);
      });

      expect(result.current.nextBalls).toEqual(newNextBalls);
      // Should preserve existing incoming balls
      expect(result.current.board[0][0].incomingBall?.color).toBe("red");
      expect(result.current.board[1][1].incomingBall?.color).toBe("blue");
    });

    it("replaces all incoming balls when no baseBoard provided", () => {
      const { result } = renderHook(() => useGameBoard());
      const newNextBalls = ["pink", "black"] as BallColor[];

      act(() => {
        result.current.setNextBalls(newNextBalls);
      });

      expect(result.current.nextBalls).toEqual(newNextBalls);
      // Should have new incoming balls placed
      let incomingBallCount = 0;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (result.current.board[y][x].incomingBall) {
            incomingBallCount++;
          }
        }
      }

      expect(incomingBallCount).toBeGreaterThan(0);
    });
  });

  describe("setBoard", () => {
    it("updates board directly", () => {
      const { result } = renderHook(() => useGameBoard());
      const newBoard = createEmptyBoard();
      newBoard[0][0].ball = { color: "red" as BallColor };

      act(() => {
        result.current.setBoard(newBoard);
      });

      expect(result.current.board[0][0].ball?.color).toBe("red");
    });
  });
});
