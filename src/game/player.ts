import type { CellIndex, ColorId, Effect } from "@/engine";
import type { Cancel, Clock } from "./clock";
import { instantClock } from "./clock";
import type { Timings } from "./timings";
import { effectDuration } from "./timings";

export interface Overlay {
  moving: {
    color: ColorId;
    path: readonly CellIndex[];
    step: number;
  } | null;
  popping: ReadonlySet<CellIndex>;
  growing: ReadonlyMap<CellIndex, "new" | "transition">;
  floating: readonly { id: number; at: CellIndex; delta: number }[];
  /** Bumps on every score effect; drives the score flash animation. */
  scoreFlashId: number;
}

const EMPTY_OVERLAY: Overlay = {
  moving: null,
  popping: new Set(),
  growing: new Map(),
  floating: [],
  scoreFlashId: 0,
};

/**
 * Consumes an Effect[] timeline against a Clock. Calls back into the
 * controller to fold each effect into the view when its animation completes
 * and publishes transient overlay state while it plays. Never touches React.
 */
export class EffectPlayer {
  private clock: Clock;
  private readonly timings: Timings;
  private readonly onChange: () => void;
  private readonly fold: (e: Effect) => void;
  private cancels: Cancel[] = [];
  private floatingId = 0;
  overlay: Overlay = EMPTY_OVERLAY;
  private playing = false;
  /** The in-flight timeline; `i` is the first effect NOT yet folded. */
  private cursor: {
    effects: readonly Effect[];
    i: number;
    onDone: () => void;
  } | null = null;

  constructor(
    clock: Clock,
    timings: Timings,
    hooks: { fold: (e: Effect) => void; onChange: () => void },
  ) {
    this.clock = clock;
    this.timings = timings;
    this.fold = hooks.fold;
    this.onChange = hooks.onChange;
  }

  get busy(): boolean {
    return this.playing;
  }

  setSpeed(mult: number): void {
    if (mult === 0) this.clock = instantClock;
  }

  setClock(clock: Clock): void {
    this.clock = clock;
  }

  cancel(): void {
    for (const c of this.cancels) c();
    this.cancels = [];
    this.cursor = null;
    this.overlay = EMPTY_OVERLAY;
    this.playing = false;
  }

  /**
   * Fast-forward: fold everything not yet folded, clear the overlay and
   * complete synchronously. Safe because the game state is final before the
   * first pixel animates — this only skips the pixels.
   */
  finish(): void {
    if (!this.playing) return;
    for (const c of this.cancels) c();
    this.cancels = [];
    const cursor = this.cursor;
    this.cursor = null;
    this.playing = false;
    if (cursor) {
      for (let j = cursor.i; j < cursor.effects.length; j++) {
        this.fold(cursor.effects[j]!);
      }
    }
    this.overlay = EMPTY_OVERLAY;
    this.onChange();
    cursor?.onDone();
  }

  play(effects: readonly Effect[], onDone: () => void): void {
    this.playing = true;
    this.step(effects, 0, onDone);
  }

  private after(ms: number, cb: () => void): void {
    const cancel = this.clock.after(ms, cb);
    this.cancels.push(cancel);
  }

  private step(
    effects: readonly Effect[],
    i: number,
    onDone: () => void,
  ): void {
    this.cursor = { effects, i, onDone };
    if (i >= effects.length) {
      this.playing = false;
      this.cursor = null;
      this.overlay = {
        ...this.overlay,
        moving: null,
        popping: new Set(),
        growing: new Map(),
      };
      this.onChange();
      onDone();
      return;
    }
    const e = effects[i]!;
    switch (e.k) {
      case "move": {
        const steps = e.path.length - 1;
        this.overlay = {
          ...this.overlay,
          moving: { color: e.color, path: e.path, step: 0 },
        };
        this.onChange();
        const advance = (step: number) => {
          if (step >= steps) {
            this.fold(e);
            this.overlay = { ...this.overlay, moving: null };
            this.onChange();
            this.step(effects, i + 1, onDone);
            return;
          }
          this.after(this.timings.movingStep, () => {
            this.overlay = {
              ...this.overlay,
              moving: { color: e.color, path: e.path, step: step + 1 },
            };
            this.onChange();
            advance(step + 1);
          });
        };
        advance(0);
        break;
      }
      case "pop": {
        this.overlay = { ...this.overlay, popping: new Set(e.cells) };
        this.onChange();
        this.after(effectDuration(e, this.timings), () => {
          this.fold(e);
          this.overlay = { ...this.overlay, popping: new Set() };
          this.onChange();
          this.step(effects, i + 1, onDone);
        });
        break;
      }
      case "score": {
        // Non-blocking: fire the floating score + flash and continue.
        const id = ++this.floatingId;
        this.overlay = {
          ...this.overlay,
          floating: [
            ...this.overlay.floating,
            { id, at: e.at, delta: e.delta },
          ],
          scoreFlashId: this.overlay.scoreFlashId + 1,
        };
        this.fold(e);
        this.onChange();
        this.after(this.timings.floatingScore, () => {
          this.overlay = {
            ...this.overlay,
            floating: this.overlay.floating.filter((f) => f.id !== id),
          };
          this.onChange();
        });
        this.step(effects, i + 1, onDone);
        break;
      }
      case "materialize":
      case "ghostMoved":
      case "spawnGhosts": {
        // ONE grow window for the whole spawn phase: ghosts materialising
        // into balls, the displaced ghost relocating, and the new previews
        // appearing all animate concurrently, exactly like the original
        // game. Playing them as separate steps doubled the per-turn wait.
        const group: Effect[] = [];
        for (let j = i; j < effects.length; j++) {
          const g = effects[j]!;
          if (
            g.k !== "materialize" &&
            g.k !== "ghostMoved" &&
            g.k !== "spawnGhosts"
          ) {
            break;
          }
          group.push(g);
        }
        const growing = new Map<CellIndex, "new" | "transition">();
        for (const g of group) {
          if (g.k === "materialize") {
            for (const p of g.cells) growing.set(p.c, "transition");
          }
          if (g.k === "ghostMoved") growing.set(g.to, "new");
          if (g.k === "spawnGhosts") {
            for (const p of g.cells) growing.set(p.c, "new");
          }
          // Fold first so materialised cells render as real balls, animated
          // by the grow class while `growing` marks them.
          this.fold(g);
        }
        this.cursor = { effects, i: i + group.length, onDone }; // folded
        this.overlay = { ...this.overlay, growing };
        this.onChange();
        this.after(this.timings.growBall, () => {
          this.overlay = { ...this.overlay, growing: new Map() };
          this.onChange();
          this.step(effects, i + group.length, onDone);
        });
        break;
      }
      case "gameOver": {
        this.fold(e);
        this.onChange();
        this.step(effects, i + 1, onDone);
        break;
      }
    }
  }
}
