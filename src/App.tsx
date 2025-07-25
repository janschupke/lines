import { useState } from "react";
import Game from "./components/game/Game";

function App() {
  const [showGuide, setShowGuide] = useState(false);

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
