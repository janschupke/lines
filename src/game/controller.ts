import {
  applyAction,
  createGame,
  findPath,
  keyedEntropy,
  previewColors,
  reachableFrom,
  viewOf,
  applyEffect,
  COLOR_NAMES,
} from "@/engine";
import type {
  CellIndex,
  ColorName,
  Effect,
  GameAction,
  GameState,
  GameStats,
  KeyedEntropy,
  ViewBoard,
} from "@/engine";
import type { Clock } from "./clock";
import { instantClock, realClock } from "./clock";
import { EffectPlayer, type Overlay } from "./player";
import { defaultTimings } from "./timings";
import { keyFromHex } from "@/engine";
import {
  clearGame,
  isPersistenceAvailable,
  loadGame,
  loadHighScores,
  mintCasualKey,
  saveCasualGame,
  saveHighScore,
} from "./persistence";
import { encodeMoves } from "@/engine";

const INACTIVITY_TIMEOUT_MS = 10_000;
const TIMER_TICK_MS = 1000;

export interface UiSnapshot {
  view: ViewBoard;
  score: number;
  highScore: number;
  highScoreBeaten: boolean;
  stats: GameStats;
  over: boolean;
  preview: readonly ColorName[];
  selected: CellIndex | null;
  hovered: CellIndex | null;
  pathTrail: readonly CellIndex[] | null;
  unreachable: Uint8Array | null;
  anim: Overlay;
  busy: boolean;
  elapsedMs: number;
  timerActive: boolean;
  dialogOpen: boolean;
  persistenceAvailable: boolean;
}

export interface ControllerDeps {
  clock?: Clock;
  /** Overrides the minted key — tests and (later) saved games. */
  key?: Uint8Array;
}

/**
 * The store. The state is final before the first spawn pixel animates, and
 * the deterministic prefix is final before the first pixel of any kind.
 * Testable in vitest under a fake clock with zero React.
 */
export class GameController {
  private readonly clock: Clock;
  private entropy: KeyedEntropy;
  private state: GameState;
  private view: ViewBoard;
  private readonly player: EffectPlayer;

  private selected: CellIndex | null = null;
  private hovered: CellIndex | null = null;
  private pathTrail: readonly CellIndex[] | null = null;
  private unreachable: Uint8Array | null = null;
  private dialogOpen = false;
  private highScore: number;

  private elapsedMs = 0;
  private timerActive = false;
  private lastActivityAt = 0;
  private timerCancel: (() => void) | null = null;

  private key: Uint8Array;
  private moves: GameAction[] = [];
  private startedAt: number;

  private listeners = new Set<() => void>();
  private snapshot: UiSnapshot | null = null;

  constructor(deps: ControllerDeps = {}) {
    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.clock = deps.clock ?? (prefersReduced ? instantClock : realClock);
    this.highScore = loadHighScores().casual;
    this.startedAt = Date.now();

    // Resume the saved game if one replays cleanly; otherwise start fresh.
    const resumed = deps.key ? null : loadGame();
    if (resumed && resumed.saved.mode === "casual" && !resumed.state.over) {
      this.key = keyFromHex(resumed.saved.key);
      this.moves = resumed.moves;
      this.startedAt = resumed.saved.startedAt;
      this.elapsedMs = resumed.saved.elapsedMs;
      // continue the draw stream from the next turn
      this.entropy = keyedEntropy(this.key, resumed.state.moveCount);
      this.state = resumed.state;
    } else {
      this.key = deps.key ?? mintCasualKey();
      this.entropy = keyedEntropy(this.key);
      this.state = createGame(this.entropy);
      this.saveNow();
    }
    this.view = viewOf(this.state);
    this.player = new EffectPlayer(this.clock, defaultTimings, {
      fold: (e: Effect) => {
        this.view = applyEffect(this.view, e);
        if (e.k === "gameOver") this.dialogOpen = true;
      },
      onChange: () => this.publish(),
    });
    this.scheduleTimerTick();
  }

