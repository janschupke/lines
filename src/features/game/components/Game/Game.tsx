"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { GameController } from "@/game/controller";
import {
  GameControllerContext,
  useGameController,
} from "@/game/useGameController";
import { useKeyboard } from "@/shared/hooks/useKeyboard";
import Board from "../Board/Board";
import GameEndDialog from "@/shared/components/GameEndDialog/GameEndDialog";
import Guide from "@/shared/components/Guide/Guide";
import FloatingScore from "@/shared/components/FloatingScore/FloatingScore";
import GameControls from "./GameControls";
import NextBallsPreview from "./NextBallsPreview";
import ScoreDisplay from "./ScoreDisplay";
import TimerDisplay from "./TimerDisplay";

interface GameProps {
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
}

const Game: React.FC<GameProps> = ({ showGuide, setShowGuide }) => {
  const controllerRef = useRef<GameController | null>(null);
  controllerRef.current ??= new GameController();

  useEffect(() => {
    const controller = controllerRef.current;
    return () => {
      controller?.destroy();
      controllerRef.current = null;
    };
  }, []);

  return (
    <GameControllerContext.Provider value={controllerRef.current}>
      <GameView showGuide={showGuide} setShowGuide={setShowGuide} />
    </GameControllerContext.Provider>
  );
};

const GameView: React.FC<GameProps> = ({ showGuide, setShowGuide }) => {
  const [snapshot, controller] = useGameController();

  const keyboardHandlers = useMemo(
    () => ({
      onKeyG: () => setShowGuide(!showGuide),
      onKeyN: () => controller.newGame(),
      onKeyEscape: () => {
        if (showGuide) setShowGuide(false);
        if (controller.getSnapshot().dialogOpen) controller.closeDialog();
      },
    }),
    [showGuide, setShowGuide, controller],
  );
  useKeyboard(keyboardHandlers);

  return (
    <div className="game-page">
      {/* Single-line Top Panel */}
      <div className="top-panel game-chrome flex items-center relative mb-4 mt-4">
        <GameControls
          onNewGame={() => controller.newGame()}
          onToggleGuide={() => setShowGuide(!showGuide)}
          showGuide={showGuide}
        />

        {/* Center: Next Balls - absolutely centered */}
        <div className="panel-center flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
          <div className="text-game-text-secondary font-semibold mb-2 text-sm">
            Next Balls
          </div>
          <NextBallsPreview preview={snapshot.preview} />
        </div>

        {/* Right: Score and High Score stacked */}
        <ScoreDisplay
          score={snapshot.score}
          highScore={snapshot.highScore}
          scoreFlashId={snapshot.anim.scoreFlashId}
          highScoreBeaten={snapshot.highScoreBeaten}
        />
      </div>

      {/* Game Board Container with Overlays */}
      <div className="board-area">
        <div className="board-frame game-panel p-4">
          <div className="relative h-full w-full">
            <Board />

            {/* Guide Overlay - exactly same size as board */}
            {showGuide && (
              <div
                className="absolute inset-0 bg-slate-800 bg-opacity-95 rounded-xl z-50 p-4 overflow-auto scrollbar-hide animate-in fade-in"
                role="dialog"
                aria-modal="true"
                aria-label="Game guide"
              >
                <Guide onClose={() => setShowGuide(false)} />
              </div>
            )}

            {/* Game End Dialog Overlay - exactly same size as board */}
            {snapshot.over && (
              <GameEndDialog
                isOpen={snapshot.dialogOpen}
                score={snapshot.score}
                currentGameBeatHighScore={snapshot.highScoreBeaten}
                stats={snapshot.stats}
                elapsedMs={snapshot.elapsedMs}
                onNewGame={() => controller.newGame()}
                onClose={() => controller.closeDialog()}
              />
            )}

            {/* Floating Score Animations */}
            {snapshot.anim.floating.map((floating) => (
              <FloatingScore key={floating.id} floating={floating} />
            ))}
          </div>
        </div>
      </div>

      {/* Timer and Footer */}
      <div className="page-footer game-chrome flex items-center justify-between relative mt-4">
        <div className="text-game-text-secondary text-sm">
          {!snapshot.persistenceAvailable &&
            "Storage unavailable — progress won't be saved"}
        </div>
        <TimerDisplay
          elapsedMs={snapshot.elapsedMs}
          timerActive={snapshot.timerActive}
        />
      </div>
    </div>
  );
};

export default Game;
