import React, { useEffect } from 'react';
import Game from './components/Game';
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

const AppContainer = styled.div`
  min-height: 100vh;
  min-width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #23272f;
  padding: 32px;
  box-sizing: border-box;
`;

function App() {
  useEffect(() => {
    // Initialize configuration system
    ConfigManager.getInstance();
  }, []);

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Game />
      </AppContainer>
    </>
  );
}

export default App;
