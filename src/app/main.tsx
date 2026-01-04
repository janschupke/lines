/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import Game from "@features/game/components/Game/Game";
import "../index.css";

function App() {
  const [showGuide, setShowGuide] = React.useState(false);

  return <Game showGuide={showGuide} setShowGuide={setShowGuide} />;
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
