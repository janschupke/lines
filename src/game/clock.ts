export type Cancel = () => void;

const noop: Cancel = () => undefined;

export interface Clock {
  after(ms: number, cb: () => void): Cancel;
}

/** Real time. */
export const realClock: Clock = {
  after(ms, cb) {
    const id = setTimeout(cb, ms);
    return () => clearTimeout(id);
  },
};

/**
 * Invokes the callback synchronously; ms ignored. Speed 0 / reduced motion:
 * the whole effect timeline folds inside the click handler.
 */
export const instantClock: Clock = {
  after(_ms, cb) {
    cb();
    return noop;
  },
};

export interface FakeClock extends Clock {
  advance(ms: number): void;
  now(): number;
}

/** Deterministic clock for tests. */
export function fakeClock(): FakeClock {
  let now = 0;
  let nextId = 1;
  const pending = new Map<number, { at: number; cb: () => void }>();
  return {
    after(ms, cb) {
      const id = nextId++;
      pending.set(id, { at: now + ms, cb });
      return () => pending.delete(id);
    },
    advance(ms) {
      const target = now + ms;
      for (;;) {
        let earliest: [number, { at: number; cb: () => void }] | null = null;
        for (const entry of pending) {
          if (entry[1].at <= target) {
            if (earliest === null || entry[1].at < earliest[1].at) {
              earliest = entry;
            }
          }
        }
        if (earliest === null) break;
        pending.delete(earliest[0]);
        now = earliest[1].at;
        earliest[1].cb();
      }
      now = target;
    },
    now: () => now,
  };
}
