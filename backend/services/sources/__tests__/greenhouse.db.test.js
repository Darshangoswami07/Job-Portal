import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { SyncRun } from "../../../models_new/SyncRun.js";
import { safeGet } from "../httpClient.js";
import { GREENHOUSE_ADAPTER } from "../greenhouse.js";
import { runSourceSync } from "../../jobs/sync.js";
import { searchJobs } from "../../../controllers/job.controller.js";

useTestDb();

const KEY = "greenhouse:acme";

const ghJob = (over = {}) => ({
  id: 100,
  title: "Backend Engineer",
  updated_at: "2024-07-15T10:00:00Z",
  first_published: "2024-07-01T09:00:00Z",
  location: { name: "Bengaluru, India" },
  absolute_url: "https://boards.greenhouse.io/acme/jobs/100",
  company_name: "Acme Inc",
  departments: [{ name: "Engineering" }],
  metadata: [],
  content: "&lt;p&gt;Build APIs and services for the platform team.&lt;/p&gt;",
  ...over,
});

const respond = (jobs) => ({
  status: 200,
  headers: {},
  body: JSON.stringify({ jobs, meta: { total: jobs.length } }),
  url: "x",
});

async function makeSource(over = {}) {
  return JobSource.create({
    key: KEY,
    name: "Greenhouse",
    type: "ats",
    adapter: GREENHOUSE_ADAPTER,
    enabled: true,
    rateLimitPerMin: 0,
    config: { boardToken: "acme", companyName: "Acme Inc" },
    ...over,
  });
}

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

beforeEach(() => {
  safeGet.mockReset();
});

describe("Greenhouse sync → ingest → Job/JobGroup", () => {
  it("inserts external jobs with preserved URLs and a SyncRun", async () => {
    safeGet.mockResolvedValue(respond([ghJob(), ghJob({ id: 101, title: "Product Designer", location: { name: "Remote - US" } })]));
    const source = await makeSource();

    const result = await runSourceSync(source);
    expect(result.ok).toBe(true);
    expect(result.counts.fetched).toBe(2);
    expect(result.counts.inserted).toBe(2);

    const jobs = await Job.find().sort({ externalId: 1 }).lean();
    expect(jobs).toHaveLength(2);
    const j = jobs[0];
    expect(j.sourceType).toBe("ats");
    expect(j.sourceName).toBe("Greenhouse");
    expect(j.applyType).toBe("external");
    expect(j.externalId).toBe("100");
    expect(String(j.sourceId)).toBe(String(source._id));
    expect(j.originalUrl).toBe("https://boards.greenhouse.io/acme/jobs/100");
    expect(j.applyUrl).toBe("https://boards.greenhouse.io/acme/jobs/100");
    expect(j.description).toContain("<p>");
    expect(j.groupId).toBeTruthy();
    expect(j.companyName).toBe("Acme Inc");

    const run = await SyncRun.findById(result.runId).lean();
    expect(run.status).toBe("ok");
    expect(run.inserted).toBe(2);

    const src = await JobSource.findById(source._id).lean();
    expect(src.lastSyncStatus).toBe("ok");
    expect(src.stats.imported).toBe(2);
    expect(src.lastSyncAt).toBeInstanceOf(Date);
  });

  it("re-syncing is idempotent — no duplicates, URLs unchanged", async () => {
    safeGet.mockResolvedValue(respond([ghJob()]));
    const source = await makeSource();

    await runSourceSync(source);
    const first = await Job.findOne({ externalId: "100" }).lean();

    const second = await runSourceSync(source);
    expect(await Job.countDocuments()).toBe(1);
    expect(await JobGroup.countDocuments()).toBe(1);
    expect(second.counts.inserted || 0).toBe(0);

    const after = await Job.findOne({ externalId: "100" }).lean();
    expect(after.originalUrl).toBe(first.originalUrl);
    expect(after.applyUrl).toBe(first.applyUrl);
    expect(String(after.groupId)).toBe(String(first.groupId));
  });

  it("groups the same posting into one JobGroup; unrelated postings stay separate", async () => {
    safeGet.mockResolvedValue(
      respond([ghJob(), ghJob({ id: 200, title: "Principal Data Scientist" })])
    );
    const source = await makeSource();
    await runSourceSync(source);
    expect(await JobGroup.countDocuments()).toBe(2);

    // re-sync same payload → still 2 groups, each with 1 source
    await runSourceSync(source);
    const groups = await JobGroup.find().lean();
    expect(groups).toHaveLength(2);
    for (const g of groups) expect(g.sources).toHaveLength(1);
  });

  it("records a per-record failure as a partial run without losing good jobs", async () => {
    safeGet.mockResolvedValue(
      respond([ghJob(), ghJob({ id: 101, title: "No Description Role", content: "" })])
    );
    const source = await makeSource();
    const result = await runSourceSync(source);

    expect(result.ok).toBe(true);
    expect(result.errors).toBe(1);
    expect(await Job.countDocuments()).toBe(1); // the good one persisted

    const run = await SyncRun.findById(result.runId).lean();
    expect(run.status).toBe("partial");
    expect(run.errorLog.length).toBe(1);
  });

  it("an EMPTY Greenhouse response does not wipe previously-synced jobs", async () => {
    const source = await makeSource();
    safeGet.mockResolvedValueOnce(respond([ghJob(), ghJob({ id: 101, title: "Designer" })]));
    await runSourceSync(source);
    expect(await Job.countDocuments({ status: "active" })).toBe(2);

    safeGet.mockResolvedValueOnce(respond([])); // board returns nothing (maybe broken config)
    const r = await runSourceSync(source);
    expect(r.counts.deactivated).toBe(0);
    expect(await Job.countDocuments({ status: "active" })).toBe(2);
  });

  it("a posting dropped from a NON-empty sync is conservatively expired", async () => {
    const source = await makeSource();
    safeGet.mockResolvedValueOnce(respond([ghJob(), ghJob({ id: 101, title: "Designer" })]));
    await runSourceSync(source);

    safeGet.mockResolvedValueOnce(respond([ghJob()])); // 101 gone
    await runSourceSync(source);

    const gone = await Job.findOne({ externalId: "101" }).lean();
    expect(gone.status).toBe("expired");
    expect(gone.isActive).toBe(false);
    expect(await Job.countDocuments({ status: "active" })).toBe(1);
  });

  it("a failed fetch marks the SyncRun errored, bumps health, and leaves jobs intact", async () => {
    const source = await makeSource();
    safeGet.mockResolvedValueOnce(respond([ghJob()]));
    await runSourceSync(source);

    safeGet.mockRejectedValueOnce(new Error("ETIMEDOUT"));
    const r = await runSourceSync(source);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ETIMEDOUT/);

    const run = await SyncRun.findById(r.runId).lean();
    expect(run.status).toBe("error");
    const src = await JobSource.findById(source._id).lean();
    expect(src.lastSyncStatus).toBe("error");
    expect(src.health.consecutiveFailures).toBe(1);
    expect(await Job.countDocuments({ status: "active" })).toBe(1); // untouched
  });
});

