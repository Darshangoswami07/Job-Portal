import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { Company } from "../../../models/company.model.js";
import { User } from "../../../models/user.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { SyncRun } from "../../../models_new/SyncRun.js";
import {
  ensureInternalSource,
  INTERNAL_SOURCE_KEY,
} from "../../sources/internal.js";
import { ingestRawJob } from "../ingest.js";
import { runSourceSync } from "../sync.js";
import { acquireSourceLock, releaseSourceLock } from "../sourceLock.js";
import { searchJobs } from "../../../controllers/job.controller.js";

useTestDb();

let companyId;
let recruiterId;

const makeJob = (over = {}) =>
  Job.create({
    title: "Backend Engineer",
    description: "Build and operate APIs and data services for the platform team. ".repeat(4),
    location: "Bangalore",
    city: "Bangalore",
    workType: "On-site",
    jobType: "Full-time",
    salary: 20,
    experienceLevel: 3,
    position: 1,
    company: companyId,
    created_by: recruiterId,
    ...over,
  });

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (c) => {
    res.statusCode = c;
    return res;
  };
  res.json = (b) => {
    res.body = b;
    return res;
  };
  return res;
};

beforeEach(async () => {
  const recruiter = await User.create({
    fullname: "Rec Ruiter",
    email: `rec${Date.now()}@x.com`,
    password: "hashed",
    roles: { recruiter: true },
  });
  recruiterId = recruiter._id;
  const company = await Company.create({
    name: "Acme Corp",
    website: "https://acme.example",
    userId: recruiterId,
  });
  companyId = company._id;
});

describe("ensureInternalSource", () => {
  it("creates exactly one internal JobSource and is idempotent", async () => {
    const a = await ensureInternalSource();
    const b = await ensureInternalSource();
    expect(a.key).toBe(INTERNAL_SOURCE_KEY);
    expect(String(a._id)).toBe(String(b._id));
    expect(await JobSource.countDocuments({ key: INTERNAL_SOURCE_KEY })).toBe(1);
    expect(a.enabled).toBe(true);
    expect(a.type).toBe("internal");
  });
});

describe("ingestion", () => {
  it("links an internal job in place (no duplicate) and builds its group", async () => {
    const job = await makeJob();
    const source = await ensureInternalSource();

    const { internalJobToRaw } = await import("../../sources/internal.js");
    const populated = await Job.findById(job._id).populate("company", "name website").lean();
    const result = await ingestRawJob(internalJobToRaw(populated), source);

    expect(await Job.countDocuments()).toBe(1);
    const fresh = await Job.findById(job._id).lean();
    expect(String(fresh.sourceId)).toBe(String(source._id));
    expect(fresh.sourceType).toBe("internal");
    expect(fresh.sourceName).toBe("Job-Pilot");
    expect(fresh.applyType).toBe("internal");
    expect(fresh.dedupeHash).toBeTruthy();
    expect(fresh.status).toBe("active");
    expect(fresh.lastSeenAt).toBeInstanceOf(Date);
    expect(String(fresh.groupId)).toBe(String(result.groupId));

    const group = await JobGroup.findOne({ dedupeHash: fresh.dedupeHash }).lean();
    expect(group.activeSourceCount).toBe(1);
    expect(String(group.bestJobId)).toBe(String(job._id));
    expect(group.sources).toHaveLength(1);
  });

  it("is idempotent — re-ingesting makes no duplicate job or group source", async () => {
    const job = await makeJob();
    const source = await ensureInternalSource();
    const { internalJobToRaw } = await import("../../sources/internal.js");
    const raw = internalJobToRaw(await Job.findById(job._id).populate("company", "name website").lean());

    await ingestRawJob(raw, source);
    await ingestRawJob(raw, source);
    await ingestRawJob(raw, source);

    expect(await Job.countDocuments()).toBe(1);
    expect(await JobGroup.countDocuments()).toBe(1);
    const group = await JobGroup.findOne().lean();
    expect(group.sources).toHaveLength(1);
  });

  it("preserves a valid recruiter URL and never fabricates one", async () => {
    const withUrl = await makeJob({ sourceUrl: "https://acme.example/careers/42?utm_source=x" });
    const withoutUrl = await makeJob({ title: "Frontend Engineer" });
    const source = await ensureInternalSource();
    const { internalJobToRaw } = await import("../../sources/internal.js");

    for (const j of [withUrl, withoutUrl]) {
      const raw = internalJobToRaw(await Job.findById(j._id).populate("company", "name website").lean());
      await ingestRawJob(raw, source);
    }

    const a = await Job.findById(withUrl._id).lean();
    expect(a.originalUrl).toBe("https://acme.example/careers/42?utm_source=x");
    expect(a.canonicalUrl).toBe("https://acme.example/careers/42");
    expect(a.applyUrl).toBe(""); // internal → in-platform apply, no external URL

    const b = await Job.findById(withoutUrl._id).lean();
    expect(b.originalUrl).toBe("");
    expect(b.applyUrl).toBe("");
  });

  it("does not fabricate missing salary / country / jobType", async () => {
    const bare = await Job.create({
      title: "Data Analyst",
      description: "Analyse product data and report insights to the team regularly.".repeat(3),
      location: "Remote",
      workType: "Remote",
      company: companyId,
      created_by: recruiterId,
    });
    const source = await ensureInternalSource();
    const { internalJobToRaw } = await import("../../sources/internal.js");
    await ingestRawJob(
      internalJobToRaw(await Job.findById(bare._id).populate("company", "name website").lean()),
      source
    );

    const fresh = await Job.findById(bare._id).lean();
    expect(fresh.salary === undefined || fresh.salary === null).toBe(true);
    expect(fresh.country === undefined || fresh.country === null || fresh.country === "").toBe(true);
    expect(fresh.jobType === undefined || fresh.jobType === null).toBe(true);
    expect(fresh.remoteType).toBe("remote"); // derived from workType, not fabricated
  });
});

