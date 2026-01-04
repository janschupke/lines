import React from "react";

const SmallScreenWarning: React.FC = () => {
  return (
    <div className="min-h-screen bg-game-gradient-primary text-game-text-primary p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-game-surface-primary rounded-lg p-6 shadow-lg border border-game-border-primary">
          <div className="text-4xl mb-4 flex justify-center">
            <img src="/favicon.svg" alt="Ball" className="w-32 h-32" />
          </div>
          <p className="text-game-text-secondary mb-4">
            These balls are too big for your screen, and require a screen width
            of at least 600px.
          </p>
          <div className="text-game-text-secondary">
            Current screen width:{" "}
            <span className="font-mono">{window.innerWidth}px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmallScreenWarning;
