"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SmallScreenWarning } from "@/shared/components/SmallScreenWarning";
import BoardSkeleton from "@/components/BoardSkeleton";

// The game reads localStorage during initial state setup, so it must never
// server-render: the whole game tree is client-only behind this gate.
const Game = dynamic(() => import("@/features/game/components/Game/Game"), {
  ssr: false,
  loading: () => <BoardSkeleton />,
});

function SmallScreenGate() {
  const [showGuide, setShowGuide] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 600);
    };

    // Check initial screen size
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup event listener
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (isSmallScreen) {
    return <SmallScreenWarning key="small-screen" />;
  }

  return <Game key="game" showGuide={showGuide} setShowGuide={setShowGuide} />;
}

export default SmallScreenGate;
