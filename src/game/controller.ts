import {
  applyAction,
  createGame,
  findPath,
  keyedEntropy,
  scriptedEntropy,
  previewColors,
  reachableFrom,
  viewOf,
  applyEffect,
  boardHash,
  encodeMoves,
  keyFromHex,
  keyToHex,
  COLOR_NAMES,
  CELL_COUNT,
} from "@/engine";
import type {
  CellIndex,
  ColorName,
  Effect,
  EntropySource,
  GameAction,
  GameState,
  GameStats,
  InitPacket,
  SpawnPacket,
  ViewBoard,
} from "@/engine";
import type { Clock } from "./clock";
import { instantClock, realClock } from "./clock";
import { EffectPlayer, type Overlay } from "./player";
import { defaultTimings } from "./timings";
import {
  clearGame,
  getPlayerId,
  hasSeenModeIntro,
  isPersistenceAvailable,
  loadGame,
  loadHighScores,
  markModeIntroSeen,
  mintCasualKey,
  pushNetOutcome,
  saveCasualGame,
  saveHighScore,
  saveLastName,
  saveModePref,
  saveRankedGame,
} from "./persistence";
import type { GameApi, MoveRequest } from "./api";
import { ApiError } from "./api";
import { httpGameApi } from "./api";
import type { Mode, ModeReason } from "./mode";
import { navigatorInfo, preProbeDecision } from "./mode";
import type { ConnectionState } from "./connection";
import {
  IDLE_CONNECTION,
  GATE_AFTER_FAILURES,
  SYNCING_AFTER_MS,
  backoffDelay,
} from "./connection";

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
  mode: {
    active: Mode;
    reason: ModeReason;
    probing: boolean;
    /** Mid-game Casual -> Ranked is impossible; the reason must be visible. */
    canSwitchToRankedInPlace: boolean;
  };
  connection: ConnectionState;
  showModeIntro: boolean;
  submission: SubmissionState;
}

export interface SubmissionState {
  status:
    | "casual"
    | "checking"
    | "idle"
    | "not-qualified"
    | "unreachable"
    | "submitting"
    | "accepted"
    | "rejected";
  /** Set when a ranked game continued as casual after a switch. */
  switched: boolean;
  threshold: number | null;
  rank: number | null;
  scoreId: string | null;
  errorCode: string | null;
  casualBest: number;
}

export interface ControllerDeps {
  clock?: Clock;
  /** Overrides the minted key — tests. Forces casual, skips the probe. */
  key?: Uint8Array;
  api?: GameApi;
}

interface RankedIdentity {
  gameId: string;
  token: string;
  init: InitPacket;
}

/** Everything before the first entropy-derived effect. */
function deterministicPrefix(effects: readonly Effect[]): Effect[] {
  const cut = effects.findIndex(
    (e) => e.k === "ghostMoved" || e.k === "spawnGhosts" || e.k === "gameOver",
  );
  return cut === -1 ? effects.slice() : effects.slice(0, cut);
}

function entropyTail(effects: readonly Effect[]): Effect[] {
  const cut = effects.findIndex(
    (e) => e.k === "ghostMoved" || e.k === "spawnGhosts" || e.k === "gameOver",
  );
  return cut === -1 ? [] : effects.slice(cut);
}

/** Probe entropy for the optimistic prefix — its spawn output is discarded. */
const probeEntropy: EntropySource = {
  init: () => ({ balls: [], ghosts: [] }),
  spawn: () => ({ ghosts: [] }),
};

/**
 * The store. Casual runs entirely locally on a minted key; Ranked runs the
 * deterministic prefix optimistically and completes the turn when the
 * server's packet arrives. The state is final before the first spawn pixel
 * animates.
 */
export class GameController {
  private readonly clock: Clock;
  private readonly api: GameApi;
  private entropy: EntropySource;
  private state: GameState;
  private view: ViewBoard;
  private readonly player: EffectPlayer;

