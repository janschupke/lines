import React, { useState } from 'react';
import Game from './components/Game';
import ToggleBar from './components/ui/ToggleBar';

function App() {
  const [showGuide, setShowGuide] = useState(false);
  const [showHighScores, setShowHighScores] = useState(false);

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#ffe082] mb-2 drop-shadow-lg">Lines</h1>
          <ToggleBar
            showGuide={showGuide}
            setShowGuide={setShowGuide}
            showHighScores={showHighScores}
            setShowHighScores={setShowHighScores}
          />
        </header>
        
        <main>
          <Game
            showGuide={showGuide}
            setShowGuide={setShowGuide}
            showHighScores={showHighScores}
            setShowHighScores={setShowHighScores}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
