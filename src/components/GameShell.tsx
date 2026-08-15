"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import BoardSkeleton from "@/components/BoardSkeleton";

// The game reads localStorage during initial state setup, so it must never
// server-render: the whole game tree is client-only behind this shell.
const Game = dynamic(() => import("@/features/game/components/Game/Game"), {
  ssr: false,
  loading: () => <BoardSkeleton />,
});

function GameShell() {
  const [showGuide, setShowGuide] = useState(false);
  return <Game showGuide={showGuide} setShowGuide={setShowGuide} />;
}

export default GameShell;
