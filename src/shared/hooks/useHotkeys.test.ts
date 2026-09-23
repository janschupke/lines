import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHotkeys } from "./useHotkeys";

const press = (key: string): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
};

const pressFrom = (element: Element, key: string): void => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
};

describe("useHotkeys", () => {
  let run: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    run = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("runs the binding whose key was pressed", () => {
    renderHook(() => useHotkeys([{ key: "n", run }]));
    press("n");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("matches the key case-insensitively", () => {
    renderHook(() => useHotkeys([{ key: "n", run }]));
    press("N");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("ignores keys it has no binding for", () => {
    renderHook(() => useHotkeys([{ key: "n", run }]));
    press("q");
    expect(run).not.toHaveBeenCalled();
  });

  it("claims the key it handled so the browser default doesn't also fire", () => {
    renderHook(() => useHotkeys([{ key: "n", run }]));
    expect(press("n").defaultPrevented).toBe(true);
  });

  it("leaves an unhandled key alone", () => {
    renderHook(() => useHotkeys([{ key: "n", run }]));
    expect(press("q").defaultPrevented).toBe(false);
  });

  describe("layering", () => {
    it("gives the key to the layer that registered last, and only to it", () => {
      const base = vi.fn();
      const overlay = vi.fn();
      renderHook(() => useHotkeys([{ key: "escape", run: base }]));
      renderHook(() => useHotkeys([{ key: "escape", run: overlay }]));

      press("escape");

      expect(overlay).toHaveBeenCalledTimes(1);
      expect(base).not.toHaveBeenCalled();
    });

    it("hands the key back to the layer underneath once the top one unmounts", () => {
      const base = vi.fn();
      const overlay = vi.fn();
      renderHook(() => useHotkeys([{ key: "escape", run: base }]));
      const top = renderHook(() =>
        useHotkeys([{ key: "escape", run: overlay }]),
      );

      top.unmount();
      press("escape");

      expect(base).toHaveBeenCalledTimes(1);
      expect(overlay).not.toHaveBeenCalled();
    });

    it("falls through to a lower layer for a key the top one doesn't bind", () => {
      const base = vi.fn();
      renderHook(() => useHotkeys([{ key: "n", run: base }]));
      renderHook(() => useHotkeys([{ key: "escape", run: vi.fn() }]));

      press("n");

      expect(base).toHaveBeenCalledTimes(1);
    });

    it("puts a layer on top when it becomes enabled, not when it mounted", () => {
      const base = vi.fn();
      const overlay = vi.fn();
      renderHook(() => useHotkeys([{ key: "escape", run: overlay }], false));
      renderHook(() => useHotkeys([{ key: "escape", run: base }]));

      press("escape");
      expect(base).toHaveBeenCalledTimes(1);
      expect(overlay).not.toHaveBeenCalled();
    });
  });

  it("does not register while disabled", () => {
    renderHook(() => useHotkeys([{ key: "n", run }], false));
    press("n");
    expect(run).not.toHaveBeenCalled();
  });

  it("stops listening once unmounted", () => {
    const { unmount } = renderHook(() => useHotkeys([{ key: "n", run }]));
    unmount();
    press("n");
    expect(run).not.toHaveBeenCalled();
  });

  it("reads the latest bindings without the caller memoising them", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ handler }: { handler: () => void }) =>
        useHotkeys([{ key: "n", run: handler }]),
      { initialProps: { handler: first } },
    );

    rerender({ handler: second });
    press("n");

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  describe("typing", () => {
    it.each(["input", "textarea", "select"])(
      "stays out of the way while the player is typing in a %s",
      (tag) => {
        const element = document.createElement(tag);
        document.body.appendChild(element);
        renderHook(() => useHotkeys([{ key: "n", run }]));

        pressFrom(element, "n");

        expect(run).not.toHaveBeenCalled();
      },
    );

    it("stays out of the way in a contenteditable element", () => {
      const element = document.createElement("div");
      element.contentEditable = "true";
      // jsdom doesn't derive isContentEditable from the attribute.
      Object.defineProperty(element, "isContentEditable", { value: true });
      document.body.appendChild(element);
      renderHook(() => useHotkeys([{ key: "n", run }]));

      pressFrom(element, "n");

      expect(run).not.toHaveBeenCalled();
    });
  });

  describe("modifiers", () => {
    it.each(["ctrlKey", "metaKey", "altKey"])(
      "lets a %s chord through to the browser",
      (modifier) => {
        renderHook(() => useHotkeys([{ key: "n", run }]));
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "n", [modifier]: true }),
        );
        expect(run).not.toHaveBeenCalled();
      },
    );
  });
});
