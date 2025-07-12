import { useEffect, useState } from 'react';
import Game, { ToggleBar } from './components/Game';
import ConfigManager from './utils/configManager';
import './index.css';

function App() {
  useEffect(() => {
    // Initialize configuration system
    ConfigManager.getInstance();
  }, []);

  // Move toggle state up to App
  const [showGuide, setShowGuide] = useState(false);
  const [showHighScores, setShowHighScores] = useState(false);

  return (
    <div className="min-h-screen bg-[#23272f] text-white font-sans antialiased">
      <header className="sticky top-0 z-50 bg-[#23272f] w-full flex justify-center items-center min-h-16 shadow-lg pb-2">
        <ToggleBar
          showGuide={showGuide}
          setShowGuide={setShowGuide}
          showHighScores={showHighScores}
          setShowHighScores={setShowHighScores}
        />
      </header>
      <main className="w-full min-h-screen flex flex-col items-center justify-start pt-20 box-border">
        <Game
          showGuide={showGuide}
          setShowGuide={setShowGuide}
          showHighScores={showHighScores}
          setShowHighScores={setShowHighScores}
        />
      </main>
    </div>
  );
}

export default App;
