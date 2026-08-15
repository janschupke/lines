"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import ModeChip from "./ModeChip";
import ConnectionOverlays from "./ConnectionOverlays";
import NextBallsPreview from "./NextBallsPreview";
import ScoreDisplay from "./ScoreDisplay";
import TimerDisplay from "./TimerDisplay";

interface GameProps {
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
}

const Game: React.FC<GameProps> = ({ showGuide, setShowGuide }) => {
  const [controller, setController] = useState(() => new GameController());

  useEffect(() => {
    // StrictMode mounts, unmounts and remounts: the first pass destroys its
    // controller in cleanup, so the remount pass MUST mint a fresh one.
    // Rendering against the destroyed store left the app frozen at
    // "checking connection…" with an empty board and dead buttons.
    if (controller.isDestroyed) {
      setController(new GameController());
      return;
    }
    return () => controller.destroy();
  }, [controller]);

  return (
    <GameControllerContext.Provider value={controller}>
      <GameView showGuide={showGuide} setShowGuide={setShowGuide} />
    </GameControllerContext.Provider>
  );
};

const GameView: React.FC<GameProps> = ({ showGuide, setShowGuide }) => {
  const [snapshot, controller] = useGameController();
  const router = useRouter();

  const keyboardHandlers = useMemo(
    () => ({
      onKeyG: () => setShowGuide(!showGuide),
      onKeyN: () => controller.newGame(),
      onKeyL: () => router.push("/leaderboard"),
      onKeyEscape: () => {
        if (showGuide) setShowGuide(false);
        if (controller.getSnapshot().dialogOpen) controller.closeDialog();
      },
    }),
    [showGuide, setShowGuide, controller, router],
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
        <div className="panel-center flex flex-col items-center">
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

      {/* Mode indicator row */}
      <div className="mode-chip-row game-chrome flex justify-center mb-2 relative">
        <ModeChip />
      </div>

      {/* One-time mode intro */}
      {snapshot.showModeIntro && (
        <div className="game-chrome mb-2">
          <div
            className="game-panel p-3 text-sm text-game-text-secondary flex items-start gap-3"
            data-testid="mode-intro"
          >
            <div>
              Two ways to play: <b>Casual</b> is instant and works offline; your
              score stays on this device. <b>Ranked</b> is refereed by the
              server and competes for the leaderboard.
            </div>
            <button
              className="game-button game-button-primary px-3 py-1 shrink-0"
              onClick={() => controller.dismissModeIntro()}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Game Board Container with Overlays */}
      <div className="board-area">
        <div className="board-frame game-panel p-4">
          <div className="relative h-full w-full">
            <Board />

            {/* Guide Overlay - exactly same size as board */}
            {showGuide && (
              <div
                className="game-overlay absolute inset-0 bg-slate-800/95 rounded-xl z-50 p-4 overflow-auto scrollbar-hide animate-in fade-in"
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
                submission={snapshot.submission}
                onSubmit={(name) => void controller.submitScore(name)}
                onRetry={() => controller.retrySubmission()}
                onNewGame={() => controller.newGame()}
                onPlayRanked={() => controller.startRankedGame()}
                onClose={() => controller.closeDialog()}
              />
            )}

            {/* Connection overlays: syncing chip, reconnect panel, gate */}
            <ConnectionOverlays />

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