  private mode: Mode = "casual";
  private modeReason: ModeReason = "checking";
  private probing = false;
  private ranked: RankedIdentity | null = null;
  private localKey: Uint8Array | null = null;
  private packets: SpawnPacket[] = [];
  private connection: ConnectionState = IDLE_CONNECTION;
  private hadReconnect = false;

  private pendingMove: {
    action: GameAction;
    request: MoveRequest;
    prefixDone: boolean;
    tail: Effect[] | null;
  } | null = null;
  private retryCancel: (() => void) | null = null;
  private syncingCancel: (() => void) | null = null;

  private selected: CellIndex | null = null;
  private hovered: CellIndex | null = null;
  private pathTrail: readonly CellIndex[] | null = null;
  private unreachable: Uint8Array | null = null;
  private dialogOpen = false;
  private highScore: number;
  private showModeIntro = false;

  private elapsedMs = 0;
  private timerActive = false;
  private lastActivityAt = 0;
  private timerCancel: (() => void) | null = null;

  private moves: GameAction[] = [];
  private startedAt: number;
  private submission: SubmissionState = idleSubmission();

  private listeners = new Set<() => void>();
  private snapshot: UiSnapshot | null = null;
  private destroyed = false;

  constructor(deps: ControllerDeps = {}) {
    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The scheduling clock (timer ticks, retry backoff) must be real time
    // even under reduced motion — only ANIMATION collapses to instant.
    this.clock = deps.clock ?? realClock;
    const animationClock =
      deps.clock ?? (prefersReduced ? instantClock : realClock);
    this.api = deps.api ?? httpGameApi;
    this.highScore = loadHighScores().casual;
    this.startedAt = Date.now();
    this.showModeIntro = !hasSeenModeIntro();
    this.player = new EffectPlayer(animationClock, defaultTimings, {
      fold: (e: Effect) => {
        this.view = applyEffect(this.view, e);
        if (e.k === "gameOver") this.dialogOpen = true;
      },
      onChange: () => this.publish(),
    });

    // Placeholder empty board while resuming/probing.
    this.state = emptyState();
    this.view = viewOf(this.state);
    this.entropy = probeEntropy;

    if (deps.key) {
      this.beginCasual(deps.key);
    } else if (!this.resume()) {
      this.chooseModeAndStart();
    }
    this.scheduleTimerTick();
  }

