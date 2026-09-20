import { describe, it, expect, vi, beforeEach } from "vitest";

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
import { searchJobs } from "../../../controllers/job.controller.js";
import { getSourceCoverage } from "../../../controllers_new/adminCatalogController.js";
import { safeGet } from "../../sources/httpClient.js";

useTestDb();

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });
const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

const museJob = (over = {}) => ({
  id: 1001,
  name: "Senior Platform Engineer",
  contents: "<p>Own the platform: build resilient services, APIs and pipelines with Go and Kubernetes.</p>",
  company: { name: "Northwind" },
  locations: [{ name: "Remote" }],
  categories: [{ name: "Software Engineering" }],
  type: "Full Time",
  publication_date: "2026-08-15T00:00:00Z",
  refs: { landing_page: "https://www.themuse.com/jobs/northwind/senior-platform-engineer" },
  ...over,
});

beforeEach(async () => {
  safeGet.mockReset();
  await Promise.all([Job.deleteMany({}), JobGroup.deleteMany({}), JobSource.deleteMany({}), SyncRun.deleteMany({})]);
  await Job.init();
});

describe("Phase 14/15 — a new verified source flows end-to-end", () => {
  it("themuse: sync → Job → JobGroup → visible in /job/search, with SyncRun + coverage", async () => {
    const src = await JobSource.create({
      key: "themuse:global", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: true, config: { pages: 1 },
    });
    safeGet.mockResolvedValue(okBody({ page: 0, page_count: 1, results: [museJob()] }));

    const result = await runSourceSync(src);
    expect(result.ok).toBe(true);
    expect(result.counts.inserted).toBe(1);

    const job = await Job.findOne({ sourceId: src._id }).lean();
    expect(job.externalId).toBe("themuse-1001");
    expect(job.applyUrl).toBe("https://www.themuse.com/jobs/northwind/senior-platform-engineer");
    expect(job.applyType).toBe("external");
    expect(job.groupId).toBeTruthy();
    expect(job.remoteType).toBe("remote");

    const group = await JobGroup.findById(job.groupId).lean();
    expect(group.status).toBe("active");
    expect(group.sources.map((s) => s.applyUrl)).toContain(job.applyUrl);

    const run = await SyncRun.findById(result.runId).lean();
    expect(run.status).toBe("ok");

    const res = mockRes();
    await searchJobs({ query: { q: "platform engineer" } }, res);
    expect(res.body.jobs.map((j) => j.title)).toContain("Senior Platform Engineer");
    expect(res.body.meta.sources).toContain("The Muse");

    const cov = mockRes();
    await getSourceCoverage({}, cov);
    const row = cov.body.data.sources.find((r) => r.key === "themuse:global");
    expect(row.availability).toBe("implemented");
    expect(row.configured).toBe(true);
    expect(row.activeJobs).toBe(1);
    expect(row.today.added).toBe(1);
  });

  it("themuse: an upstream change updates the Job + group, no duplicate", async () => {
    const src = await JobSource.create({ key: "themuse:g", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: true, config: { pages: 1 } });
    safeGet.mockResolvedValue(okBody({ page_count: 1, results: [museJob()] }));
    await runSourceSync(src);

    safeGet.mockResolvedValue(okBody({ page_count: 1, results: [museJob({ name: "Staff Platform Engineer" })] }));
    const r2 = await runSourceSync(src);
    expect(r2.counts.updated).toBe(1);

    expect(await Job.countDocuments({ sourceId: src._id })).toBe(1);
    const job = await Job.findOne({ sourceId: src._id }).lean();
    expect(job.title).toBe("Staff Platform Engineer");
    const group = await JobGroup.findById(job.groupId).lean();
    expect(group.displayTitle).toBe("Staff Platform Engineer");
  });

  it("themuse: a 429 fetch failure records an error SyncRun and preserves existing jobs", async () => {
    const src = await JobSource.create({ key: "themuse:g", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: true, config: { pages: 1 } });
    safeGet.mockResolvedValue(okBody({ page_count: 1, results: [museJob()] }));
    await runSourceSync(src);
    const before = await Job.countDocuments({ sourceId: src._id, status: "active" });

    const { SourceHttpError } = await import("../../sources/httpClient.js");
    safeGet.mockRejectedValue(new SourceHttpError("HTTP 429 from www.themuse.com", "http"));
    const r2 = await runSourceSync(src);
    expect(r2.ok).toBe(false);

    expect(await Job.countDocuments({ sourceId: src._id, status: "active" })).toBe(before);
    const run = await SyncRun.findOne({ sourceId: src._id }).sort({ startedAt: -1 }).lean();
    expect(run.status).toBe("error");
  });

  it("themuse: an empty results page does NOT expire the source's jobs", async () => {
    const src = await JobSource.create({ key: "themuse:g", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: true, config: { pages: 1 } });
    safeGet.mockResolvedValue(okBody({ page_count: 1, results: [museJob()] }));
    await runSourceSync(src);

    safeGet.mockResolvedValue(okBody({ page_count: 1, results: [] }));
    const r2 = await runSourceSync(src);
    expect(r2.ok).toBe(true);
    expect(r2.counts.fetched).toBe(0);
    // conservative freshness: expiry only runs after a clean NON-empty response
    expect(await Job.countDocuments({ sourceId: src._id, status: "active" })).toBe(1);
  });

  it("cross-source: the same vacancy from themuse + a company board folds into one group", async () => {
    const board = await JobSource.create({ key: "gh:northwind", name: "Greenhouse", type: "ats", adapter: "greenhouse", enabled: true, config: { boardToken: "northwind" } });
    const muse = await JobSource.create({ key: "themuse:g", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: true, config: { pages: 1 } });

    const ghAdapter = {
      name: "greenhouse", type: "ats",
      fetch: async () => [{
        externalId: "gh-77",
        title: "Senior Platform Engineer",
        description: "Own the platform: build resilient services, APIs and pipelines with Go and Kubernetes.",
        companyName: "Northwind",
        location: "Remote",
        workType: "Remote",
        jobType: "Full-time",
        originalUrl: "https://boards.greenhouse.io/northwind/jobs/77",
        applyUrl: "https://boards.greenhouse.io/northwind/jobs/77",
      }],
    };
    await runSourceSync(board, { adapter: ghAdapter });

    safeGet.mockResolvedValue(okBody({ page_count: 1, results: [museJob()] }));
    await runSourceSync(muse);

    const activeGroups = await JobGroup.find({ status: "active" }).lean();
    expect(activeGroups).toHaveLength(1);
    const urls = activeGroups[0].sources.map((s) => s.applyUrl).sort();
    expect(urls).toEqual([
      "https://boards.greenhouse.io/northwind/jobs/77",
      "https://www.themuse.com/jobs/northwind/senior-platform-engineer",
    ]);
  });
});
