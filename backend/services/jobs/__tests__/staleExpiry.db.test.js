import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../sources/httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { safeGet } from "../../sources/httpClient.js";
import { runSourceSync } from "../sync.js";

useTestDb();

const DAY = 86_400_000;

const ghPayload = (jobs) => ({
  status: 200,
  headers: {},
  body: JSON.stringify({ jobs, meta: { total: jobs.length } }),
  url: "x",
});
const ghJob = (id, extra = "") => ({
  id,
  title: `Role ${id}`,
  company_name: "Acme",
  location: { name: "Remote" },
  absolute_url: `https://boards.greenhouse.io/acme/jobs/${id}`,
  content: `&lt;p&gt;Role ${id}${extra}&lt;/p&gt;`,
  metadata: [],
});

async function mkSource(over = {}) {
  return JobSource.create({
    key: "gh:stale",
    name: "GH",
    type: "ats",
    adapter: "greenhouse",
    enabled: true,
    rateLimitPerMin: 0,
    staleAfterDays: 30,
    config: { boardToken: "acme" },
    ...over,
  });
}

/** Backdate a job so it looks unseen for `days`. */
const ageJob = (externalId, days) =>
  Job.updateOne(
    { externalId },
    { $set: { lastSeenAt: new Date(Date.now() - days * DAY), firstSeenAt: new Date(Date.now() - days * DAY) } }
  );

beforeEach(() => {
  safeGet.mockReset();
});

describe("source-aware stale expiry", () => {
  it("keeps a job newer than the threshold; expires one older than it", async () => {
    const src = await mkSource();
    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1), ghJob(2)]));
    await runSourceSync(src);
    await ageJob("2", 45); // job 2 has not been seen for 45 days

    // next sync returns only job 1 (job 2 gone from the feed for 45 days)
    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    const r = await runSourceSync(src);
    expect(r.ok).toBe(true);

    const j1 = await Job.findOne({ externalId: "1" }).lean();
    const j2 = await Job.findOne({ externalId: "2" }).lean();
    expect(j1.status).toBe("active");
    expect(j2.status).toBe("expired");
    expect(j2.isActive).toBe(false);
  });

  it("a source without staleAfterDays does not auto-expire on the stale path", async () => {
    const src = await mkSource({ staleAfterDays: 0 });
    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    await runSourceSync(src);
    await ageJob("1", 400);

    // return the same job — the "unseen" sweep won't touch it (it IS seen),
    // and with staleAfterDays=0 there is no stale sweep
    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    await runSourceSync(src);
    expect((await Job.findOne({ externalId: "1" }).lean()).status).toBe("active");
  });

  it("a FAILED sync does not mass-expire jobs", async () => {
    const src = await mkSource();
    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1), ghJob(2)]));
    await runSourceSync(src);
    await ageJob("1", 60);
    await ageJob("2", 60);

    safeGet.mockRejectedValueOnce(new Error("ETIMEDOUT"));
    const r = await runSourceSync(src);
    expect(r.ok).toBe(false);
    expect(await Job.countDocuments({ sourceId: src._id, status: "active" })).toBe(2);
  });

  it("an EMPTY successful sync only expires jobs past the stale threshold", async () => {
    const src = await mkSource();
    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1), ghJob(2)]));
    await runSourceSync(src);
    await ageJob("1", 5); // recent
    await ageJob("2", 40); // stale

    safeGet.mockResolvedValueOnce(ghPayload([])); // board returns nothing
    await runSourceSync(src);

    expect((await Job.findOne({ externalId: "1" }).lean()).status).toBe("active"); // NOT mass-expired
    expect((await Job.findOne({ externalId: "2" }).lean()).status).toBe("expired");
  });

  it("a previously expired job REACTIVATES when it reappears in a valid sync", async () => {
    const src = await mkSource();
    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    await runSourceSync(src);
    await Job.updateOne({ externalId: "1" }, { $set: { status: "expired", isActive: false } });

    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    await runSourceSync(src);

    const j = await Job.findOne({ externalId: "1" }).lean();
    expect(j.status).toBe("active");
    expect(j.isActive).toBe(true);
    expect(j.lastSeenAt.getTime()).toBeGreaterThan(Date.now() - 5000);
    const group = await JobGroup.findOne({ dedupeHash: j.dedupeHash }).lean();
    expect(group.activeSourceCount).toBe(1);
  });

  it("a job flagged 'error' (dead link) does NOT auto-reactivate just by reappearing", async () => {
    const src = await mkSource();
    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    await runSourceSync(src);
    await Job.updateOne({ externalId: "1" }, { $set: { status: "error", isActive: false } });

    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    await runSourceSync(src);
    expect((await Job.findOne({ externalId: "1" }).lean()).status).toBe("error");
  });

  it("a disabled source is not synced and its jobs are untouched", async () => {
    const src = await mkSource();
    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    await runSourceSync(src);
    await ageJob("1", 90);

    await JobSource.updateOne({ _id: src._id }, { $set: { enabled: false } });
    const disabled = await JobSource.findById(src._id);
    const r = await runSourceSync(disabled);
    expect(r.skipped).toBe("disabled");
    expect((await Job.findOne({ externalId: "1" }).lean()).status).toBe("active");
  });

  it("does not touch another source's jobs", async () => {
    const a = await mkSource();
    const b = await JobSource.create({ key: "gh:b", name: "B", type: "ats", adapter: "greenhouse", enabled: true, rateLimitPerMin: 0, staleAfterDays: 30, config: { boardToken: "b" } });

    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    await runSourceSync(a);
    // manually attach an old job to source b
    await Job.create({
      title: "B job", description: "d".repeat(60), location: "X",
      sourceId: b._id, externalId: "b1", applyType: "external", status: "active",
      lastSeenAt: new Date(Date.now() - 90 * DAY), dedupeHash: "hb",
    });

    safeGet.mockResolvedValueOnce(ghPayload([ghJob(1)]));
    await runSourceSync(a);
    expect((await Job.findOne({ externalId: "b1" }).lean()).status).toBe("active");
  });
});