describe("job groups", () => {
  it("maps the same vacancy from two rows into one group", async () => {
    const j1 = await makeJob();
    const j2 = await makeJob(); // identical title/company/location/workType
    const source = await ensureInternalSource();
    const { internalJobToRaw } = await import("../../sources/internal.js");
    for (const j of [j1, j2]) {
      await ingestRawJob(
        internalJobToRaw(await Job.findById(j._id).populate("company", "name website").lean()),
        source
      );
    }

    expect(await JobGroup.countDocuments()).toBe(1);
    const group = await JobGroup.findOne().lean();
    expect(group.sources).toHaveLength(2);
    expect(group.activeSourceCount).toBe(2);
  });

  it("does not merge unrelated vacancies", async () => {
    const j1 = await makeJob({ title: "Backend Engineer" });
    const j2 = await makeJob({ title: "Principal Machine Learning Scientist" });
    const source = await ensureInternalSource();
    const { internalJobToRaw } = await import("../../sources/internal.js");
    for (const j of [j1, j2]) {
      await ingestRawJob(
        internalJobToRaw(await Job.findById(j._id).populate("company", "name website").lean()),
        source
      );
    }
    expect(await JobGroup.countDocuments()).toBe(2);
  });
});

describe("runSourceSync", () => {
  it("syncs internal jobs, records a SyncRun, updates stats and lastSeenAt", async () => {
    await makeJob();
    await makeJob({ title: "Frontend Engineer" });

    const before = new Date(Date.now() - 1000);
    const result = await runSourceSync(INTERNAL_SOURCE_KEY);

    expect(result.ok).toBe(true);
    expect(result.counts.fetched).toBe(2);

    const run = await SyncRun.findById(result.runId).lean();
    expect(run.status).toBe("ok");
    expect(run.fetched).toBe(2);
    expect(run.finishedAt).toBeInstanceOf(Date);

    const source = await JobSource.findOne({ key: INTERNAL_SOURCE_KEY }).lean();
    expect(source.lastSyncStatus).toBe("ok");
    expect(source.lastSyncAt.getTime()).toBeGreaterThan(before.getTime());
    expect(source.stats.imported).toBeGreaterThanOrEqual(0);

    for (const j of await Job.find().lean()) {
      expect(j.lastSeenAt).toBeInstanceOf(Date);
      expect(j.groupId).toBeTruthy();
    }
  });

  it("re-running is idempotent (no duplicate jobs or groups)", async () => {
    await makeJob();
    await runSourceSync(INTERNAL_SOURCE_KEY);
    await runSourceSync(INTERNAL_SOURCE_KEY);
    expect(await Job.countDocuments()).toBe(1);
    expect(await JobGroup.countDocuments()).toBe(1);
  });

  it("records ingest errors as a partial run without crashing", async () => {
    const src = await JobSource.create({
      key: "stub:agg",
      name: "Stub",
      type: "aggregator",
      adapter: "stub",
      enabled: true,
    });
    const badAdapter = {
      name: "stub",
      type: "aggregator",
      fetch: async () => [{ externalId: "e1", title: "" }], // empty title → save fails
    };

    const result = await runSourceSync(src, { adapter: badAdapter });
    expect(result.ok).toBe(true);
    expect(result.errors).toBe(1);

    const run = await SyncRun.findById(result.runId).lean();
    expect(run.status).toBe("partial");
    expect(run.errorLog).toHaveLength(1);
    expect(await Job.countDocuments()).toBe(0);
  });

  it("advisory lock prevents overlapping syncs for the same source", async () => {
    await makeJob();
    const source = await ensureInternalSource();

    const held = await acquireSourceLock(source._id, { holder: "tester" });
    expect(held.acquired).toBe(true);

    const blocked = await runSourceSync(INTERNAL_SOURCE_KEY);
    expect(blocked.skipped).toBe("locked");

    await releaseSourceLock(source._id, "tester");
    const ok = await runSourceSync(INTERNAL_SOURCE_KEY);
    expect(ok.ok).toBe(true);
  });

  it("only one of two concurrent syncs proceeds", async () => {
    await makeJob();
    const [a, b] = await Promise.all([
      runSourceSync(INTERNAL_SOURCE_KEY),
      runSourceSync(INTERNAL_SOURCE_KEY),
    ]);
    const outcomes = [a, b].map((r) => (r.ok ? "ok" : r.skipped));
    expect(outcomes.filter((o) => o === "ok")).toHaveLength(1);
    expect(outcomes.filter((o) => o === "locked")).toHaveLength(1);
  });
});

