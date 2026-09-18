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
import { AdzunaAdapter } from "../../sources/adzuna.js";
import { safeGet, SourceHttpError } from "../../sources/httpClient.js";

useTestDb();

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });
const adzResult = (n, offset = 0) => ({
  count: 9999,
  results: Array.from({ length: n }, (_, i) => ({
    id: 1000 + offset + i,
    title: `Engineer ${offset + i}`,
    description: "<p>Build resilient services for the platform team every day.</p>",
    company: { display_name: `Acme ${offset + i}` },
    location: { display_name: "Bengaluru, India" },
    redirect_url: `https://www.adzuna.in/land/ad/${1000 + offset + i}?se=tok`,
    created: "2026-09-09T00:00:00Z",
  })),
});

beforeEach(async () => {
  safeGet.mockReset();
  process.env.__T_ADZ_ID = "id"; process.env.__T_ADZ_KEY = "k";
  await Promise.all([Job.deleteMany({}), JobGroup.deleteMany({}), JobSource.deleteMany({}), SyncRun.deleteMany({})]);
});

const adzunaSource = (over = {}) =>
  JobSource.create({
    key: "adzuna", name: "Adzuna", type: "aggregator", adapter: "adzuna", enabled: true,
    staleAfterDays: 21,
    config: { appIdRef: "__T_ADZ_ID", appKeyRef: "__T_ADZ_KEY", ...over },
  });

