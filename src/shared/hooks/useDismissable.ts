import { useEffect, type RefObject } from "react";
import { useHotkeys } from "./useHotkeys";

/**
 * The two ways a player expects to back out of a surface — Escape, and a
 * click somewhere else — wired from one place so no overlay can forget half
 * of it. Both resolve to `onDismiss`, which must be the NON-destructive
 * branch: backing out of a confirmation never confirms it.
 *
 * `ref` has to enclose the surface AND whatever toggles it. A trigger left
 * outside counts as "somewhere else", so pressing it would dismiss on
 * pointerdown and then re-open on click.
 */
export const useDismissable = (
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
): void => {
  // Registered only while open, so opening puts this layer on top of the
  // stack and it takes Escape ahead of anything already on screen.
  useHotkeys([{ key: "escape", run: onDismiss }], open);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent): void => {
      const element = ref.current;
      if (!element || !(event.target instanceof Node)) return;
      if (!element.contains(event.target)) onDismiss();
    };

    // pointerdown rather than click: a click resolves on release, so a press
    // that starts inside and drifts out would count as an outside click.
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, ref, onDismiss]);
};
