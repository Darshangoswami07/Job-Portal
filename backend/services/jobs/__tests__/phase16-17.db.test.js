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
import { runSourceSync } from "../sync.js";
import { ensureAggregatorSources, AGGREGATOR_DEFS, aggregatorHasCredentials } from "../../sources/aggregatorSources.js";
import { getSourceCoverage } from "../../../controllers_new/adminCatalogController.js";
import { createJobSource, updateJobSource } from "../../../controllers_new/adminJobSourceController.js";
import { safeGet } from "../../sources/httpClient.js";

useTestDb();

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });
const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

const jobicyJob = (over = {}) => ({
  id: 900,
  url: "https://jobicy.com/jobs/900-staff-sre",
  jobTitle: "Staff Site Reliability Engineer",
  companyName: "Globex",
  jobIndustry: ["DevOps & Sysadmin"],
  jobType: ["Full-Time"],
  jobGeo: "Anywhere",
  jobDescription: "<p>Own reliability for a global platform: SLOs, incident response, k8s, Terraform.</p>",
  pubDate: "2026-09-01T00:00:00+00:00",
  ...over,
});

beforeEach(async () => {
  safeGet.mockReset();
  await Promise.all([Job.deleteMany({}), JobGroup.deleteMany({}), JobSource.deleteMany({}), SyncRun.deleteMany({})]);
  await Job.init();
});

// ── Phase 16: source onboarding ──────────────────────────────────────────
describe("Phase 16 — source registration & activation", () => {
  it("ensureAggregatorSources creates every source DISABLED and idempotently", async () => {
    const a = await ensureAggregatorSources();
    const b = await ensureAggregatorSources();
    expect(a).toHaveLength(AGGREGATOR_DEFS.length);
    expect(await JobSource.countDocuments()).toBe(AGGREGATOR_DEFS.length);
    for (const s of b) expect(s.enabled).toBe(false);
    const muse = await JobSource.findOne({ key: "themuse" }).lean();
    expect(muse.type).toBe("aggregator");
    const usa = await JobSource.findOne({ key: "usajobs" }).lean();
    expect(usa.type).toBe("feed");
  });

  it("credential-free sources report ready; credentialed ones report their env need", () => {
    const byKey = Object.fromEntries(AGGREGATOR_DEFS.map((d) => [d.key, d]));
    expect(aggregatorHasCredentials(byKey.jobicy, {})).toBe(true);
    expect(aggregatorHasCredentials(byKey.themuse, {})).toBe(true);
    expect(aggregatorHasCredentials(byKey.usajobs, {})).toBe(false);
    expect(aggregatorHasCredentials(byKey.usajobs, { USAJOBS_API_KEY: "x", USAJOBS_USER_AGENT: "a@b.c" })).toBe(true);
  });

  it("the admin create → enable → disable flow works and rejects invalid config", async () => {
    const actor = { id: new mongoose.Types.ObjectId() };
    const bad = mockRes();
    await createJobSource(
      { ...actor, body: { key: "jobicy:bad", name: "Bad", type: "aggregator", adapter: "jobicy", config: { count: 9999 } } },
      bad
    );
    expect(bad.statusCode).toBe(400);

    const created = mockRes();
    await createJobSource(
      { ...actor, body: { key: "jobicy:global", name: "Jobicy", type: "aggregator", adapter: "jobicy", config: { count: 50 } } },
      created
    );
    expect(created.statusCode).toBe(201);
    const id = created.body.data.source.id;
    expect(created.body.data.source.enabled).toBe(false); // never auto-enabled

    const enabled = mockRes();
    await updateJobSource({ ...actor, params: { id }, body: { enabled: true } }, enabled);
    expect(enabled.statusCode).toBe(200);
    expect((await JobSource.findById(id)).enabled).toBe(true);

    const disabled = mockRes();
    await updateJobSource({ ...actor, params: { id }, body: { enabled: false } }, disabled);
    expect((await JobSource.findById(id)).enabled).toBe(false);
  });
});

// ── Phase 16/17: first sync + safety ─────────────────────────────────────
describe("Phase 16/17 — jobicy first sync & lifecycle", () => {
  it("first sync ingests real jobs into Job + JobGroup without touching other data", async () => {
    // pre-existing internal job that must NOT be affected by a jobicy sync
    const other = await Job.create({
      title: "Internal Role", description: "x".repeat(40), location: "Remote",
      status: "active", isActive: true, sourceType: "internal", dedupeHash: "keep1", groupKey: "keep1",
    });

    const src = await JobSource.create({ key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true, config: { count: 50 } });
    safeGet.mockResolvedValue(okBody({ jobs: [jobicyJob()], success: true }));

    const result = await runSourceSync(src);
    expect(result.ok).toBe(true);
    expect(result.counts.inserted).toBe(1);

    const job = await Job.findOne({ sourceId: src._id }).lean();
    expect(job.externalId).toBe("jobicy-900");
    expect(job.applyUrl).toBe("https://jobicy.com/jobs/900-staff-sre");
    expect(job.remoteType).toBe("remote");
    expect(job.groupId).toBeTruthy();

    expect(await Job.findById(other._id)).not.toBeNull(); // untouched
    const run = await SyncRun.findById(result.runId).lean();
    expect(run.status).toBe("ok");
  });

  it("a failed first sync produces an error SyncRun, not zero jobs", async () => {
    const src = await JobSource.create({ key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true, config: {} });
    const { SourceHttpError } = await import("../../sources/httpClient.js");
    safeGet.mockRejectedValue(new SourceHttpError("HTTP 503 from jobicy.com", "http"));

    const result = await runSourceSync(src);
    expect(result.ok).toBe(false);
    const run = await SyncRun.findOne({ sourceId: src._id }).sort({ startedAt: -1 }).lean();
    expect(run.status).toBe("error");
    expect(await Job.countDocuments({ sourceId: src._id })).toBe(0);
  });
});

// ── Phase 16/17: coverage health ────────────────────────────────────────
describe("Phase 16/17 — source-coverage health state", () => {
  it("reports healthState + a health roll-up; unavailable sources never count as healthy", async () => {
    await JobSource.create({ key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true, config: { count: 50 }, lastSyncAt: new Date(), lastSyncStatus: "ok" });
    await JobSource.create({ key: "themuse:g", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: false, config: {} });
    await JobSource.create({ key: "gh:x", name: "GH", type: "ats", adapter: "greenhouse", enabled: true, config: {} }); // enabled but no boardToken → not-configured
    await SyncRun.create({ sourceId: (await JobSource.findOne({ key: "gh:x" }))._id, sourceKey: "gh:x", startedAt: new Date(), status: "error" });

    const res = mockRes();
    await getSourceCoverage({}, res);
    const rows = Object.fromEntries(res.body.data.sources.map((r) => [r.key, r]));

    expect(rows["jobicy:g"].healthState).toBe("healthy");
    expect(rows["jobicy:g"].availability).toBe("implemented");
    expect(rows["themuse:g"].healthState).toBe("disabled");
    expect(rows["gh:x"].healthState).toBe("not-configured");
    expect(rows["gh:x"].lastFailedSyncAt).not.toBeNull();

    const h = res.body.data.health;
    expect(h.totalConfigurableSources).toBe(3);
    expect(h.enabled).toBe(2);
    expect(h.healthy).toBe(1);
    // jobicy:g is enabled but has 0 active jobs in this test → not "contributing"
    expect(h.contributing).toBe(0);
  });
});
