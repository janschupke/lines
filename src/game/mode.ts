import { loadModePref, loadNetHistory } from "./persistence";

export type Mode = "ranked" | "casual";

export type ModeReason =
  | "offline"
  | "your-choice"
  | "data-saver"
  | "slow-connection"
  | "unreliable-history"
  | "connection-good"
  | "server-unreachable"
  | "checking";

export const REASON_TEXT: Record<ModeReason, string> = {
  offline: "you're offline",
  "your-choice": "your choice",
  "data-saver": "data saver is on",
  "slow-connection": "your connection is slow",
  "unreliable-history": "your connection was unreliable recently",
  "connection-good": "your connection looks good",
  "server-unreachable": "couldn't reach the server",
  checking: "checking connection…",
};

export interface ModeDecision {
  mode: Mode;
  reason: ModeReason;
  /** true when rule 6 should still run the probe (i.e. try Ranked). */
  probe: boolean;
}

interface ConnectionInfo {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Rules 1-5 of the mode table, evaluated once per game at load. When this
 * returns { probe: true } the caller runs `/start` with the 1500ms budget:
 * success => Ranked ("connection-good"), failure => Casual
 * ("server-unreachable").
 */
export function preProbeDecision(nav: {
  onLine?: boolean;
  connection?: ConnectionInfo;
}): ModeDecision {
  // 1. offline overrides even the sticky preference
  if (nav.onLine === false) {
    return { mode: "casual", reason: "offline", probe: false };
  }
  // 2. an explicit sticky preference
  const pref = loadModePref();
  if (pref === "casual") {
    return { mode: "casual", reason: "your-choice", probe: false };
  }
  if (pref === "ranked") {
    // still needs the probe — ranked cannot start without /start
    return { mode: "ranked", reason: "your-choice", probe: true };
  }
  // 3. data saver
  if (nav.connection?.saveData === true) {
    return { mode: "casual", reason: "data-saver", probe: false };
  }
  // 4. slow link
  const type = nav.connection?.effectiveType;
  if (type === "slow-2g" || type === "2g") {
    return { mode: "casual", reason: "slow-connection", probe: false };
  }
  // 5. flakiness across sessions
  const history = loadNetHistory();
  const bad = history.filter((o) => o !== "clean").length;
  if (history.length >= 3 && bad >= 2) {
    return { mode: "casual", reason: "unreliable-history", probe: false };
  }
  // 6/7. the probe decides
  return { mode: "ranked", reason: "connection-good", probe: true };
}

export function navigatorInfo(): {
  onLine?: boolean;
  connection?: ConnectionInfo;
} {
  if (typeof navigator === "undefined") return {};
  const nav = navigator as Navigator & { connection?: ConnectionInfo };
  return {
    onLine: nav.onLine,
    connection: nav.connection
      ? {
          ...(nav.connection.saveData !== undefined
            ? { saveData: nav.connection.saveData }
            : {}),
          ...(nav.connection.effectiveType !== undefined
            ? { effectiveType: nav.connection.effectiveType }
            : {}),
        }
      : undefined,
  } as { onLine?: boolean; connection?: ConnectionInfo };
}
