import { useState } from 'react';
import Game from './ui/components/Game';
import ToggleBar from './ui/components/ToggleBar';

function App() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="min-h-screen bg-game-bg-primary text-game-text-primary p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-game-text-accent mb-2">Lines</h1>
          <ToggleBar
            showGuide={showGuide}
            setShowGuide={setShowGuide}
          />
        </header>
        
        <main>
          <Game
            showGuide={showGuide}
            setShowGuide={setShowGuide}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
