import { useEffect, useRef } from "react";

export interface Hotkey {
  /** A lowercased `KeyboardEvent.key` — "g", "n", "escape". */
  key: string;
  run: () => void;
  /** Player-facing label. Bindings without one aren't advertised in the guide. */
  description?: string;
}

interface Layer {
  hotkeys: Hotkey[];
}

/**
 * Mount-ordered stack of active binding sets. The last entry is the topmost
 * surface on screen, and it gets first refusal on every key.
 */
const stack: Layer[] = [];

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable);

const onKeyDown = (event: KeyboardEvent): void => {
  if (isTypingTarget(event.target)) return;
  // Chords belong to the browser and the OS. A bare "n" is a new game; Cmd-N
  // is a new window and must pass straight through.
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const key = event.key.toLowerCase();
  // Walk top down and stop at the first match: the topmost layer CLAIMS the
  // key. This single rule is the whole point of the stack — the flat listener
  // this replaced handed every key to every consumer at once, so an overlay
  // could never take Escape without the layer underneath also acting on it.
  for (let i = stack.length - 1; i >= 0; i--) {
    const hit = stack[i]?.hotkeys.find((hotkey) => hotkey.key === key);
    if (hit) {
      event.preventDefault();
      hit.run();
      return;
    }
  }
};

/**
 * Registers a set of hotkeys for as long as the caller is mounted and
 * `enabled`. One document listener is shared by every layer, attached with
 * the first registration and released with the last.
 *
 * The `hotkeys` array does NOT need to be memoised — its contents are read
 * live, and only `enabled` re-orders the stack.
 */
export const useHotkeys = (hotkeys: Hotkey[], enabled = true): void => {
  const layerRef = useRef<Layer>({ hotkeys });

  // Refresh the bindings in place. Re-registering on every change would pop
  // this layer back to the top of the stack and steal keys from whatever
  // opened above it.
  useEffect(() => {
    layerRef.current.hotkeys = hotkeys;
  }, [hotkeys]);

  useEffect(() => {
    if (!enabled) return;
    const layer = layerRef.current;
    stack.push(layer);
    if (stack.length === 1) document.addEventListener("keydown", onKeyDown);

    return () => {
      const index = stack.indexOf(layer);
      if (index !== -1) stack.splice(index, 1);
      if (stack.length === 0)
        document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);
};
