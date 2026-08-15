"use client";

import { useEffect } from "react";

/**
 * Scrolls the just-submitted row (identified by the #score-<id> fragment)
 * into view and highlights it. The response carries no playerId — the
 * fragment is the only identity signal, set by the submit flow.
 */
export default function HighlightOwnRow() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#score-")) return;
    const row = document.getElementById(hash.slice(1));
    if (row) {
      row.scrollIntoView({ block: "center" });
      row.classList.add("bg-game-bg-tertiary");
    }
  }, []);
  return null;
}
