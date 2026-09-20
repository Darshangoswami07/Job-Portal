import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  evaluateFailureAlert,
  evaluateJobDropAlert,
  evaluateSourceAlerts,
  registerAlertHandler,
  _clearAlertHandlers,
  FAILURE_THRESHOLD,
} from "../sourceAlerts.js";

const src = (over = {}) => ({
  key: "s",
  name: "S",
  health: { consecutiveFailures: 0, alert: { state: "ok", baselineActiveCount: 0, lastActiveCount: 0 }, ...over.health },
  ...over,
});

describe("evaluateFailureAlert (pure)", () => {
  it("raises exactly at the failure threshold, once", () => {
    const s = src({ health: { consecutiveFailures: FAILURE_THRESHOLD, alert: { state: "ok" } } });
    const r = evaluateFailureAlert(s);
    expect(r.transition).toBe("raise");
    expect(r.nextState).toBe("failing");
  });
  it("does not re-raise while already failing", () => {
    const s = src({ health: { consecutiveFailures: 7, alert: { state: "failing" } } });
    expect(evaluateFailureAlert(s).transition).toBeNull();
  });
  it("recovers when failures return to 0", () => {
    const s = src({ health: { consecutiveFailures: 0, alert: { state: "failing" } } });
    expect(evaluateFailureAlert(s).transition).toBe("recover");
  });
  it("stays quiet below the threshold", () => {
    expect(evaluateFailureAlert(src({ health: { consecutiveFailures: 2, alert: { state: "ok" } } })).transition).toBeNull();
  });
});

describe("evaluateJobDropAlert (pure)", () => {
  it("triggers on a large drop", () => {
    const r = evaluateJobDropAlert(src(), 100, 40); // -60%
    expect(r.transition).toBe("raise");
    expect(r.event.message).toMatch(/dropped/i);
  });
  it("ignores small changes", () => {
    expect(evaluateJobDropAlert(src(), 100, 95).transition).toBeNull();
  });
  it("ignores drops on tiny sources", () => {
    expect(evaluateJobDropAlert(src(), 8, 2).transition).toBeNull();
  });
  it("does not re-trigger while in jobDrop, recovers when count returns", () => {
    const s = src({ health: { alert: { state: "jobDrop" } } });
    expect(evaluateJobDropAlert(s, 100, 45).transition).toBeNull();
    expect(evaluateJobDropAlert(s, 100, 90).transition).toBe("recover");
  });
});

describe("evaluateSourceAlerts (integration, mocked delivery)", () => {
  let events;
  beforeEach(() => {
    _clearAlertHandlers();
    events = [];
    registerAlertHandler((e) => events.push(e));
  });

  it("notifies once on the failure transition and not again", async () => {
    const s = src({ health: { consecutiveFailures: FAILURE_THRESHOLD, alert: { state: "ok" } } });
    await evaluateSourceAlerts(s, { runStatus: "error" });
    expect(events).toHaveLength(1);
    expect(s.health.alert.state).toBe("failing");

    s.health.consecutiveFailures = 5;
    await evaluateSourceAlerts(s, { runStatus: "error" });
    expect(events).toHaveLength(1); // no spam
  });

  it("sends a recovery notification once, then resets", async () => {
    const s = src({ health: { consecutiveFailures: 0, alert: { state: "failing" } } });
    await evaluateSourceAlerts(s, { runStatus: "ok", currActiveCount: 50 });
    expect(events.map((e) => e.kind)).toContain("recovered");
    expect(s.health.alert.state).toBe("ok");
  });

  it("fires a job-drop alert once and tracks the active count", async () => {
    const s = src({ health: { consecutiveFailures: 0, alert: { state: "ok", baselineActiveCount: 100, lastActiveCount: 100 } } });
    await evaluateSourceAlerts(s, { runStatus: "ok", currActiveCount: 30 });
    expect(events.some((e) => e.kind === "active-count-drop")).toBe(true);
    expect(s.health.alert.lastActiveCount).toBe(30);

    events.length = 0;
    await evaluateSourceAlerts(s, { runStatus: "ok", currActiveCount: 28 });
    expect(events).toHaveLength(0); // still dropped, no re-alert
  });

  it("does not evaluate job-drop after a hard error run", async () => {
    const s = src({ health: { consecutiveFailures: 1, alert: { state: "ok", baselineActiveCount: 100 } } });
    await evaluateSourceAlerts(s, { runStatus: "error" });
    expect(events.filter((e) => e.kind === "active-count-drop")).toHaveLength(0);
  });
});
