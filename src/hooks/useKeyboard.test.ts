import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboard } from "./useKeyboard";

describe("useKeyboard", () => {
  let mockHandlers: {
    onKeyG?: () => void;
    onKeyN?: () => void;
    onKeyEscape?: () => void;
  };

  beforeEach(() => {
    mockHandlers = {
      onKeyG: vi.fn(),
      onKeyN: vi.fn(),
      onKeyEscape: vi.fn(),
    };
  });

  describe("key handling", () => {
    it("calls onKeyG when G key is pressed", () => {
      renderHook(() => useKeyboard(mockHandlers));

      // Simulate G key press
      const keyEvent = new KeyboardEvent("keydown", { key: "g" });
      document.dispatchEvent(keyEvent);

      expect(mockHandlers.onKeyG).toHaveBeenCalledTimes(1);
    });

    it("calls onKeyN when N key is pressed", () => {
      renderHook(() => useKeyboard(mockHandlers));

      // Simulate N key press
      const keyEvent = new KeyboardEvent("keydown", { key: "n" });
      document.dispatchEvent(keyEvent);

      expect(mockHandlers.onKeyN).toHaveBeenCalledTimes(1);
    });

    it("calls onKeyEscape when Escape key is pressed", () => {
      renderHook(() => useKeyboard(mockHandlers));

      // Simulate Escape key press
      const keyEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(keyEvent);

      expect(mockHandlers.onKeyEscape).toHaveBeenCalledTimes(1);
    });

    it("handles case insensitive key presses", () => {
      renderHook(() => useKeyboard(mockHandlers));

      // Simulate uppercase G key press
      const keyEvent = new KeyboardEvent("keydown", { key: "G" });
      document.dispatchEvent(keyEvent);

      expect(mockHandlers.onKeyG).toHaveBeenCalledTimes(1);
    });

    it("ignores keys that are not handled", () => {
      renderHook(() => useKeyboard(mockHandlers));

      // Simulate unhandled key press
      const keyEvent = new KeyboardEvent("keydown", { key: "a" });
      document.dispatchEvent(keyEvent);

      expect(mockHandlers.onKeyG).not.toHaveBeenCalled();
      expect(mockHandlers.onKeyN).not.toHaveBeenCalled();
      expect(mockHandlers.onKeyEscape).not.toHaveBeenCalled();
    });
  });

  describe("input field handling", () => {
    it("ignores key presses when target is input field", () => {
      renderHook(() => useKeyboard(mockHandlers));

      // Create a mock input element
      const inputElement = document.createElement("input");
      document.body.appendChild(inputElement);

      // Simulate key press with input as target
      const keyEvent = new KeyboardEvent("keydown", { key: "g" });
      Object.defineProperty(keyEvent, "target", {
        value: inputElement,
        writable: false,
      });
      document.dispatchEvent(keyEvent);

      expect(mockHandlers.onKeyG).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(inputElement);
    });

    it("ignores key presses when target is textarea", () => {
      renderHook(() => useKeyboard(mockHandlers));

      // Create a mock textarea element
      const textareaElement = document.createElement("textarea");
      document.body.appendChild(textareaElement);

      // Simulate key press with textarea as target
      const keyEvent = new KeyboardEvent("keydown", { key: "n" });
      Object.defineProperty(keyEvent, "target", {
        value: textareaElement,
        writable: false,
      });
      document.dispatchEvent(keyEvent);

      expect(mockHandlers.onKeyN).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(textareaElement);
    });

    it("ignores key presses when target is select", () => {
      renderHook(() => useKeyboard(mockHandlers));

      // Create a mock select element
      const selectElement = document.createElement("select");
      document.body.appendChild(selectElement);

      // Simulate key press with select as target
      const keyEvent = new KeyboardEvent("keydown", { key: "Escape" });
      Object.defineProperty(keyEvent, "target", {
        value: selectElement,
        writable: false,
      });
      document.dispatchEvent(keyEvent);

      expect(mockHandlers.onKeyEscape).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(selectElement);
    });
  });

  describe("optional handlers", () => {
    it("works when handlers are not provided", () => {
      const handlersWithoutG = {
        onKeyN: vi.fn(),
        onKeyEscape: vi.fn(),
      };

      renderHook(() => useKeyboard(handlersWithoutG));

      // Simulate G key press (should not throw error)
      const keyEvent = new KeyboardEvent("keydown", { key: "g" });
      document.dispatchEvent(keyEvent);

      expect(handlersWithoutG.onKeyN).not.toHaveBeenCalled();
      expect(handlersWithoutG.onKeyEscape).not.toHaveBeenCalled();
    });

    it("works with only some handlers provided", () => {
      const handlersWithOnlyG = {
        onKeyG: vi.fn(),
      };

      renderHook(() => useKeyboard(handlersWithOnlyG));

      // Simulate G key press
      const keyEvent = new KeyboardEvent("keydown", { key: "g" });
      document.dispatchEvent(keyEvent);

      expect(handlersWithOnlyG.onKeyG).toHaveBeenCalledTimes(1);
    });
  });

  describe("event listener management", () => {
    it("adds and removes event listeners correctly", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => useKeyboard(mockHandlers));

      expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
}); 
