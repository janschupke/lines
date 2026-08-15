import React from "react";

// Same page structure at the same dimensions as the real game — INCLUDING
// the mode-chip row and footer. The board sizes itself from the leftover
// height, so a skeleton missing a row renders a different-sized board and
// the page jumps when the real Game mounts.
const BoardSkeleton: React.FC = () => {
  return (
    <div className="game-page">
      <div
        className="top-panel game-chrome flex items-center relative mb-4 mt-4"
        style={{ minHeight: "64px" }}
      />
      <div
        className="mode-chip-row game-chrome flex justify-center mb-2 relative"
        style={{ minHeight: "30px" }}
      />
      <div className="board-area">
        <div className="board-frame game-panel p-4">
          <div className="relative h-full w-full">
            <div
              className="game-board board-grid"
              style={{
                gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
                gridTemplateRows: "repeat(9, minmax(0, 1fr))",
              }}
            >
              {Array.from({ length: 81 }, (_, i) => (
                <div
                  key={i}
                  className="game-cell relative flex items-center justify-center bg-game-bg-cell-empty border-game-border-default"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        className="page-footer game-chrome flex items-center justify-between relative mt-4"
        style={{ minHeight: "32px" }}
      />
    </div>
  );
};

export default BoardSkeleton;
