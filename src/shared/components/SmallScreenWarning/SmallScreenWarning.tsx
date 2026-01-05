import React, { useState, useEffect } from "react";

const SmallScreenWarning: React.FC = () => {
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    // Set initial width
    setScreenWidth(window.innerWidth);

    // Update on resize
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="min-h-screen text-game-text-primary p-4 flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      }}
    >
      <div className="max-w-md mx-auto text-center">
        <div className="bg-game-bg-secondary rounded-lg p-6 shadow-lg border border-game-border-default">
          <div className="text-4xl mb-4 flex justify-center">
            <img src="/favicon.svg" alt="Ball" className="w-32 h-32" />
          </div>
          <p className="text-game-text-secondary mb-4">
            These balls are too big for your screen, and require a screen width
            of at least 600px.
          </p>
          <div className="text-game-text-secondary">
            Current screen width:{" "}
            <span className="font-mono">{screenWidth}px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmallScreenWarning;
