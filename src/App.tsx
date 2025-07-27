import { useState, useEffect } from "react";
import Game from "./components/game/Game";
import SmallScreenWarning from "./components/ui/SmallScreenWarning";

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
    <div className="min-h-screen bg-game-gradient-primary text-game-text-primary p-4">
      <div className="max-w-7xl mx-auto">
        <main>
          <Game showGuide={showGuide} setShowGuide={setShowGuide} />
        </main>
      </div>
    </div>
  );
}

export default App;
