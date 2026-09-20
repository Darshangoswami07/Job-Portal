import { describe, it, expect } from "vitest";
import { JobGroup } from "../JobGroup.js";
import { SyncRun } from "../SyncRun.js";

describe("JobGroup model", () => {
  it("requires a dedupeHash", () => {
    const err = new JobGroup({}).validateSync();
    expect(err?.errors?.dedupeHash).toBeDefined();
  });

  it("rejects an invalid remoteType", () => {
    const err = new JobGroup({ dedupeHash: "h", remoteType: "space" }).validateSync();
    expect(err?.errors?.remoteType).toBeDefined();
  });

  it("accepts a minimal valid group with defaults", () => {
    const g = new JobGroup({ dedupeHash: "abc123" });
    expect(g.validateSync()).toBeUndefined();
    expect(g.status).toBe("active");
    expect(g.activeSourceCount).toBe(0);
    expect(g.sources).toEqual([]);
  });

  it("validates embedded source rows", () => {
    const g = new JobGroup({
      dedupeHash: "abc",
      sources: [{ sourceName: "Adzuna", applyType: "external" }],
    });
    // jobId is required on a source row
    expect(g.validateSync()?.errors?.["sources.0.jobId"]).toBeDefined();
  });
});

describe("SyncRun model", () => {
  it("requires sourceId and startedAt", () => {
    const err = new SyncRun({}).validateSync();
    expect(err?.errors?.sourceId).toBeDefined();
    expect(err?.errors?.startedAt).toBeDefined();
  });

  it("defaults status to running and counters to 0", () => {
    const run = new SyncRun({
      sourceId: "5f9d88d9c9d1b8a1b8e8b8e8",
      startedAt: new Date(),
    });
    expect(run.validateSync()).toBeUndefined();
    expect(run.status).toBe("running");
    expect(run.inserted).toBe(0);
    expect(run.errorLog).toEqual([]);
  });
});