describe("Phase 27 — Adzuna high-volume ingestion", () => {
  it("fans out across keywords × countries × pages, records rich SyncRun metrics", async () => {
    const src = await adzunaSource({ countries: ["in", "gb"], keywords: ["a", "b"], maxPagesPerQuery: 2, resultsPerPage: 3 });
    let call = 0;
    safeGet.mockImplementation(() => okBody(adzResult(3, (call++) * 3)));

    const r = await runSourceSync(src, { mode: "backfill" });
    expect(r.ok).toBe(true);
    // 2 keywords × 2 countries × 2 pages = 8 requests
    expect(safeGet).toHaveBeenCalledTimes(8);
    expect(r.metrics.pagesRequested).toBe(8);
    expect(r.metrics.providerResults).toBe(24);
    expect(r.metrics.countries.sort()).toEqual(["gb", "in"]);
    expect(r.counts.inserted).toBe(24);

    const run = await SyncRun.findById(r.runId).lean();
    expect(run.mode).toBe("backfill");
    expect(run.metrics.providerResults).toBe(24);
  });

  it("de-dupes the same provider id returned by multiple queries (no catalog inflation)", async () => {
    const src = await adzunaSource({ countries: [""], keywords: ["a", "b"], maxPagesPerQuery: 1, resultsPerPage: 5 });
    safeGet.mockResolvedValue(okBody(adzResult(5, 0))); // every query returns the SAME 5 ids

    const r = await runSourceSync(src, { mode: "incremental" });
    expect(r.counts.inserted).toBe(5);
    expect(r.metrics.deduped).toBe(5); // second query's 5 ids skipped
    expect(await Job.countDocuments({ sourceId: src._id })).toBe(5);
  });

  it("repeated backfill is idempotent — no duplicate Job rows", async () => {
    const src = await adzunaSource({ countries: [""], keywords: ["a"], maxPagesPerQuery: 1, resultsPerPage: 4 });
    safeGet.mockResolvedValue(okBody(adzResult(4)));
    await runSourceSync(src, { mode: "backfill" });
    const r2 = await runSourceSync(src, { mode: "backfill" });
    expect(r2.counts.inserted).toBe(0);
    expect(r2.counts.unchanged).toBe(4);
    expect(await Job.countDocuments({ sourceId: src._id })).toBe(4);
  });

  it("a partial-coverage / backfill run NEVER expires jobs it did not see this run", async () => {
    const src = await adzunaSource({ countries: [""], keywords: ["a"], maxPagesPerQuery: 1, resultsPerPage: 3 });
    // first run ingests ids 1000-1002
    safeGet.mockResolvedValue(okBody(adzResult(3, 0)));
    await runSourceSync(src, { mode: "backfill" });
    expect(await Job.countDocuments({ sourceId: src._id, status: "active" })).toBe(3);

    // second run (different keyword window) returns totally different ids
    safeGet.mockResolvedValue(okBody(adzResult(3, 500)));
    const r2 = await runSourceSync(src, { mode: "backfill" });
    expect(r2.ok).toBe(true);
    expect(r2.counts.deactivated).toBe(0); // the first 3 are NOT expired
    expect(await Job.countDocuments({ sourceId: src._id, status: "active" })).toBe(6);
  });

  it("429 before any results → hard failure; 429 mid-run → keep what we have", async () => {
    const src = await adzunaSource({ countries: [""], keywords: ["a", "b", "c"], maxPagesPerQuery: 1, resultsPerPage: 3 });
    // first request 429s immediately
    safeGet.mockRejectedValue(new SourceHttpError("HTTP 429 from api.adzuna.com", "http"));
    const r1 = await runSourceSync(src, { mode: "backfill" });
    expect(r1.ok).toBe(false);

    // now: 1st ok, 2nd 429 → keep the first page's jobs
    let n = 0;
    safeGet.mockImplementation(() => {
      n += 1;
      if (n === 1) return Promise.resolve(okBody(adzResult(3, 0)));
      return Promise.reject(new SourceHttpError("HTTP 429 from api.adzuna.com", "http"));
    });
    const r2 = await runSourceSync(src, { mode: "backfill" });
    expect(r2.ok).toBe(true);
    expect(r2.counts.inserted).toBe(3);
    expect(r2.metrics.rateLimited).toBe(1);
  });

  it("only queries markets Adzuna's API actually serves", async () => {
    const src = await adzunaSource({ countries: ["in", "atlantis", "gb"], keywords: ["a"], maxPagesPerQuery: 1 });
    safeGet.mockResolvedValue(okBody(adzResult(1)));
    const r = await runSourceSync(src, { mode: "incremental" });
    expect(r.metrics.countries.sort()).toEqual(["gb", "in"]); // "atlantis" dropped
  });

  it("Apply URL (Adzuna tracked redirect) is preserved verbatim on every job", async () => {
    const src = await adzunaSource({ countries: [""], keywords: ["a"], maxPagesPerQuery: 1, resultsPerPage: 2 });
    safeGet.mockResolvedValue(okBody(adzResult(2)));
    await runSourceSync(src, { mode: "backfill" });
    const jobs = await Job.find({ sourceId: src._id }).lean();
    for (const j of jobs) {
      expect(j.applyUrl).toMatch(/^https:\/\/www\.adzuna\.in\/land\/ad\/\d+\?se=tok$/);
      expect(j.applyType).toBe("external");
    }
  });

  it("provider failure is isolated — a thrown fetch records an error SyncRun, jobs preserved", async () => {
    const src = await adzunaSource({ countries: [""], keywords: ["a"], maxPagesPerQuery: 1 });
    safeGet.mockResolvedValueOnce(okBody(adzResult(2)));
    await runSourceSync(src, { mode: "backfill" });
    const before = await Job.countDocuments({ sourceId: src._id, status: "active" });

    safeGet.mockRejectedValue(new SourceHttpError("HTTP 503", "http"));
    const r = await runSourceSync(src, { mode: "incremental" });
    expect(r.ok).toBe(false);
    expect(await Job.countDocuments({ sourceId: src._id, status: "active" })).toBe(before);
    const run = await SyncRun.findOne({ sourceId: src._id }).sort({ startedAt: -1 }).lean();
    expect(run.status).toBe("error");
  });
});

describe("Phase 27 — adapter coverage flag", () => {
  it("keyword-search aggregators are marked partial-coverage", () => {
    expect(new AdzunaAdapter().coverage).toBe("partial");
  });
});
