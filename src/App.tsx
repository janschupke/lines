import { useEffect, useState } from 'react';
import Game, { ToggleBar } from './components/Game';
import styled, { createGlobalStyle } from 'styled-components';
import ConfigManager from './utils/configManager';

const GlobalStyle = createGlobalStyle`
  :root {
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;
    color-scheme: light dark;
    color: rgba(255, 255, 255, 0.87);
    background-color: #23272f;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    background: #23272f;
  }
  a {
    font-weight: 500;
    color: #646cff;
    text-decoration: inherit;
  }
  a:hover {
    color: #535bf2;
  }
  h1 {
    font-size: 3.2em;
    line-height: 1.1;
  }
  button {
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: #1a1a1a;
    cursor: pointer;
    transition: border-color 0.25s;
  }
  button:hover {
    border-color: #646cff;
  }
  button:focus,
  button:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }
`;

const StickyHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: #23272f;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 64px;
  box-shadow: 0 2px 8px #0002;
  padding: 0 0 8px 0;
`;

const MainContent = styled.main`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 80px; /* Height of sticky header + some gap */
  box-sizing: border-box;
`;

function App() {
  useEffect(() => {
    // Initialize configuration system
    ConfigManager.getInstance();
  }, []);

  // Move toggle state up to App
  const [showGuide, setShowGuide] = useState(false);
  const [showHighScores, setShowHighScores] = useState(false);

  return (
    <>
      <GlobalStyle />
      <StickyHeader>
        <ToggleBar
          showGuide={showGuide}
          setShowGuide={setShowGuide}
          showHighScores={showHighScores}
          setShowHighScores={setShowHighScores}
        />
      </StickyHeader>
      <MainContent>
        <Game
          showGuide={showGuide}
          setShowGuide={setShowGuide}
          showHighScores={showHighScores}
          setShowHighScores={setShowHighScores}
        />
      </MainContent>
    </>
  );
}

export default App;
