"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { GameController, isGameInProgress } from "@/game/controller";
import {
  GameControllerContext,
  useGameController,
} from "@/game/useGameController";
import { MODE_BLURB } from "@/game/mode";
import { useHotkeys, type Hotkey } from "@/shared/hooks/useHotkeys";
import { useDismissable } from "@/shared/hooks/useDismissable";
import ConfirmDialog from "@/shared/components/ConfirmDialog/ConfirmDialog";
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
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const introRef = useRef<HTMLDivElement>(null);

  useDismissable(snapshot.showModeIntro, introRef, () =>
    controller.dismissModeIntro(),
  );

  // Guarded against re-entry: the top panel stays clickable behind the
  // dialog, so a second press of New game must not stack another one.
  const requestNewGame = useCallback(() => {
    if (confirmNewGame) return;
    if (isGameInProgress(controller.getSnapshot())) setConfirmNewGame(true);
    else controller.newGame();
  }, [confirmNewGame, controller]);

  // The base layer. Overlays register above this and take Escape first.
  const hotkeys = useMemo<Hotkey[]>(
    () => [
      {
        key: "g",
        description: "Show or hide this guide",
        run: () => setShowGuide(!showGuide),
      },
      { key: "n", description: "Start a new game", run: requestNewGame },
      {
        key: "l",
        description: "Open the leaderboard",
        run: () => router.push("/leaderboard"),
      },
      {
        key: "escape",
        description: "Close whatever is open",
        run: () => {
          if (controller.getSnapshot().dialogOpen) controller.closeDialog();
        },
      },
    ],
    [showGuide, setShowGuide, requestNewGame, controller, router],
  );
  useHotkeys(hotkeys);

  // The guide claims Escape for itself while it is up. It needs its own layer
  // rather than a branch in the base handler: layers are ordered by when they
  // opened, so a guide raised OVER the end-of-game dialog closes the guide,
  // where a shared handler would always favour whichever branch came first.
  const guideHotkeys = useMemo<Hotkey[]>(
    () => [{ key: "escape", run: () => setShowGuide(false) }],
    [setShowGuide],
  );
  useHotkeys(guideHotkeys, showGuide);

  return (
    <div className="game-page">
      {/* Single-line Top Panel */}
      <div className="top-panel game-chrome flex items-center relative mb-4 mt-4">
        <GameControls
          onNewGame={requestNewGame}
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

      {/* One-time mode intro */}
      {snapshot.showModeIntro && (
        <div className="game-chrome mb-2" ref={introRef}>
          <div
            className="game-panel p-3 text-sm text-game-text-secondary flex items-start gap-3"
            data-testid="mode-intro"
          >
            <div>
              Two ways to play. <b>Ranked</b>: {MODE_BLURB.ranked} <b>Casual</b>
              : {MODE_BLURB.casual}
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
                className="game-overlay p-4 overflow-auto scrollbar-hide animate-in fade-in"
                role="dialog"
                aria-modal="true"
                aria-label="Game guide"
              >
                <Guide onClose={() => setShowGuide(false)} hotkeys={hotkeys} />
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

            <ConfirmDialog
              open={confirmNewGame}
              title="Start a new game?"
              testId="confirm-new-game"
              cancelTestId="new-game-keep"
              confirmTestId="new-game-confirm"
              cancelLabel="Keep playing"
              confirmLabel="Start a new game"
              onCancel={() => setConfirmNewGame(false)}
              onConfirm={() => {
                setConfirmNewGame(false);
                controller.newGame();
              }}
            >
              <p className="mb-3">
                This game is still going. Starting a new one clears the board
                and the{" "}
                <span className="text-game-text-accent font-bold">
                  {snapshot.score}
                </span>{" "}
                points you&apos;ve scored.
              </p>
            </ConfirmDialog>

            {/* Floating Score Animations */}
            {snapshot.anim.floating.map((floating) => (
              <FloatingScore key={floating.id} floating={floating} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer: source link, the mode chip, the clock */}
      <div className="page-footer game-chrome flex items-center justify-between relative mt-4">
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/janschupke/lines"
            target="_blank"
            rel="noopener noreferrer"
            className="text-game-text-secondary hover:text-game-text-primary transition-colors"
            title="View on GitHub"
            aria-label="View on GitHub"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <span className="text-game-text-secondary text-sm">
            {!snapshot.persistenceAvailable &&
              "Storage unavailable — progress won't be saved"}
          </span>
        </div>

        <div className="panel-center">
          <ModeChip />
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
