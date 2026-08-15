export type ConnectionStateName = "live" | "syncing" | "reconnecting" | "n/a";

export interface ConnectionState {
  state: ConnectionStateName;
  attempt: number;
  nextRetryAt: number | null;
  gateOpen: boolean;
  gateTrigger: "connection-lost" | "manual" | "session-expired" | null;
}

export const IDLE_CONNECTION: ConnectionState = {
  state: "n/a",
  attempt: 0,
  nextRetryAt: null,
  gateOpen: false,
  gateTrigger: null,
};

/** 1s, 2s, 4s, 8s, 15s, 30s, then every 30s. */
const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000, 30000];

export const backoffDelay = (attempt: number): number =>
  BACKOFF_MS[attempt < BACKOFF_MS.length ? attempt : BACKOFF_MS.length - 1]!;

/** The buttons appear after the third failure. */
export const GATE_AFTER_FAILURES = 3;

/** Nothing shows for the first 600ms — the animation usually hides it. */
export const SYNCING_AFTER_MS = 600;
