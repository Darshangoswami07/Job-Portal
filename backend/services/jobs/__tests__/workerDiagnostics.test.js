import { describe, it, expect } from "vitest";

import { describeWorkerPlan, inferWorkerStatus } from "../workerDiagnostics.js";
import { nextCronFireAfter, cronDue } from "../cron.js";

describe("nextCronFireAfter", () => {
  it("finds the next fire minute for a step-hour cron", () => {
    const at = nextCronFireAfter("0 */3 * * *", new Date("2026-09-09T10:21:00Z"));
    expect(at.toISOString()).toBe("2026-09-09T12:00:00.000Z");
  });
  it("rolls to the next day for a fixed daily cron", () => {
    const at = nextCronFireAfter("0 4 * * *", new Date("2026-09-09T10:00:00Z"));
    expect(at.toISOString()).toBe("2026-09-10T04:00:00.000Z");
  });
  it("returns null for an empty schedule (every tick)", () => {
    expect(nextCronFireAfter("", new Date())).toBeNull();
    expect(nextCronFireAfter("   ", new Date())).toBeNull();
  });
});

describe("describeWorkerPlan", () => {
  const now = new Date("2026-09-09T10:21:00Z");
  const sources = [
    { key: "internal", adapter: "internal", type: "internal", enabled: true, schedule: "", lastSyncAt: new Date("2026-09-09T09:00:00Z") },
    { key: "adzuna", adapter: "adzuna", type: "aggregator", enabled: true, schedule: "0 */6 * * *", lastSyncAt: new Date("2026-09-09T06:00:00Z") },
    { key: "themuse", adapter: "themuse", type: "aggregator", enabled: true, schedule: "0 */3 * * *", lastSyncAt: new Date("2026-09-09T09:00:00Z") },
    { key: "jooble", adapter: "jooble", type: "aggregator", enabled: false, schedule: "0 */6 * * *", lastSyncAt: null },
  ];

  it("counts configured / enabled / scheduled correctly", () => {
    const p = describeWorkerPlan(sources, now);
    expect(p.configured).toBe(4);
    expect(p.enabled).toBe(3);
    expect(p.scheduled).toBe(2); // adzuna + themuse (internal has an empty schedule)
    expect(p.enabledKeys).toEqual(["internal", "adzuna", "themuse"]);
  });

  it("reports the internal every-tick source as due now", () => {
    const p = describeWorkerPlan(sources, now);
    expect(p.dueNow).toContain("internal");
    expect(p.dueNow).not.toContain("adzuna"); // 10:21 does not match 0 */6
  });

  it("picks the soonest nextDue across cron-scheduled enabled sources", () => {
    const p = describeWorkerPlan(sources, now);
    // adzuna 0 */6 → next 12:00 ; themuse 0 */3 → next 12:00 → first alphabetically-stable
    expect(p.nextDue.at).toBe("2026-09-09T12:00:00.000Z");
    expect(["adzuna", "themuse"]).toContain(p.nextDue.key);
    expect(p.nextDue.inMinutes).toBe(99);
  });

  it("a never-synced source on a DEFAULT (non-explicit) cadence is due immediately", () => {
    const fresh = [{ key: "gh:x", adapter: "greenhouse", type: "ats", enabled: true, schedule: "", config: { boardToken: "x" }, lastSyncAt: null }];
    // effectiveSchedule for greenhouse/ats with empty schedule → hourly default,
    // firstRun bootstrap makes it due
    const p = describeWorkerPlan(fresh, now);
    expect(p.dueNow).toContain("gh:x");
  });
});

describe("inferWorkerStatus", () => {
  it("unknown when there are no scheduled sources", () => {
    expect(inferWorkerStatus({ scheduledSources: 0 })).toBe("unknown");
  });
  it("stopped when every scheduled source is overdue", () => {
    expect(inferWorkerStatus({ scheduledSources: 3, overdueScheduledSources: ["a", "b", "c"] })).toBe("stopped");
  });
  it("NEVER returns 'running' — persisted state can't prove it", () => {
    expect(inferWorkerStatus({ scheduledSources: 3, overdueScheduledSources: [], lastScheduledSyncAt: new Date().toISOString() })).toBe("unknown");
    expect(inferWorkerStatus({ scheduledSources: 3, overdueScheduledSources: ["a"] })).toBe("unknown");
  });
});

describe("cronDue integration (schedule respected)", () => {
  it("a 3-hourly source is due only at the top of every 3rd hour", () => {
    expect(cronDue("0 */3 * * *", null, new Date("2026-09-09T12:00:00Z"))).toBe(true);
    expect(cronDue("0 */3 * * *", null, new Date("2026-09-09T12:05:00Z"))).toBe(false);
    expect(cronDue("0 */3 * * *", null, new Date("2026-09-09T13:00:00Z"))).toBe(false);
    // already ran this minute → not due again
    expect(cronDue("0 */3 * * *", new Date("2026-09-09T12:00:30Z"), new Date("2026-09-09T12:00:45Z"))).toBe(false);
  });
});