describe("Greenhouse jobs in GET /api/v1/job/search", () => {
  beforeEach(async () => {
    await Job.init();
    safeGet.mockResolvedValue(
      respond([
        ghJob({ id: 1, title: "Senior Backend Engineer", location: { name: "Bengaluru, India" } }),
        ghJob({ id: 2, title: "Remote Frontend Engineer", location: { name: "Remote - US" } }),
      ])
    );
    await runSourceSync(await makeSource());
  });

  it("returns Greenhouse jobs and exposes the source in meta", async () => {
    const res = mockRes();
    await searchJobs({ query: {} }, res);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.meta.sources).toContain("Greenhouse");
    expect(res.body.jobs.every((j) => j.sourceName === "Greenhouse")).toBe(true);
    expect(res.body.jobs.every((j) => j.applyType === "external")).toBe(true);
  });

  it("filters by source", async () => {
    const res = mockRes();
    await searchJobs({ query: { source: "Greenhouse" } }, res);
    expect(res.body.pagination.total).toBe(2);

    const none = mockRes();
    await searchJobs({ query: { source: "Lever" } }, none);
    expect(none.body.pagination.total).toBe(0);
  });

  it("filters by remoteType and keyword", async () => {
    const remote = mockRes();
    await searchJobs({ query: { remoteType: "remote" } }, remote);
    expect(remote.body.jobs.map((j) => j.title)).toEqual(["Remote Frontend Engineer"]);

    const kw = mockRes();
    await searchJobs({ query: { q: "backend" } }, kw);
    expect(kw.body.jobs.map((j) => j.title)).toContain("Senior Backend Engineer");
  });
});
