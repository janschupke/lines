import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { useDismissable } from "./useDismissable";

describe("useDismissable", () => {
  let surface: HTMLDivElement;
  let outside: HTMLButtonElement;
  let ref: ReturnType<typeof createRef<HTMLElement>>;
  let onDismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    surface = document.createElement("div");
    const inner = document.createElement("button");
    surface.appendChild(inner);
    outside = document.createElement("button");
    document.body.append(surface, outside);

    ref = createRef<HTMLElement>();
    ref.current = surface;
    onDismiss = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // jsdom ships no PointerEvent constructor; the listener only reads .target,
  // so a plain event of the same type exercises the identical path.
  const pointerDownOn = (target: Element): void => {
    target.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  };

  it("dismisses on a pointer press outside the surface", () => {
    renderHook(() => useDismissable(true, ref, onDismiss));
    pointerDownOn(outside);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("stays put when the press lands inside the surface", () => {
    renderHook(() => useDismissable(true, ref, onDismiss));
    pointerDownOn(surface.firstElementChild!);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("dismisses on Escape", () => {
    renderHook(() => useDismissable(true, ref, onDismiss));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does nothing at all while closed", () => {
    renderHook(() => useDismissable(false, ref, onDismiss));
    pointerDownOn(outside);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("lets go of both listeners when it closes", () => {
    const { rerender } = renderHook(
      ({ open }: { open: boolean }) => useDismissable(open, ref, onDismiss),
      { initialProps: { open: true } },
    );

    rerender({ open: false });
    pointerDownOn(outside);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("takes Escape ahead of a surface that was already open", () => {
    const underneath = vi.fn();
    const underneathRef = createRef<HTMLElement>();
    underneathRef.current = document.createElement("div");
    renderHook(() => useDismissable(true, underneathRef, underneath));
    renderHook(() => useDismissable(true, ref, onDismiss));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(underneath).not.toHaveBeenCalled();
  });
});
