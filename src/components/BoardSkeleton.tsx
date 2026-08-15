import React from "react";

// Same 9x9 grid at the same dimensions as the real board, so the
// client-only Game mounts without layout shift.
const BoardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center w-full relative mb-4 mt-4"
        style={{ maxWidth: "600px", minHeight: "64px" }}
      />
      <div className="relative" style={{ maxWidth: "600px" }}>
        <div className="game-panel p-4">
          <div
            className="game-board grid p-board-padding mx-auto w-fit h-fit box-content gap-gap"
            style={{
              gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
              gridTemplateRows: "repeat(9, minmax(0, 1fr))",
            }}
          >
            {Array.from({ length: 81 }, (_, i) => (
              <div
                key={i}
                className="game-cell w-cell h-cell bg-game-bg-cell-empty border-game-border-default relative flex items-center justify-center"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardSkeleton;
