"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { GameController, UiSnapshot } from "./controller";

export const GameControllerContext = createContext<GameController | null>(null);

export function useGameController(): readonly [UiSnapshot, GameController] {
  const controller = useContext(GameControllerContext);
  if (!controller) {
    throw new Error("useGameController: no GameControllerContext provider");
  }
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  return [snapshot, controller] as const;
}
