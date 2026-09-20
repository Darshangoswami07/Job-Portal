import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { SyncRun } from "../../../models_new/SyncRun.js";
import { getSourceCoverage, getCatalogHealth } from "../../../controllers_new/adminCatalogController.js";
import { capabilityMatrix, implementedSourceKeys } from "../../sources/sourceCapabilities.js";
import { knownAdapters } from "../../sources/configValidation.js";

useTestDb();

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};
const oid = () => new mongoose.Types.ObjectId();
const daysAgo = (n) => new Date(Date.now() - n * 864e5);

beforeEach(async () => {
  await Promise.all([Job.deleteMany({}), JobGroup.deleteMany({}), JobSource.deleteMany({}), SyncRun.deleteMany({})]);
});

// ── Phase 21: research classification ──────────────────────────────────
describe("Phase 21 — capability matrix", () => {
  it("keeps registry parity and records Hirist / YC / Freshersworld as non-implemented", () => {
    expect([...implementedSourceKeys()].sort()).toEqual([...knownAdapters()].sort());
    const m = Object.fromEntries(capabilityMatrix().map((s) => [s.key, s]));
    expect(m.hirist.adapter).toBeNull();
    expect(m.hirist.availability).toBe("not-verified");
    expect(m.ycombinator.availability).toBe("not-verified");
    expect(m.freshersworld.availability).toBe("requires-partnership");
    expect(m.freshersworld.adapter).toBeNull();
  });
});

// ── Phase 20: overdue + quality score ─────────────────────────────────
describe("Phase 20 — source-coverage overdue + qualityScore", () => {
  it("flags an enabled configured source with no recent successful sync as overdue/warning", async () => {
    await JobSource.create({
      key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true,
      config: { count: 50 }, lastSyncAt: daysAgo(4), lastSyncStatus: "ok",
    });
    const res = mockRes();
    await getSourceCoverage({}, res);
    const row = res.body.data.sources.find((r) => r.key === "jobicy:g");
    expect(row.overdue).toBe(true);
    expect(row.healthState).toBe("warning");
    expect(typeof row.qualityScore).toBe("number");
    expect(row.qualityScore).toBeLessThan(100); // docked for overdue
    expect(res.body.data.health.overdue).toBe(1);
  });

  it("a freshly-synced enabled source is healthy, not overdue, near-perfect score", async () => {
    const src = await JobSource.create({
      key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true,
      config: { count: 50 }, lastSyncAt: new Date(), lastSyncStatus: "ok",
    });
    await SyncRun.create({ sourceId: src._id, sourceKey: "jobicy:g", startedAt: new Date(), status: "ok", inserted: 3 });
    await Job.collection.insertOne({ _id: oid(), title: "X", description: "y".repeat(30), location: "Remote", sourceId: src._id, status: "active", isActive: true, dedupeHash: "h1", groupKey: "h1", groupId: oid() });

    const res = mockRes();
    await getSourceCoverage({}, res);
    const row = res.body.data.sources.find((r) => r.key === "jobicy:g");
    expect(row.overdue).toBe(false);
    expect(row.healthState).toBe("healthy");
    expect(row.qualityScore).toBe(100);
  });

  it("qualityScore is null for a partnership-only / disabled source", async () => {
    await JobSource.create({ key: "themuse:g", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: false, config: {} });
    const res = mockRes();
    await getSourceCoverage({}, res);
    const row = res.body.data.sources.find((r) => r.key === "themuse:g");
    expect(row.qualityScore).toBeNull();
    expect(row.healthState).toBe("disabled");
  });
});

// ── Phase 21: catalog-health duplication / diversity / freshness ──────
describe("Phase 21 — catalog-health analytics", () => {
  it("reports real duplication, diversity and freshness over active jobs", async () => {
    const g1 = oid(), g2 = oid();
    const now = Date.now();
    await Job.collection.insertMany([
      { _id: oid(), title: "Backend Engineer", description: "x".repeat(30), normalizedCompany: "acme", normalizedLocation: "remote", seniority: "mid", remoteType: "remote", status: "active", isActive: true, groupKey: "k1", groupId: g1, postedAt: new Date(now - 2 * 864e5) },
      { _id: oid(), title: "Backend Engineer", description: "x".repeat(30), normalizedCompany: "acme", normalizedLocation: "remote", seniority: "mid", remoteType: "remote", status: "active", isActive: true, groupKey: "k1", groupId: g1, postedAt: new Date(now - 6 * 864e5) },
      { _id: oid(), title: "Data Scientist", description: "x".repeat(30), normalizedCompany: "globex", normalizedLocation: "bengaluru india", seniority: "senior", remoteType: "onsite", status: "active", isActive: true, groupKey: "k2", groupId: g2, postedAt: new Date(now - 10 * 864e5) },
    ]);
    await JobGroup.collection.insertMany([
      { _id: g1, dedupeHash: "k1", status: "active", activeSourceCount: 2, seniority: "mid", sourceNames: ["Greenhouse", "The Muse"], sources: [{ jobId: oid() }, { jobId: oid() }], postedAt: new Date() },
      { _id: g2, dedupeHash: "k2", status: "active", activeSourceCount: 1, seniority: "senior", sources: [{ jobId: oid() }], postedAt: new Date() },
    ]);

    const res = mockRes();
    await getCatalogHealth({}, res);
    const d = res.body.data;
    expect(d.duplication.activeJobRows).toBe(3);
    expect(d.duplication.activeGroups).toBe(2);
    expect(d.duplication.multiSourceGroups).toBe(1); // g1 carries 2 distinct sourceNames
    expect(d.duplication.jobsPerGroup).toBeCloseTo(1.5, 1);
    expect(d.diversity.companies).toBe(2);
    expect(d.diversity.locations).toBe(2);
    expect(d.diversity.remoteJobs).toBe(2);
    expect(d.diversity.seniorities).toBe(2); // from JobGroup.seniority (not the Job row)
    expect(d.freshness.activeJobsWithPostedAt).toBe(3);
    expect(d.freshness.avgAgeDays).toBeGreaterThan(0);
    expect(d.freshness.oldestDays).toBeGreaterThanOrEqual(d.freshness.newestDays);
  });

  it("freshness degrades gracefully when no active job carries a postedAt", async () => {
    await Job.collection.insertOne({ _id: oid(), title: "X", description: "y".repeat(30), status: "active", isActive: true, groupKey: "k", groupId: oid() });
    const res = mockRes();
    await getCatalogHealth({}, res);
    expect(res.body.data.freshness.activeJobsWithPostedAt).toBe(0);
    expect(res.body.data.integrity).toBeDefined();
  });
});
