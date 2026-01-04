import { useState, useEffect } from "react";
import { ErrorBoundary } from "@shared/components";
import { Game } from "@features/game";
import { SmallScreenWarning } from "@shared/components";

function App() {
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
    return <SmallScreenWarning />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-game-gradient-primary text-game-text-primary p-4">
        <div className="max-w-7xl mx-auto">
          <main>
            <Game showGuide={showGuide} setShowGuide={setShowGuide} />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
