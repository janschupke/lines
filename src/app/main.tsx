import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import Game from "@features/game/components/Game/Game";
import { SmallScreenWarning } from "@shared/components/SmallScreenWarning";
import "../index.css";

export function App() {
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

// Only render in browser, not in tests
if (typeof window !== "undefined" && import.meta.env.MODE !== "test") {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
