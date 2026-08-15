import { describe, it, expect, beforeEach } from "vitest";
import { preProbeDecision, REASON_TEXT } from "./mode";
import { pushNetOutcome, saveModePref } from "./persistence";

beforeEach(() => {
  localStorage.clear();
});

describe("mode selection rules (13-modes.md)", () => {
  it("rule 1: offline wins, even over a stored Ranked preference", () => {
    saveModePref("ranked");
    const d = preProbeDecision({ onLine: false });
    expect(d).toEqual({ mode: "casual", reason: "offline", probe: false });
  });

  it("rule 2: a sticky casual preference skips the probe", () => {
    saveModePref("casual");
    const d = preProbeDecision({ onLine: true });
    expect(d).toEqual({ mode: "casual", reason: "your-choice", probe: false });
  });

  it("rule 2: a sticky ranked preference still needs the probe", () => {
    saveModePref("ranked");
    const d = preProbeDecision({ onLine: true });
    expect(d).toEqual({ mode: "ranked", reason: "your-choice", probe: true });
  });

  it("rule 3: data saver", () => {
    const d = preProbeDecision({
      onLine: true,
      connection: { saveData: true },
    });
    expect(d).toEqual({ mode: "casual", reason: "data-saver", probe: false });
  });

  it("rule 3 yields to rule 2", () => {
    saveModePref("ranked");
    const d = preProbeDecision({
      onLine: true,
      connection: { saveData: true },
    });
    expect(d.reason).toBe("your-choice");
  });

  it("rule 4: slow link", () => {
    for (const effectiveType of ["slow-2g", "2g"]) {
      const d = preProbeDecision({
        onLine: true,
        connection: { effectiveType },
      });
      expect(d).toEqual({
        mode: "casual",
        reason: "slow-connection",
        probe: false,
      });
    }
    const ok = preProbeDecision({
      onLine: true,
      connection: { effectiveType: "4g" },
    });
    expect(ok.probe).toBe(true);
  });

  it("rule 5: two bad of the last three demotes; a clean game clears it", () => {
    pushNetOutcome("dropped");
    pushNetOutcome("reconnected");
    pushNetOutcome("clean");
    // history: [dropped, reconnected] — only 2 entries, needs 3
    expect(preProbeDecision({ onLine: true }).probe).toBe(true);
    localStorage.clear();
    pushNetOutcome("dropped");
    pushNetOutcome("dropped");
    pushNetOutcome("reconnected");
    const d = preProbeDecision({ onLine: true });
    expect(d).toEqual({
      mode: "casual",
      reason: "unreliable-history",
      probe: false,
    });
    pushNetOutcome("clean"); // clears the window entirely
    expect(preProbeDecision({ onLine: true }).probe).toBe(true);
  });

  it("rules 6/7 are the probe's to decide", () => {
    const d = preProbeDecision({ onLine: true });
    expect(d).toEqual({
      mode: "ranked",
      reason: "connection-good",
      probe: true,
    });
  });

  it("every reason has display text", () => {
    for (const text of Object.values(REASON_TEXT)) {
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