  // -- store binding --------------------------------------------------------

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): UiSnapshot => {
    if (this.snapshot === null) {
      this.snapshot = {
        view: this.view,
        score: this.state.score,
        highScore: this.highScore,
        highScoreBeaten:
          this.state.score > 0 && this.state.score >= this.highScore,
        stats: this.state.stats,
        over: this.state.over,
        preview: previewColors({ ...this.state, ghosts: this.view.ghosts }).map(
          (c) => COLOR_NAMES[c] as ColorName,
        ),
        selected: this.selected,
        hovered: this.hovered,
        pathTrail: this.pathTrail,
        unreachable: this.unreachable,
        anim: this.player.overlay,
        busy: this.player.busy,
        elapsedMs: this.elapsedMs,
        timerActive: this.timerActive,
        dialogOpen: this.dialogOpen,
        persistenceAvailable: isPersistenceAvailable(),
      };
    }
    return this.snapshot;
  };

  private publish(): void {
    this.snapshot = null;
    for (const fn of this.listeners) fn();
  }

  // -- input ----------------------------------------------------------------

  clickCell(index: CellIndex): void {
    if (this.player.busy || this.state.over) return;
    this.activity();
    if (this.view.balls[index] !== 0) {
      // select / reselect / deselect
      this.selected = this.selected === index ? null : index;
      this.pathTrail = null;
      this.unreachable =
        this.selected === null
          ? null
          : reachableFrom(this.view.balls, this.selected);
      this.publish();
      return;
    }
    if (this.selected === null) return;
    this.tryMove({ t: "move", from: this.selected, to: index });
  }

  hoverCell(index: CellIndex): void {
    if (this.player.busy) return;
    this.hovered = index;
    if (this.selected !== null && this.view.balls[index] === 0) {
      this.pathTrail = findPath(this.view.balls, this.selected, index);
    } else {
      this.pathTrail = null;
    }
    this.publish();
  }

  leaveBoard(): void {
    this.hovered = null;
    this.pathTrail = null;
    this.publish();
  }

  newGame(): void {
    this.player.cancel();
    this.key = mintCasualKey();
    this.moves = [];
    this.startedAt = Date.now();
    this.entropy = keyedEntropy(this.key);
    this.state = createGame(this.entropy);
    this.saveNow();
    this.view = viewOf(this.state);
    this.selected = null;
    this.hovered = null;
    this.pathTrail = null;
    this.unreachable = null;
    this.dialogOpen = false;
    this.elapsedMs = 0;
    this.timerActive = false;
    this.publish();
  }

  closeDialog(): void {
    this.dialogOpen = false;
    this.publish();
  }

  setSpeed(mult: number): void {
    this.player.setSpeed(mult);
  }

  destroy(): void {
    this.player.cancel();
    this.timerCancel?.();
    this.listeners.clear();
  }

  // -- the turn -------------------------------------------------------------

  private tryMove(action: GameAction): void {
    const result = applyAction(this.state, action, this.entropy);
    if (!result.ok) {
      // an illegal destination keeps the selection; nothing else changes
      return;
    }
    // The state is final here, before anything animates — so a
    // mid-animation reload restores the completed turn.
    this.state = result.state;
    this.moves.push(action);
    this.selected = null;
    this.pathTrail = null;
    this.unreachable = null;
    this.hovered = null;
    if (this.state.score > this.highScore) {
      this.highScore = this.state.score;
      saveHighScore("casual", this.highScore);
    }
    if (this.state.over) {
      // game end is the only place the save is cleared
      clearGame();
    } else {
      this.saveNow(); // one write per completed turn
    }
    this.publish();
    this.player.play(result.effects, () => {
      // The fold has reconstructed the final board (property-tested).
      this.publish();
    });
  }

  private saveNow(): void {
    saveCasualGame({
      key: this.key,
      moves: encodeMoves(this.moves),
      startedAt: this.startedAt,
      elapsedMs: this.elapsedMs,
    });
  }

  // -- timer ----------------------------------------------------------------

  private activity(): void {
    this.lastActivityAt = this.elapsedMs;
    if (!this.timerActive && !this.state.over) {
      this.timerActive = true;
    }
  }

  private scheduleTimerTick(): void {
    const tick = () => {
      if (this.timerActive && !this.state.over) {
        this.elapsedMs += TIMER_TICK_MS;
        if (this.elapsedMs - this.lastActivityAt >= INACTIVITY_TIMEOUT_MS) {
          this.timerActive = false;
        }
        this.publish();
      }
      this.timerCancel = this.clock.after(TIMER_TICK_MS, tick);
    };
    // Never tick on the instant clock — it would recurse forever.
    if (this.clock !== instantClock) {
      this.timerCancel = this.clock.after(TIMER_TICK_MS, tick);
    }
  }
}
