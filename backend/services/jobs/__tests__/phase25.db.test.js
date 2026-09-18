import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

vi.mock("../../sources/httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), safeRequest: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { SyncRun } from "../../../models_new/SyncRun.js";
import { acquireSourceLock, releaseSourceLock, newLockHolderId } from "../sourceLock.js";
import { SyncScheduler } from "../scheduler.js";
import { getSourceCoverage } from "../../../controllers_new/adminCatalogController.js";
import { validateSourceConfig } from "../../sources/configValidation.js";
import { safeGet } from "../../sources/httpClient.js";

useTestDb();

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

beforeEach(async () => {
  safeGet.mockReset();
  await Promise.all([Job.deleteMany({}), JobGroup.deleteMany({}), JobSource.deleteMany({}), SyncRun.deleteMany({})]);
});

// ── 25C: single-worker safety — Mongo advisory lock ─────────────────────
describe("Phase 25 — source lock (single-worker safety)", () => {
  it("worker A claims a source, worker B sees the claim and skips, then A releases", async () => {
    const src = await JobSource.create({ key: "jobicy", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true, config: {} });
    const a = newLockHolderId();
    const b = newLockHolderId();

    const gotA = await acquireSourceLock(src._id, { holder: a });
    expect(gotA.acquired).toBe(true);

    const gotB = await acquireSourceLock(src._id, { holder: b });
    expect(gotB.acquired).toBe(false); // B is blocked

    await releaseSourceLock(src._id, a);

    const gotBAfter = await acquireSourceLock(src._id, { holder: b });
    expect(gotBAfter.acquired).toBe(true); // future run can proceed
    await releaseSourceLock(src._id, b);
  });

  it("a stale lock (expired lease) is recoverable — failure never permanently locks a source", async () => {
    const src = await JobSource.create({ key: "adzuna", name: "Adzuna", type: "aggregator", adapter: "adzuna", enabled: true, config: {} });
    const dead = newLockHolderId();
    // acquire with a lease that is already in the past
    await acquireSourceLock(src._id, { holder: dead, ttlMs: -1000 });

    const live = newLockHolderId();
    const got = await acquireSourceLock(src._id, { holder: live });
    expect(got.acquired).toBe(true); // stale lock reclaimed
    await releaseSourceLock(src._id, live);
  });

  it("release is holder-scoped — a different holder cannot free someone else's lock", async () => {
    const src = await JobSource.create({ key: "themuse", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: true, config: {} });
    const a = newLockHolderId();
    await acquireSourceLock(src._id, { holder: a });
    await releaseSourceLock(src._id, "not-the-holder"); // no-op
    const b = await acquireSourceLock(src._id, { holder: newLockHolderId() });
    expect(b.acquired).toBe(false); // still held by A
  });
});

// ── 25D/25F: the ONE scheduler executes due sources on its tick ─────────
describe("Phase 25 — scheduler executes scheduled syncs (one scheduler only)", () => {
  it("a scheduler tick runs a DUE source and records a SyncRun; a not-due source is skipped", async () => {
    const okBody = (o) => ({ status: 200, headers: {}, body: JSON.stringify(o), url: "x" });
    process.env.__T_ADZ_ID = "id"; process.env.__T_ADZ_KEY = "k";
    // due: never synced, default cadence → first-run bootstrap
    const due = await JobSource.create({
      key: "adzuna", name: "Adzuna", type: "aggregator", adapter: "adzuna", enabled: true,
      config: { appIdRef: "__T_ADZ_ID", appKeyRef: "__T_ADZ_KEY", country: "in", pages: 1, queries: ["x"] },
      schedule: "",
    });
    // not due: explicit far-future cron, never synced
    const notDue = await JobSource.create({
      key: "jobicy", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true,
      config: { count: 5 }, schedule: "0 0 1 1 *",
    });
    safeGet.mockResolvedValue(okBody({ results: [{ id: 1, title: "Engineer", description: "<p>Build things for the platform team.</p>", location: { display_name: "Bengaluru, India" }, company: { display_name: "Acme" }, redirect_url: "https://a.co/1" }] }));

    const scheduler = new SyncScheduler({ logger: { log() {}, error() {} } });
    const out = await scheduler.tick(new Date("2026-06-15T09:30:00Z"));

    const ranKeys = out.ran.map((r) => r.key);
    expect(ranKeys).toContain("adzuna");
    expect(ranKeys).not.toContain("jobicy");

    const adzRun = await SyncRun.findOne({ sourceId: due._id }).lean();
    expect(adzRun.status).toBe("ok");
    expect(await SyncRun.countDocuments({ sourceId: notDue._id })).toBe(0);
    expect(await Job.countDocuments({ sourceId: due._id })).toBe(1);

    delete process.env.__T_ADZ_ID; delete process.env.__T_ADZ_KEY;
  });

  it("one source failing in a tick does not stop the others (failure isolation)", async () => {
    const okBody = (o) => ({ status: 200, headers: {}, body: JSON.stringify(o), url: "x" });
    process.env.__T_ADZ_ID = "id"; process.env.__T_ADZ_KEY = "k";
    await JobSource.create({ key: "jobicy", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true, config: { count: 5 }, schedule: "" });
    await JobSource.create({
      key: "adzuna", name: "Adzuna", type: "aggregator", adapter: "adzuna", enabled: true,
      config: { appIdRef: "__T_ADZ_ID", appKeyRef: "__T_ADZ_KEY", country: "in", pages: 1, queries: ["x"] }, schedule: "",
    });
    // jobicy fails, adzuna succeeds
    safeGet.mockImplementation((url) => {
      if (String(url).includes("jobicy")) return Promise.reject(Object.assign(new Error("HTTP 503"), { kind: "http" }));
      return Promise.resolve(okBody({ results: [{ id: 9, title: "Eng", description: "<p>Build things for the platform team.</p>", location: { display_name: "Bengaluru, India" }, company: { display_name: "Acme" }, redirect_url: "https://a.co/9" }] }));
    });

    const scheduler = new SyncScheduler({ logger: { log() {}, error() {} } });
    await scheduler.tick(new Date());

    const jobicyRun = await SyncRun.findOne({ sourceKey: "jobicy" }).lean();
    const adzunaRun = await SyncRun.findOne({ sourceKey: "adzuna" }).lean();
    expect(jobicyRun.status).toBe("error");
    expect(adzunaRun.status).toBe("ok"); // unaffected
    delete process.env.__T_ADZ_ID; delete process.env.__T_ADZ_KEY;
  });
});

// ── 25O: worker status in coverage (never a fabricated "running") ──────
describe("Phase 25 — coverage exposes a worker block + inferred status", () => {
  it("status is 'stopped' when every enabled non-internal source is overdue", async () => {
    await JobSource.create({ key: "internal", name: "Job-Pilot", type: "internal", adapter: "internal", enabled: true, config: {}, lastSyncAt: new Date() });
    await JobSource.create({ key: "themuse", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: true, config: {}, schedule: "0 */3 * * *", lastSyncAt: new Date("2020-01-01"), lastSyncStatus: "ok" });
    await JobSource.create({ key: "jobicy", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true, config: {}, schedule: "0 */6 * * *", lastSyncAt: new Date("2020-01-01"), lastSyncStatus: "ok" });

    const res = mockRes();
    await getSourceCoverage({}, res);
    const w = res.body.data.worker;
    expect(w.scheduledSources).toBe(2);
    expect(w.overdueScheduledSources.sort()).toEqual(["jobicy", "themuse"]);
    expect(w.allScheduledOverdue).toBe(true);
    expect(w.status).toBe("stopped");
    expect(w.nextExpectedSyncAt).toBeTruthy();
  });

  it("status is 'unknown' with no scheduled sources — never a false 'running'", async () => {
    await JobSource.create({ key: "internal", name: "Job-Pilot", type: "internal", adapter: "internal", enabled: true, config: {}, lastSyncAt: new Date() });
    const res = mockRes();
    await getSourceCoverage({}, res);
    expect(res.body.data.worker.status).toBe("unknown");
  });
});

// ── 25H: ATS board registration validation ─────────────────────────────
describe("Phase 25 — ATS board config validation", () => {
  it("rejects an empty/invalid board id and accepts a real one, per adapter", () => {
    expect(validateSourceConfig("greenhouse", {}).error).toMatch(/boardToken/i);
    expect(validateSourceConfig("greenhouse", { boardToken: "acme" }).ok).toBe(true);
    expect(validateSourceConfig("lever", { site: "acme" }).ok).toBe(true);
    expect(validateSourceConfig("ashby", { jobBoardName: "Acme" }).ok).toBe(true);
    expect(validateSourceConfig("smartrecruiters", { companyId: "AcmeInc" }).ok).toBe(true);
    expect(validateSourceConfig("workable", { subdomain: "acme", apiTokenRef: "WORKABLE_API_TOKEN" }).ok).toBe(true);
    // workable rejects a raw token value in the ref field
    expect(validateSourceConfig("workable", { subdomain: "acme", apiTokenRef: "actual-secret" }).error).toMatch(/ENV VAR NAME/);
  });

  it("registering the same board twice is idempotent (upsert by key)", async () => {
    const key = "greenhouse:acme";
    await JobSource.findOneAndUpdate(
      { key },
      { $set: { name: "Acme", type: "ats", adapter: "greenhouse", "config.boardToken": "acme" }, $setOnInsert: { key, enabled: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await JobSource.findOneAndUpdate(
      { key },
      { $set: { name: "Acme", type: "ats", adapter: "greenhouse", "config.boardToken": "acme" }, $setOnInsert: { key, enabled: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    expect(await JobSource.countDocuments({ key })).toBe(1);
  });
});