describe("GET /api/v1/job/search controller", () => {
  beforeEach(async () => {
    await Job.init(); // ensure text index for $text queries
    await makeJob({ title: "Senior Backend Engineer", jobType: "Full-time", salary: 30 });
    await makeJob({ title: "Frontend Engineer", jobType: "Contract", salary: 15, workType: "Remote" });
    await makeJob({ title: "Closed Role", isActive: false });
    await runSourceSync(INTERNAL_SOURCE_KEY);
  });

  it("returns paginated active jobs with a stable contract", async () => {
    const res = mockRes();
    await searchJobs({ query: { limit: "1" } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.jobs).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 1, total: 2 });
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it("caps limit and excludes inactive jobs", async () => {
    const res = mockRes();
    await searchJobs({ query: { limit: "9999" } }, res);
    expect(res.body.pagination.limit).toBe(50);
    expect(res.body.pagination.total).toBe(2); // "Closed Role" excluded
  });

  it("filters by jobType", async () => {
    const res = mockRes();
    await searchJobs({ query: { jobType: "Contract" } }, res);
    expect(res.body.jobs).toHaveLength(1);
    expect(res.body.jobs[0].jobType).toBe("Contract");
  });

  it("keyword search matches the title", async () => {
    const res = mockRes();
    await searchJobs({ query: { q: "frontend" } }, res);
    expect(res.body.jobs.map((j) => j.title)).toContain("Frontend Engineer");
  });

  it("sorts newest first", async () => {
    const res = mockRes();
    await searchJobs({ query: { sort: "newest" } }, res);
    const times = res.body.jobs.map((j) => new Date(j.createdAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("returns 400 for malformed params", async () => {
    const res = mockRes();
    await searchJobs({ query: { page: "abc" } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("exposes available source names in meta", async () => {
    const res = mockRes();
    await searchJobs({ query: {} }, res);
    expect(res.body.meta.sources).toContain("Job-Pilot");
  });
});
