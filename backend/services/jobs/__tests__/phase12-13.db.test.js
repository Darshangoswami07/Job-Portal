import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { SyncRun } from "../../../models_new/SyncRun.js";
import { ingestRawJob } from "../ingest.js";
import { runSourceSync } from "../sync.js";
import {
  SOURCE_CAPABILITIES,
  implementedSourceKeys,
  capabilityMatrix,
} from "../../sources/sourceCapabilities.js";
import { effectiveSchedule } from "../../sources/sourceSchedules.js";
import { knownAdapters } from "../../sources/configValidation.js";
import {
  getCapabilityMatrix,
  getCatalogHealth,
  getSourceCoverage,
} from "../../../controllers_new/adminCatalogController.js";

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};
const oid = () => new mongoose.Types.ObjectId();

useTestDb();

// ── Phase 12: capability matrix ────────────────────────────────────────────
describe("source capability matrix (Phase 12)", () => {
  it("implemented adapters exactly match the registered adapter list", () => {
    const impl = [...implementedSourceKeys()].sort();
    const known = [...knownAdapters()].sort();
    expect(impl).toEqual(known);
  });

  it("marks LinkedIn / Indeed / Naukri / Glassdoor as unavailable — NOT implemented", () => {
    for (const key of ["linkedin", "indeed", "naukri", "glassdoor"]) {
      const s = SOURCE_CAPABILITIES[key];
      expect(s.adapter).toBeNull();
      expect(["requires-partnership", "not-verified"]).toContain(s.availability);
      expect(s.reason).toBeTruthy();
    }
  });

  it("every implemented source records a concrete mechanism + capability set", () => {
    for (const s of Object.values(SOURCE_CAPABILITIES)) {
      if (s.availability !== "implemented") continue;
      expect(s.mechanism.length).toBeGreaterThan(10);
      expect(s.capabilities.listingRetrieval).toBe(true);
      expect(s.capabilities).toHaveProperty("applyUrl");
    }
  });

  it("the admin matrix response carries no secrets", async () => {
    const res = mockRes();
    await getCapabilityMatrix({}, res);
    expect(res.body.data.summary.implemented).toBeGreaterThanOrEqual(9);
    const json = JSON.stringify(res.body);
    // No secret VALUES. (Documented public param NAMES like "api_key" or
    // env-var-name references like "config.apiKeyRef" are not secrets.)
    expect(json).not.toMatch(/sk-[A-Za-z0-9]{12}/);
    expect(json).not.toMatch(/\b(api_key|apikey|token|secret)\s*[:=]\s*['"]?[A-Za-z0-9._-]{12}/i);
    expect(json).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{12}/);
    // credentialType must only ever name an env var, never carry a value
    for (const s of res.body.data.sources) {
      if (s.credentialType) expect(s.credentialType).toMatch(/env-var|partner|publisher/i);
    }
  });
});

// ── Phase 13: per-source schedule ─────────────────────────────────────────
describe("effectiveSchedule (Phase 13)", () => {
  it("honours an explicit schedule, falls back per adapter/type, internal = every tick", () => {
    expect(effectiveSchedule({ adapter: "greenhouse", type: "ats", schedule: "*/30 * * * *" })).toBe("*/30 * * * *");
    expect(effectiveSchedule({ adapter: "greenhouse", type: "ats" })).toBe("0 * * * *");
    expect(effectiveSchedule({ adapter: "adzuna", type: "aggregator" })).toBe("0 */3 * * *");
    expect(effectiveSchedule({ adapter: "workable", type: "ats" })).toBe("0 */2 * * *");
    expect(effectiveSchedule({ adapter: "internal", type: "internal" })).toBe("");
  });
});

// ── Phase 13: lifecycle counters + diagnostics ───────────────────────────
describe("continuous ingestion lifecycle (Phase 13)", () => {
  let src;
  const raw = (over = {}) => ({
    externalId: "j1",
    title: "Backend Engineer",
    description: "Build services with Node.js and MongoDB for the platform team.".repeat(2),
    companyName: "Acme",
    location: "Bengaluru, India",
    workType: "On-site",
    jobType: "Full-time",
    originalUrl: "https://boards.greenhouse.io/acme/jobs/1",
    applyUrl: "https://boards.greenhouse.io/acme/jobs/1",
    ...over,
  });

  beforeEach(async () => {
    await Promise.all([JobGroup.deleteMany({}), Job.deleteMany({}), JobSource.deleteMany({}), SyncRun.deleteMany({})]);
    src = await JobSource.create({ key: "gh-acme", name: "Greenhouse", type: "ats", adapter: "greenhouse", enabled: true, config: { boardToken: "acme" } });
  });

  it("new job → Job (dedupeHash/groupKey/groupId) → JobGroup → searchable", async () => {
    const r = await ingestRawJob(raw(), src);
    expect(r.action).toBe("inserted");
    const job = await Job.findById(r.jobId).lean();
    expect(job.dedupeHash).toBeTruthy();
    expect(job.groupKey).toBe(job.dedupeHash);
    expect(job.groupId).toBeTruthy();
    const group = await JobGroup.findById(job.groupId).lean();
    expect(group.status).toBe("active");
    expect(group.sources.map((s) => s.applyUrl)).toContain("https://boards.greenhouse.io/acme/jobs/1");
  });

  it("updated upstream → stored job updates, group stays consistent", async () => {
    await ingestRawJob(raw(), src);
    const r2 = await ingestRawJob(raw({ title: "Senior Backend Engineer", salaryMin: 2000000, salaryCurrency: "INR" }), src);
    expect(r2.action).toBe("updated");
    const job = await Job.findById(r2.jobId).lean();
    expect(job.title).toBe("Senior Backend Engineer");
    expect(job.salaryMin).toBe(2000000);
    const group = await JobGroup.findById(job.groupId).lean();
    expect(group.displayTitle).toBe("Senior Backend Engineer");
  });

  it("expired then re-seen → reactivated, counter incremented, no duplicate", async () => {
    const r1 = await ingestRawJob(raw(), src);
    await Job.updateOne({ _id: r1.jobId }, { $set: { status: "expired", isActive: false } });

    const r2 = await ingestRawJob(raw(), src);
    expect(r2.reactivated).toBe(true);
    const job = await Job.findById(r2.jobId).lean();
    expect(job.status).toBe("active");
    expect(job.isActive).toBe(true);
    expect(await Job.countDocuments({ sourceId: src._id })).toBe(1); // no duplicate
  });

  it("a failing source records an error SyncRun and never mass-expires jobs", async () => {
    await ingestRawJob(raw(), src);
    const before = await Job.countDocuments({ sourceId: src._id, status: "active" });

    const failing = { name: "greenhouse", type: "ats", fetch: async () => { throw new Error("HTTP 503"); } };
    const result = await runSourceSync(src, { adapter: failing });
    expect(result.ok).toBe(false);

    const after = await Job.countDocuments({ sourceId: src._id, status: "active" });
    expect(after).toBe(before); // no expiry on a failed fetch
    const run = await SyncRun.findOne({ sourceId: src._id }).sort({ startedAt: -1 }).lean();
    expect(run.status).toBe("error");
  });

  it("SyncRun.reactivated is persisted from a sync", async () => {
    const r1 = await ingestRawJob(raw(), src);
    await Job.updateOne({ _id: r1.jobId }, { $set: { status: "expired", isActive: false } });
    const adapter = { name: "greenhouse", type: "ats", fetch: async () => [raw()] };
    const result = await runSourceSync(src, { adapter });
    expect(result.ok).toBe(true);
    expect(result.counts.reactivated).toBe(1);
    const run = await SyncRun.findOne({ sourceId: src._id }).sort({ startedAt: -1 }).lean();
    expect(run.reactivated).toBe(1);
  });
});

// ── Phase 13: admin diagnostics ──────────────────────────────────────────
describe("admin catalog-health + source-coverage (Phase 13)", () => {
  beforeEach(async () => {
    await JobGroup.deleteMany({});
    await Job.deleteMany({});
    await JobSource.deleteMany({});
    await SyncRun.deleteMany({});
  });

  it("catalog-health reports counts + integrity, all healthy on a clean tree", async () => {
    const src = await JobSource.create({ key: "gh", name: "GH", type: "ats", adapter: "greenhouse", enabled: true, config: { boardToken: "a" }, lastSyncAt: new Date() });
    const jid = oid();
    await Job.collection.insertOne({ _id: jid, title: "X", description: "y".repeat(30), location: "Remote", sourceId: src._id, status: "active", isActive: true, dedupeHash: "h1", groupKey: "h1", groupId: oid() });
    await JobGroup.create({ dedupeHash: "h1", displayTitle: "X", status: "active", bestJobId: jid, sources: [{ jobId: jid, sourceName: "GH", sourceType: "ats", applyType: "external", status: "active", applyUrl: "https://x/1" }], activeSourceCount: 1, postedAt: new Date() });

    const res = mockRes();
    await getCatalogHealth({}, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.jobs.active).toBe(1);
    expect(res.body.data.jobGroups.active).toBe(1);
    expect(res.body.data.integrity.healthy).toBe(true);
    expect(res.body.data.integrity.activeJobsMissingGroupKey).toBe(0);
  });

  it("catalog-health flags a job missing groupId and a source with zero active jobs", async () => {
    await JobSource.create({ key: "empty", name: "Empty", type: "ats", adapter: "lever", enabled: true, config: { site: "x" } });
    await Job.collection.insertOne({ title: "Orphan", description: "z".repeat(30), location: "Remote", status: "active", isActive: true, dedupeHash: "h9", groupKey: "h9" });

    const res = mockRes();
    await getCatalogHealth({}, res);
    expect(res.body.data.integrity.activeJobsMissingGroupId).toBe(1);
    expect(res.body.data.integrity.healthy).toBe(false);
    expect(res.body.data.sources.zeroActiveJobs).toContain("empty");
    expect(res.body.data.sources.notSyncedRecently).toContain("empty");
  });

  it("source-coverage computes today's added/updated/expired/reactivated from real SyncRuns", async () => {
    const src = await JobSource.create({ key: "gh", name: "GH", type: "ats", adapter: "greenhouse", enabled: true, config: { boardToken: "a" }, lastSyncAt: new Date() });
    await SyncRun.create({ sourceId: src._id, sourceKey: "gh", startedAt: new Date(), status: "ok", inserted: 5, updated: 3, deactivated: 1, reactivated: 2 });
    await SyncRun.create({ sourceId: src._id, sourceKey: "gh", startedAt: new Date(), status: "partial", inserted: 2, updated: 1, deactivated: 0, reactivated: 0 });
    // an old run must NOT count toward "today"
    await SyncRun.create({ sourceId: src._id, sourceKey: "gh", startedAt: new Date(Date.now() - 3 * 864e5), status: "ok", inserted: 100 });

    const res = mockRes();
    await getSourceCoverage({}, res);
    expect(res.statusCode).toBe(200);
    const row = res.body.data.sources.find((r) => r.key === "gh");
    expect(row.today).toMatchObject({ added: 7, updated: 4, expired: 1, reactivated: 2, runs: 2 });
    expect(row.configured).toBe(true);
    expect(row.schedule).toBe("0 * * * *");
    expect(res.body.data.totals.added).toBe(7);
  });
});
