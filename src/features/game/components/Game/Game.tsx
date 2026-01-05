import React, { useState, useCallback, useMemo } from "react";
import { useGameStateManager } from "../../state";
import { useKeyboard } from "@shared/hooks/useKeyboard";
import { useScoreFlash } from "../../hooks/useScoreFlash";
import type { Cell, BallColor } from "../../types";
import { ANIMATION_DURATIONS } from "../../config";
import Board from "../Board/Board";
import GameEndDialog from "@shared/components/GameEndDialog/GameEndDialog";
import Guide from "@shared/components/Guide/Guide";
import FloatingScore from "@shared/components/FloatingScore/FloatingScore";
import GameControls from "./GameControls";
import NextBallsPreview from "./NextBallsPreview";
import ScoreDisplay from "./ScoreDisplay";
import TimerDisplay from "./TimerDisplay";

interface GameProps {
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
  initialBoard?: Cell[][];
  initialNextBalls?: BallColor[];
}

const Game: React.FC<GameProps> = ({
  showGuide,
  setShowGuide,
  initialBoard,
  initialNextBalls,
}) => {
  const [gameState, gameActions] = useGameStateManager(
    initialBoard,
    initialNextBalls,
  );

  // State for fade animations
  const [isGuideClosing, setIsGuideClosing] = useState(false);

  const {
    board,
    score,
    highScore,
    currentGameBeatHighScore,
    selected,
    gameOver,
    nextBalls,
    timer,
    movingBall,
    movingStep,
    poppingBalls,
    hoveredCell,
    pathTrail,
    notReachable,
    showGameEndDialog,
    floatingScores,
    growingBalls,
  } = gameState;

  const {
    startNewGame,
    handleCellClick,
    handleCellHover,
    handleCellLeave,
    handleNewGameFromDialog,
    handleCloseDialog,
  } = gameActions;

  // Score flash animations
  const { scoreFlash, highScoreFlash } = useScoreFlash(score, highScore);

  // Handle guide close with fade out animation
  const handleGuideClose = useCallback(() => {
    setIsGuideClosing(true);
    setTimeout(() => {
      setShowGuide(false);
      setIsGuideClosing(false);
    }, ANIMATION_DURATIONS.FADE); // Match the animation duration
  }, [setShowGuide]);

  // Keyboard event handling
  const keyboardHandlers = useMemo(
    () => ({
      onKeyG: () => {
        if (showGuide) {
          handleGuideClose();
        } else {
          setShowGuide(true);
        }
      },
      onKeyN: () => startNewGame(),
      onKeyEscape: () => {
        if (showGuide) {
          handleGuideClose();
        }
        if (showGameEndDialog) {
          handleCloseDialog();
        }
      },
    }),
    [
      showGuide,
      showGameEndDialog,
      handleGuideClose,
      startNewGame,
      handleCloseDialog,
      setShowGuide,
    ],
  );
  useKeyboard(keyboardHandlers);

  return (
    <div className="flex flex-col items-center">
      {/* Single-line Top Panel */}
      <div
        className="flex items-center w-full relative mb-4 mt-4"
        style={{ maxWidth: "600px" }}
      >
        <GameControls
          onNewGame={startNewGame}
          onToggleGuide={() => setShowGuide(!showGuide)}
          showGuide={showGuide}
        />

        {/* Center: Next Balls - absolutely centered */}
        <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
          <div className="text-game-text-secondary font-semibold mb-2 text-sm">
            Next Balls
          </div>
          <NextBallsPreview nextBalls={nextBalls} />
        </div>

        {/* Right: Score and High Score stacked */}
        <ScoreDisplay
          score={score}
          highScore={highScore}
          scoreFlash={scoreFlash}
          highScoreFlash={highScoreFlash}
        />
      </div>

      {/* Game Board Container with Overlays */}
      <div className="relative" style={{ maxWidth: "600px" }}>
        <div className="game-panel p-4">
          <div className="relative">
            <Board
              board={board}
              onCellClick={handleCellClick}
              movingBall={movingBall}
              poppingBalls={poppingBalls}
              hoveredCell={hoveredCell}
              pathTrail={pathTrail}
              notReachable={notReachable}
              onCellHover={handleCellHover}
              onCellLeave={handleCellLeave}
              selected={selected}
              growingBalls={growingBalls}
              movingStep={movingStep}
            />

            {/* Guide Overlay - exactly same size as board */}
            {(showGuide || isGuideClosing) && (
              <div
                className={`absolute inset-0 bg-slate-800 bg-opacity-95 rounded-xl z-50 p-4 overflow-auto scrollbar-hide ${
                  isGuideClosing ? "animate-in fade-out" : "animate-in fade-in"
                }`}
              >
                <Guide onClose={handleGuideClose} />
              </div>
            )}

            {/* Game End Dialog Overlay - exactly same size as board */}
            {gameOver && (
              <GameEndDialog
                isOpen={showGameEndDialog}
                score={score}
                currentGameBeatHighScore={currentGameBeatHighScore}
                statistics={gameState.statistics}
                timer={gameState.timer}
                onNewGame={handleNewGameFromDialog}
                onClose={handleCloseDialog}
              />
            )}

            {/* Floating Score Animations */}
            {floatingScores?.map((floatingScore) => (
              <FloatingScore
                key={floatingScore.id}
                floatingScore={floatingScore}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Timer and Footer */}
      <div
        className="flex justify-between w-full relative mt-4"
        style={{ maxWidth: "600px" }}
      >
        <div>
          <a
            href="https://github.com/janschupke/lines"
            target="_blank"
            rel="noopener noreferrer"
            className="text-game-text-secondary hover:text-game-text-primary transition-colors"
            title="View on GitHub"
          >
            <svg
              className="w-8 h-8"
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
        </div>
        <TimerDisplay timer={timer} timerActive={gameState.timerActive} />
      </div>
    </div>
  );
};

export default React.memo(Game);