  // -- store binding --------------------------------------------------------

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): UiSnapshot => {
    this.snapshot ??= {
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
      busy: this.busy(),
      elapsedMs: this.elapsedMs,
      timerActive: this.timerActive,
      dialogOpen: this.dialogOpen,
      persistenceAvailable: isPersistenceAvailable(),
      mode: {
        active: this.mode,
        reason: this.modeReason,
        probing: this.probing,
        canSwitchToRankedInPlace: this.moves.length === 0 && !this.state.over,
      },
      connection: this.connection,
      showModeIntro: this.showModeIntro,
      submission: this.submission,
    };
    return this.snapshot;
  };

  private publish(): void {
    this.snapshot = null;
    for (const fn of this.listeners) fn();
  }

  private busy(): boolean {
    return this.probing || this.player.busy || this.pendingMove !== null;
  }

  // -- lifecycle ------------------------------------------------------------

  private resume(): boolean {
    const loaded = loadGame();
    if (!loaded || loaded.state.over) return false;
    // The save has no reason string; re-derive it so a resumed casual game
    // still explains itself truthfully (offline, data saver, ...).
    const derived = preProbeDecision(navigatorInfo());
    const casualReason =
      derived.mode === "casual" ? derived.reason : "your-choice";
    if (loaded.saved.mode === "casual") {
      this.mode = "casual";
      this.modeReason = casualReason;
      this.localKey = keyFromHex(loaded.saved.key);
      this.entropy = keyedEntropy(this.localKey, loaded.state.moveCount);
      this.adoptResumed(
        loaded.state,
        loaded.moves,
        loaded.saved.startedAt,
        loaded.saved.elapsedMs,
      );
      return true;
    }
    const saved = loaded.saved as typeof loaded.saved & { localKey?: string };
    this.ranked = {
      gameId: saved.gameId,
      token: saved.token,
      init: saved.init,
    };
    this.packets = saved.packets.slice();
    if (saved.localKey) {
      // a ranked game continued as casual after a switch
      this.mode = "casual";
      this.modeReason = casualReason;
      this.localKey = keyFromHex(saved.localKey);
      this.entropy = keyedEntropy(this.localKey, loaded.state.moveCount);
      this.adoptResumed(
        loaded.state,
        loaded.moves,
        saved.startedAt,
        saved.elapsedMs,
      );
      return true;
    }
    this.mode = "ranked";
    this.modeReason = "connection-good";
    this.entropy = scriptedEntropy(saved.init, []);
    this.adoptResumed(
      loaded.state,
      loaded.moves,
      saved.startedAt,
      saved.elapsedMs,
    );
    void this.reconcile();
    return true;
  }

  private adoptResumed(
    state: GameState,
    moves: GameAction[],
    startedAt: number,
    elapsedMs: number,
  ): void {
    this.state = state;
    this.view = viewOf(state);
    this.moves = moves;
    this.startedAt = startedAt;
    this.elapsedMs = elapsedMs;
    this.publish();
  }

  /** Ranked reload: the local replay is a fast path; the server's board wins. */
  private async reconcile(): Promise<void> {
    if (!this.ranked) return;
    try {
      const remote = await this.api.state(
        this.ranked.gameId,
        this.ranked.token,
      );
      if (this.destroyed) return;
      if (remote.boardHash !== boardHash(this.state)) {
        // engine bug or tampered save: adopt the server board
        this.state = {
          balls: Uint8Array.from(remote.balls),
          ghosts: Uint8Array.from(remote.ghosts),
          score: remote.score,
          moveCount: remote.moveCount,
          over: remote.over,
          stats: remote.stats,
        };
        this.view = viewOf(this.state);
      }
      this.connection = { ...IDLE_CONNECTION, state: "live" };
    } catch {
      if (this.destroyed) return;
      // session expired or unreachable — the gate offers the way out
      this.connection = {
        ...IDLE_CONNECTION,
        state: "reconnecting",
        gateOpen: true,
        gateTrigger: "session-expired",
      };
    }
    this.publish();
  }

  private chooseModeAndStart(): void {
    const decision = preProbeDecision(navigatorInfo());
    if (!decision.probe) {
      this.modeReason = decision.reason;
      this.beginCasual(mintCasualKey());
      return;
    }
    // rule 6/7: /start is the probe
    this.probing = true;
    this.modeReason = "checking";
    this.publish();
    const sticky = decision.reason === "your-choice";
    void this.api
      .start(getPlayerId())
      .then((res) => {
        if (this.destroyed || !this.probing) return;
        this.probing = false;
        this.beginRanked(res, sticky ? "your-choice" : "connection-good");
      })
      .catch(() => {
        if (this.destroyed || !this.probing) return;
        this.probing = false;
        this.modeReason = "server-unreachable";
        this.beginCasual(mintCasualKey());
      });
  }

  private beginCasual(key: Uint8Array): void {
    this.mode = "casual";
    if (this.modeReason === "checking") this.modeReason = "your-choice";
    this.localKey = key;
    this.ranked = null;
    this.packets = [];
    this.moves = [];
    this.startedAt = Date.now();
    this.entropy = keyedEntropy(key);
    this.state = createGame(this.entropy);
    this.view = viewOf(this.state);
    this.connection = IDLE_CONNECTION;
    this.saveNow();
    this.publish();
  }

  private beginRanked(
    res: { gameId: string; token: string; init: InitPacket },
    reason: ModeReason,
  ): void {
    this.mode = "ranked";
    this.modeReason = reason;
    this.ranked = { gameId: res.gameId, token: res.token, init: res.init };
    this.localKey = null;
    this.packets = [];
    this.moves = [];
    this.startedAt = Date.now();
    this.hadReconnect = false;
    this.entropy = scriptedEntropy(res.init, []);
    this.state = createGame(scriptedEntropy(res.init, []));
    this.view = viewOf(this.state);
    this.connection = { ...IDLE_CONNECTION, state: "live" };
    this.saveNow();
    this.publish();
  }

  // -- input ----------------------------------------------------------------

  clickCell(index: CellIndex): void {
    if (this.busy() || this.state.over) return;
    this.activity();
    if (this.view.balls[index] !== 0) {
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
    const action: GameAction = { t: "move", from: this.selected, to: index };
    if (this.mode === "ranked") {
      this.tryMoveRanked(action);
    } else {
      this.tryMoveCasual(action);
    }
  }

  hoverCell(index: CellIndex): void {
    if (this.busy()) return;
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
    this.abandonCurrent();
    this.chooseModeAndStart();
  }

  /** Explicit ranked start — refused (stays casual) if /start fails. */
  startRankedGame(): void {
    this.abandonCurrent();
    this.probing = true;
    this.modeReason = "checking";
    this.publish();
    void this.api
      .start(getPlayerId())
      .then((res) => {
        if (this.destroyed) return;
        this.probing = false;
        saveModePref("ranked");
        this.beginRanked(res, "your-choice");
      })
      .catch(() => {
        if (this.destroyed) return;
        this.probing = false;
        this.modeReason = "server-unreachable";
        this.beginCasual(mintCasualKey());
      });
  }

  startCasualGame(): void {
    this.abandonCurrent();
    saveModePref("casual");
    this.modeReason = "your-choice";
    this.beginCasual(mintCasualKey());
  }

  private abandonCurrent(): void {
    this.submission = idleSubmission();
    this.player.cancel();
    this.cancelRetries();
    this.pendingMove = null;
    this.selected = null;
    this.hovered = null;
    this.pathTrail = null;
    this.unreachable = null;
    this.dialogOpen = false;
    this.elapsedMs = 0;
    this.timerActive = false;
    this.connection = IDLE_CONNECTION;
  }

  closeDialog(): void {
    this.dialogOpen = false;
    this.publish();
  }

  dismissModeIntro(): void {
    this.showModeIntro = false;
    markModeIntroSeen();
    this.publish();
  }

  setSpeed(mult: number): void {
    this.player.setSpeed(mult);
  }

  destroy(): void {
    this.destroyed = true;
    this.player.cancel();
    this.cancelRetries();
    this.timerCancel?.();
    this.listeners.clear();
  }

  // -- the casual turn ------------------------------------------------------

  private tryMoveCasual(action: GameAction): void {
    const result = applyAction(this.state, action, this.entropy);
    if (!result.ok) return;
    this.commitTurn(action, result.state, result.packet);
    this.player.play(result.effects, () => this.publish());
  }

  // -- the ranked turn ------------------------------------------------------

  private tryMoveRanked(action: GameAction): void {
    if (!this.ranked) return;
    // The deterministic prefix — instant, no entropy consumed.
    const probe = applyAction(this.state, action, probeEntropy);
    if (!probe.ok) return;
    const request: MoveRequest = {
      gameId: this.ranked.gameId,
      token: this.ranked.token,
      moveCount: this.state.moveCount,
      from: action.from,
      to: action.to,
      boardHash: boardHash(this.state),
    };
    this.pendingMove = { action, request, prefixDone: false, tail: null };
    this.selected = null;
    this.pathTrail = null;
    this.unreachable = null;
    this.hovered = null;
    this.publish();
    this.player.play(deterministicPrefix(probe.effects), () => {
      if (this.pendingMove?.request === request) {
        this.pendingMove.prefixDone = true;
        this.maybeFinishRankedTurn();
      }
    });
    this.syncingCancel = this.clock.after(SYNCING_AFTER_MS, () => {
      if (
        this.pendingMove?.request === request &&
        this.connection.state === "live"
      ) {
        this.connection = { ...this.connection, state: "syncing" };
        this.publish();
      }
    });
    this.sendMove(request, 0);
  }

  private sendMove(request: MoveRequest, attempt: number): void {
    void this.api
      .move(request)
      .then((res) => {
        if (this.destroyed || this.pendingMove?.request !== request) return;
        const pending = this.pendingMove;
        this.syncingCancel?.();
        // Complete the turn with the server's packet through the SAME engine.
        const scripted = scriptedEntropy({ balls: [], ghosts: [] }, [
          res.packet,
        ]);
        const result = applyAction(this.state, pending.action, scripted);
        if (!result.ok || boardHash(result.state) !== res.boardHash) {
          // divergence is an engine bug; trust the server via reconcile
          this.connection = { ...IDLE_CONNECTION, state: "live" };
          void this.reconcile();
          this.pendingMove = null;
          this.publish();
          return;
        }
        if (this.connection.state === "reconnecting") {
          this.hadReconnect = true;
        }
        this.connection = { ...IDLE_CONNECTION, state: "live" };
        this.commitTurn(pending.action, result.state, res.packet);
        pending.tail = entropyTail(result.effects);
        this.maybeFinishRankedTurn();
      })
      .catch(() => {
        if (this.destroyed || this.pendingMove?.request !== request) return;
        this.syncingCancel?.();
        const attempts = attempt + 1;
        const delay = backoffDelay(attempt);
        this.connection = {
          state: "reconnecting",
          attempt: attempts,
          nextRetryAt: Date.now() + delay,
          gateOpen: attempts >= GATE_AFTER_FAILURES || this.connection.gateOpen,
          gateTrigger:
            attempts >= GATE_AFTER_FAILURES || this.connection.gateOpen
              ? (this.connection.gateTrigger ?? "connection-lost")
              : null,
        };
        this.timerActive = false; // no duration charged for an outage
        this.publish();
        this.retryCancel = this.clock.after(delay, () => {
          if (this.pendingMove?.request === request) {
            // each retry re-POSTs the identical request
            this.sendMove(request, attempts);
          }
        });
      });
  }

  private maybeFinishRankedTurn(): void {
    const pending = this.pendingMove;
    if (!pending || !pending.prefixDone || pending.tail === null) return;
    this.pendingMove = null;
    this.player.play(pending.tail, () => this.publish());
    this.publish();
  }

  private commitTurn(
    action: GameAction,
    next: GameState,
    packet: SpawnPacket,
  ): void {
    this.state = next;
    this.moves.push(action);
    this.packets.push(packet);
    this.selected = null;
    this.pathTrail = null;
    this.unreachable = null;
    this.hovered = null;
    const board = this.mode === "ranked" ? "ranked" : "casual";
    saveHighScore(board, this.state.score);
    if (board === "casual" && this.state.score > this.highScore) {
      this.highScore = this.state.score;
    }
    if (this.state.over) {
      if (this.mode === "ranked") {
        pushNetOutcome(this.hadReconnect ? "reconnected" : "clean");
      }
      clearGame(); // game end is the only place the save is cleared
      this.prepareSubmission();
    } else {
      this.saveNow(); // one write per completed turn
    }
    this.publish();
  }

  /** At game over: only offer the name field when the score can place. */
  private prepareSubmission(): void {
    const casualBest = loadHighScores().casual;
    if (this.mode !== "ranked" || !this.ranked) {
      this.submission = {
        ...idleSubmission(),
        status: "casual",
        switched: this.localKey !== null && this.ranked !== null,
        casualBest,
      };
      return;
    }
    this.submission = { ...idleSubmission(), status: "checking", casualBest };
    void this.api
      .scores()
      .then((res) => {
        if (this.destroyed) return;
        const qualifies =
          res.entries.length < 20 || this.state.score > res.threshold;
        this.submission = {
          ...this.submission,
          status: qualifies ? "idle" : "not-qualified",
          threshold: res.threshold,
        };
        this.publish();
      })
      .catch(() => {
        if (this.destroyed) return;
        this.submission = { ...this.submission, status: "unreachable" };
        this.publish();
      });
  }

  /** Retry from the dialog re-checks and re-offers. */
  retrySubmission(): void {
    if (this.submission.status !== "unreachable") return;
    this.prepareSubmission();
    this.publish();
  }

  async submitScore(name: string): Promise<void> {
    if (!this.ranked || this.mode !== "ranked") return;
    this.submission = {
      ...this.submission,
      status: "submitting",
      errorCode: null,
    };
    this.publish();
    try {
      const res = await this.api.finish({
        gameId: this.ranked.gameId,
        token: this.ranked.token,
        name,
        durationMs: this.elapsedMs,
      });
      if (this.destroyed) return;
      if (res.qualified) {
        saveLastName(name);
        this.submission = {
          ...this.submission,
          status: "accepted",
          rank: res.rank ?? null,
          scoreId: res.scoreId ?? null,
        };
      } else {
        this.submission = {
          ...this.submission,
          status: "not-qualified",
          threshold: res.threshold ?? this.submission.threshold,
        };
      }
    } catch (error) {
      if (this.destroyed) return;
      if (error instanceof ApiError) {
        this.submission = {
          ...this.submission,
          status: "rejected",
          errorCode: error.code,
        };
      } else {
        this.submission = { ...this.submission, status: "unreachable" };
      }
    }
    this.publish();
  }

  // -- switching ------------------------------------------------------------

  openSwitchGate(): void {
    if (this.mode !== "ranked") return;
    this.connection = {
      ...this.connection,
      gateOpen: true,
      gateTrigger: "manual",
    };
    this.publish();
  }

  /** Escape / backdrop resolve here — never to the destructive branch. */
  closeSwitchGate(): void {
    this.connection = {
      ...this.connection,
      gateOpen: false,
      gateTrigger: null,
    };
    this.publish();
  }

  /** The confirm gate's destructive branch. */
  confirmSwitchToCasual(): void {
    if (this.mode !== "ranked") return;
    const key = mintCasualKey();
    this.localKey = key;
    this.mode = "casual";
    this.modeReason = "your-choice";
    saveModePref("casual");
    pushNetOutcome("dropped");
    this.cancelRetries();
    const pending = this.pendingMove;
    this.pendingMove = null;
    this.connection = IDLE_CONNECTION;
    this.entropy = keyedEntropy(key, this.state.moveCount);
    if (pending) {
      // apply the pending turn's spawn locally
      const result = applyAction(this.state, pending.action, this.entropy);
      if (result.ok) {
        this.commitTurn(pending.action, result.state, result.packet);
        const tail = entropyTail(result.effects);
        if (pending.prefixDone) {
          this.player.play(tail, () => this.publish());
        } else {
          this.pendingMove = { ...pending, tail };
          this.maybeFinishRankedTurn();
        }
      }
    } else {
      this.saveNow();
    }
    this.publish();
  }

  private cancelRetries(): void {
    this.retryCancel?.();
    this.retryCancel = null;
    this.syncingCancel?.();
    this.syncingCancel = null;
  }

  // -- persistence ----------------------------------------------------------

  private saveNow(): void {
    if (this.ranked) {
      saveRankedGame({
        gameId: this.ranked.gameId,
        token: this.ranked.token,
        init: this.ranked.init,
        moves: encodeMoves(this.moves),
        packets: this.packets,
        startedAt: this.startedAt,
        elapsedMs: this.elapsedMs,
        ...(this.localKey ? { localKey: keyToHex(this.localKey) } : {}),
      });
    } else if (this.localKey) {
      saveCasualGame({
        key: this.localKey,
        moves: encodeMoves(this.moves),
        startedAt: this.startedAt,
        elapsedMs: this.elapsedMs,
      });
    }
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
      if (
        this.timerActive &&
        !this.state.over &&
        this.connection.state !== "reconnecting"
      ) {
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

function idleSubmission(): SubmissionState {
  return {
    status: "casual",
    switched: false,
    threshold: null,
    rank: null,
    scoreId: null,
    errorCode: null,
    casualBest: 0,
  };
}

function emptyState(): GameState {
  return {
    balls: new Uint8Array(CELL_COUNT),
    ghosts: new Uint8Array(CELL_COUNT),
    score: 0,
    moveCount: 0,
    over: false,
    stats: { turns: 0, linesPopped: 0, longestLine: 0, ballsCleared: 0 },
  };
}
