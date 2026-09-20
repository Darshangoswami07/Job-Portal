import { describe, it, expect } from "vitest";
import { computeSourceHealth, summarizeSyncRun } from "../sourceHealth.js";

const ago = (ms) => new Date(Date.now() - ms);
const HOUR = 3600_000;

describe("computeSourceHealth", () => {
  it("disabled source → disabled (regardless of history)", () => {
    const h = computeSourceHealth({ enabled: false, lastSyncStatus: "ok", lastSyncAt: new Date() });
    expect(h.status).toBe("disabled");
  });

  it("recent successful sync → healthy", () => {
    const h = computeSourceHealth({
      enabled: true,
      lastSyncStatus: "ok",
      lastSyncAt: ago(HOUR),
      health: { consecutiveFailures: 0 },
    });
    expect(h.status).toBe("healthy");
    expect(h.warnings).toEqual([]);
  });

  it("never synced → warning", () => {
    const h = computeSourceHealth({ enabled: true, lastSyncStatus: "never" });
    expect(h.status).toBe("warning");
    expect(h.warnings.join(" ")).toMatch(/never synced/i);
  });

  it("partial last run → warning", () => {
    const h = computeSourceHealth({ enabled: true, lastSyncStatus: "partial", lastSyncAt: ago(HOUR) });
    expect(h.status).toBe("warning");
  });

  it("stale (no sync in >24h) → warning", () => {
    const h = computeSourceHealth({
      enabled: true,
      lastSyncStatus: "ok",
      lastSyncAt: ago(48 * HOUR),
      health: { consecutiveFailures: 0 },
    });
    expect(h.status).toBe("warning");
    expect(h.warnings.join(" ")).toMatch(/24 hours/);
  });

  it("repeated failures → error", () => {
    const h = computeSourceHealth({
      enabled: true,
      lastSyncStatus: "error",
      lastSyncAt: ago(HOUR),
      health: { consecutiveFailures: 5 },
    });
    expect(h.status).toBe("error");
  });

  it("enabled but credentials missing → error with 'Credential not configured'", () => {
    const h = computeSourceHealth(
      { enabled: true, lastSyncStatus: "ok", lastSyncAt: ago(HOUR) },
      { credentialStatus: { configured: false } }
    );
    expect(h.status).toBe("error");
    expect(h.warnings).toContain("Credential not configured");
  });

  it("hard config error → error", () => {
    const h = computeSourceHealth({ enabled: true }, { configError: "greenhouse: config.boardToken is required" });
    expect(h.status).toBe("error");
    expect(h.warnings[0]).toMatch(/boardToken/);
  });

  it("does not look healthy just because it is enabled", () => {
    const h = computeSourceHealth({ enabled: true }); // no sync history at all
    expect(h.status).not.toBe("healthy");
  });
});

describe("summarizeSyncRun", () => {
  it("returns a compact, stack-trace-free summary", () => {
    const s = summarizeSyncRun({
      _id: "r1",
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 1234,
      status: "partial",
      fetched: 10,
      inserted: 4,
      errorLog: [{ stage: "ingest", message: "x".repeat(500) }],
    });
    expect(s.errorCount).toBe(1);
    expect(s.errors[0].message.length).toBeLessThanOrEqual(300);
    expect(s.fetched).toBe(10);
    expect(summarizeSyncRun(null)).toBeNull();
  });
});
