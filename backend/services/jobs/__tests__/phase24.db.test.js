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
import { getSourceCoverage } from "../../../controllers_new/adminCatalogController.js";
import { AGGREGATOR_DEFS, aggregatorHasCredentials } from "../../sources/aggregatorSources.js";
import { validateSourceConfig } from "../../sources/configValidation.js";
import { safeGet, SourceHttpError } from "../../sources/httpClient.js";

useTestDb();

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });
const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

const adzunaPayload = (n = 3) => ({
  results: Array.from({ length: n }, (_, i) => ({
    id: 1000 + i,
    title: `Software Engineer ${i}`,
    description: "<p>Build things</p>",
    company: { display_name: `Acme ${i}` },
    location: { display_name: "Bengaluru, India" },
    redirect_url: `https://www.adzuna.in/land/ad/${1000 + i}?se=tok`,
    created: "2026-09-09T00:00:00Z",
    category: { label: "IT Jobs" },
  })),
});

beforeEach(async () => {
  safeGet.mockReset();
  await Promise.all([Job.deleteMany({}), JobGroup.deleteMany({}), JobSource.deleteMany({}), SyncRun.deleteMany({})]);
});

describe("Phase 24 — Adzuna activation", () => {
  it("Adzuna is registered with a credential requirement and valid default config", () => {
    const def = AGGREGATOR_DEFS.find((d) => d.key === "adzuna");
    expect(def.credentialEnvs).toEqual(["ADZUNA_APP_ID", "ADZUNA_APP_KEY"]);
    expect(validateSourceConfig("adzuna", def.config).ok).toBe(true);
    expect(aggregatorHasCredentials(def, {})).toBe(false);
    expect(aggregatorHasCredentials(def, { ADZUNA_APP_ID: "x", ADZUNA_APP_KEY: "y" })).toBe(true);
  });

  it("a real Adzuna sync ingests jobs → Job + JobGroup, preserves the tracked apply URL", async () => {
    process.env.__T_ADZ_ID = "id"; process.env.__T_ADZ_KEY = "key";
    const src = await JobSource.create({
      key: "adzuna", name: "Adzuna", type: "aggregator", adapter: "adzuna", enabled: true,
      config: { appIdRef: "__T_ADZ_ID", appKeyRef: "__T_ADZ_KEY", country: "in", pages: 1, queries: ["software engineer"] },
    });
    safeGet.mockResolvedValue(okBody(adzunaPayload(3)));

    const r = await runSourceSync(src);
    expect(r.ok).toBe(true);
    expect(r.counts.inserted).toBe(3);
    const job = await Job.findOne({ sourceId: src._id, externalId: "adzuna-1000" }).lean();
    expect(job.applyUrl).toBe("https://www.adzuna.in/land/ad/1000?se=tok");
    expect(job.groupId).toBeTruthy();
    // credential value never persisted
    expect(JSON.stringify(await Job.find({ sourceId: src._id }).lean())).not.toContain("\"key\"");
    delete process.env.__T_ADZ_ID; delete process.env.__T_ADZ_KEY;
  });

  it("a failed Adzuna fetch records an error SyncRun and never mass-expires", async () => {
    process.env.__T_ADZ_ID = "id"; process.env.__T_ADZ_KEY = "key";
    const src = await JobSource.create({
      key: "adzuna", name: "Adzuna", type: "aggregator", adapter: "adzuna", enabled: true,
      config: { appIdRef: "__T_ADZ_ID", appKeyRef: "__T_ADZ_KEY", country: "in", pages: 1, queries: ["x"] },
    });
    safeGet.mockResolvedValueOnce(okBody(adzunaPayload(2)));
    await runSourceSync(src);
    const before = await Job.countDocuments({ sourceId: src._id, status: "active" });

    safeGet.mockRejectedValue(new SourceHttpError("HTTP 429 from api.adzuna.com", "http"));
    const r2 = await runSourceSync(src);
    expect(r2.ok).toBe(false);
    expect(await Job.countDocuments({ sourceId: src._id, status: "active" })).toBe(before);
    const run = await SyncRun.findOne({ sourceId: src._id }).sort({ startedAt: -1 }).lean();
    expect(run.status).toBe("error");
    delete process.env.__T_ADZ_ID; delete process.env.__T_ADZ_KEY;
  });
});

describe("Phase 24 — source-coverage worker & schedule diagnostics", () => {
  it("reports nextExpectedSyncAt for an enabled source and a worker block", async () => {
    await JobSource.create({ key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true, config: { count: 50 }, schedule: "0 */6 * * *", lastSyncAt: new Date() });
    await JobSource.create({ key: "themuse:g", name: "The Muse", type: "aggregator", adapter: "themuse", enabled: true, config: {}, schedule: "0 */3 * * *", lastSyncAt: new Date("2020-01-01") });

    const res = mockRes();
    await getSourceCoverage({}, res);
    const rows = Object.fromEntries(res.body.data.sources.map((r) => [r.key, r]));

    expect(rows["jobicy:g"].nextExpectedSyncAt).toBeTruthy();
    expect(new Date(rows["jobicy:g"].nextExpectedSyncAt).getUTCHours() % 6).toBe(0);

    const w = res.body.data.worker;
    expect(w.scheduledSources).toBe(2);
    expect(w.overdueScheduledSources).toContain("themuse:g"); // synced in 2020 → overdue
    expect(w.allScheduledOverdue).toBe(false); // jobicy just synced
  });

  it("health.contributing counts only enabled sources with active jobs", async () => {
    const a = await JobSource.create({ key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: true, config: {}, lastSyncAt: new Date() });
    await JobSource.create({ key: "adzuna:g", name: "Adzuna", type: "aggregator", adapter: "adzuna", enabled: true, config: { appIdRef: "ADZUNA_APP_ID", appKeyRef: "ADZUNA_APP_KEY" }, lastSyncAt: new Date() });
    await Job.collection.insertOne({ _id: (await import("mongoose")).default.Types.ObjectId.createFromTime(1), title: "X", description: "y".repeat(30), sourceId: a._id, status: "active", isActive: true, dedupeHash: "h", groupKey: "h", groupId: (await import("mongoose")).default.Types.ObjectId.createFromTime(2) });

    const res = mockRes();
    await getSourceCoverage({}, res);
    expect(res.body.data.health.enabled).toBe(2);
    expect(res.body.data.health.contributing).toBe(1); // only jobicy:g has an active job
  });
});
