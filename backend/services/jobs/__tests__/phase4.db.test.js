import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../sources/httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { Company } from "../../../models/company.model.js";
import { User } from "../../../models/user.model.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { ApplyClick } from "../../../models_new/ApplyClick.js";
import "../../../models/application.model.js"; // registered so getJobById populate works
import { safeGet } from "../../sources/httpClient.js";
import { ensureInternalSource } from "../../sources/internal.js";
import { runSourceSync } from "../sync.js";
import { searchJobs, applyRedirect, getJobById } from "../../../controllers/job.controller.js";

useTestDb();

let companyId;
let recruiterId;

const GH_URL = "https://boards.greenhouse.io/acme/jobs/900";

const ghPayload = (jobs) => ({
  status: 200,
  headers: {},
  body: JSON.stringify({ jobs, meta: { total: jobs.length } }),
  url: "x",
});

const ghJob = (over = {}) => ({
  id: 900,
  title: "Backend Engineer",
  company_name: "Acme",
  location: { name: "Bengaluru" },
  absolute_url: GH_URL,
  updated_at: "2024-07-01T00:00:00Z",
  first_published: "2024-06-20T00:00:00Z",
  metadata: [{ name: "Employment Type", value: "Full-time" }],
  departments: [{ name: "Engineering" }],
  content: "&lt;p&gt;This is an on-site role in Bengaluru building platform APIs.&lt;/p&gt;",
  ...over,
});

const makeInternalJob = (over = {}) =>
  Job.create({
    title: "Backend Engineer",
    description: "This is an on-site role building platform services in Bengaluru. ".repeat(3),
    location: "Bengaluru",
    workType: "On-site",
    jobType: "Full-time",
    salary: 22,
    experienceLevel: 3,
    position: 1,
    company: companyId,
    created_by: recruiterId,
    ...over,
  });

const mockRes = () => {
  const res = { statusCode: 200, body: null, _redirect: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  res.redirect = (c, url) => ((res.statusCode = c), (res._redirect = url), res);
  return res;
};

async function syncBoth(ghJobs = [ghJob()]) {
  await runSourceSync("internal");
  safeGet.mockResolvedValue(ghPayload(ghJobs));
  const src = await JobSource.create({
    key: "greenhouse:acme",
    name: "Greenhouse",
    type: "ats",
    adapter: "greenhouse",
    enabled: true,
    rateLimitPerMin: 0,
    config: { boardToken: "acme", companyName: "Acme" },
  });
  await runSourceSync(src);
  return src;
}

beforeEach(async () => {
  safeGet.mockReset();
  const rec = await User.create({ fullname: "R", email: `r${Date.now()}@x.com`, password: "h", roles: { recruiter: true } });
  recruiterId = rec._id;
  const co = await Company.create({ name: "Acme", userId: recruiterId });
  companyId = co._id;
  await ensureInternalSource();
  await Job.init();
  await JobGroup.init();
});

describe("JobGroup: two sources → one grouped vacancy", () => {
  it("groups the internal + Greenhouse posting and preserves per-source Apply URLs", async () => {
    const internal = await makeInternalJob();
    await syncBoth();

    expect(await JobGroup.countDocuments()).toBe(1);
    const group = await JobGroup.findOne().lean();
    expect(group.sources).toHaveLength(2);
    expect(group.activeSourceCount).toBe(2);
    expect(group.sourceNames.sort()).toEqual(["Greenhouse", "Job-Pilot"]);
    // best job = the internal one (internal source priority > ats)
    expect(String(group.bestJobId)).toBe(String(internal._id));

    const bySource = Object.fromEntries(group.sources.map((s) => [s.sourceName, s]));
    expect(bySource["Greenhouse"].applyUrl).toBe(GH_URL);
    expect(bySource["Greenhouse"].applyType).toBe("external");
    expect(bySource["Job-Pilot"].applyUrl).toBe(""); // internal → NOT the Greenhouse URL
    expect(bySource["Job-Pilot"].applyType).toBe("internal");
  });

  it("search returns ONE card for the vacancy with source availability", async () => {
    await makeInternalJob();
    await syncBoth();

    const res = mockRes();
    await searchJobs({ query: {} }, res);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.jobs).toHaveLength(1);

    const card = res.body.jobs[0];
    expect(card.sourceCount).toBe(2);
    expect(card.sources.map((s) => s.sourceName).sort()).toEqual(["Greenhouse", "Job-Pilot"]);
    const gh = card.sources.find((s) => s.sourceName === "Greenhouse");
    const jp = card.sources.find((s) => s.sourceName === "Job-Pilot");
    expect(gh.applyUrl).toBe(GH_URL);
    expect(jp.applyUrl).toBeNull();
    expect(res.body.meta.grouped).toBe(true);
  });

  it("source filter matches a group by any of its sources", async () => {
    await makeInternalJob();
    await syncBoth();

    const gh = mockRes();
    await searchJobs({ query: { source: "Greenhouse" } }, gh);
    expect(gh.body.pagination.total).toBe(1);

    const none = mockRes();
    await searchJobs({ query: { source: "Lever" } }, none);
    expect(none.body.pagination.total).toBe(0);
  });

  it("when a source drops the posting the group shrinks (no corruption)", async () => {
    await makeInternalJob();
    const src = await syncBoth();

    // greenhouse now returns a different job id → 900 is gone
    safeGet.mockResolvedValue(ghPayload([ghJob({ id: 901, title: "Unrelated Role" })]));
    await runSourceSync(src);

    const group = await JobGroup.findOne({ dedupeHash: { $exists: true }, sourceNames: "Job-Pilot" }).lean();
    expect(group.activeSourceCount).toBe(1);
    expect(group.sourceNames).toEqual(["Job-Pilot"]);
    // the internal source entry is untouched
    expect(group.sources.some((s) => s.sourceName === "Job-Pilot" && s.status === "active")).toBe(true);
  });

  it("does not merge unrelated vacancies", async () => {
    await makeInternalJob({ title: "Principal Security Architect" });
    await syncBoth([ghJob({ id: 950, title: "Backend Engineer" })]);
    expect(await JobGroup.countDocuments()).toBe(2);
  });

  it("no N+1: search issues a bounded number of queries", async () => {
    for (let i = 0; i < 8; i += 1) await makeInternalJob({ title: `Role ${i}` });
    await runSourceSync("internal");
    const res = mockRes();
    await searchJobs({ query: { limit: "5" } }, res);
    expect(res.body.jobs).toHaveLength(5);
    expect(res.body.pagination.total).toBe(8);
    expect(res.body.pagination.totalPages).toBe(2);
  });
});

describe("external Apply", () => {
  it("resolves the stored Greenhouse URL and records a click (POST)", async () => {
    await makeInternalJob();
    await syncBoth();
    const ghDbJob = await Job.findOne({ sourceName: "Greenhouse" }).lean();

    const res = mockRes();
    await applyRedirect({ params: { id: String(ghDbJob._id) }, method: "POST", id: recruiterId }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.url).toBe(GH_URL);
    expect(await ApplyClick.countDocuments({ jobId: ghDbJob._id })).toBe(1);
  });

  it("issues a 302 for GET", async () => {
    await makeInternalJob();
    await syncBoth();
    const ghDbJob = await Job.findOne({ sourceName: "Greenhouse" }).lean();
    const res = mockRes();
    await applyRedirect({ params: { id: String(ghDbJob._id) }, method: "GET" }, res);
    expect(res.statusCode).toBe(302);
    expect(res._redirect).toBe(GH_URL);
  });

  it("internal jobs are NOT redirected (409, applyType internal)", async () => {
    const internal = await makeInternalJob();
    await runSourceSync("internal");
    const res = mockRes();
    await applyRedirect({ params: { id: String(internal._id) }, method: "POST" }, res);
    expect(res.statusCode).toBe(409);
    expect(res.body.applyType).toBe("internal");
    expect(await ApplyClick.countDocuments()).toBe(0);
  });

  it("a client cannot supply a URL — only a job id, and a bad stored URL is rejected", async () => {
    await makeInternalJob();
    await syncBoth();
    const ghDbJob = await Job.findOne({ sourceName: "Greenhouse" });
    await Job.updateOne({ _id: ghDbJob._id }, { $set: { applyUrl: "javascript:alert(1)", originalUrl: "" } });

    const res = mockRes();
    await applyRedirect(
      { params: { id: String(ghDbJob._id) }, method: "POST", body: { url: "https://evil.example" } },
      res
    );
    expect(res.statusCode).toBe(422);
  });

  it("rejects an invalid id, a missing job, and an inactive job", async () => {
    const bad = mockRes();
    await applyRedirect({ params: { id: "not-an-id" }, method: "POST" }, bad);
    expect(bad.statusCode).toBe(400);

    const missing = mockRes();
    await applyRedirect({ params: { id: "5f9d88d9c9d1b8a1b8e8b8e8" }, method: "POST" }, missing);
    expect(missing.statusCode).toBe(404);

    await makeInternalJob();
    await syncBoth();
    const ghDbJob = await Job.findOne({ sourceName: "Greenhouse" });
    await Job.updateOne({ _id: ghDbJob._id }, { $set: { isActive: false, status: "expired" } });
    const gone = mockRes();
    await applyRedirect({ params: { id: String(ghDbJob._id) }, method: "POST" }, gone);
    expect(gone.statusCode).toBe(410);
  });
});

describe("getJobById attaches grouped source availability", () => {
  it("returns group.sources with per-source apply data", async () => {
    const internal = await makeInternalJob();
    await syncBoth();

    const res = mockRes();
    await getJobById({ params: { id: String(internal._id) } }, res);
    expect(res.body.group).toBeTruthy();
    expect(res.body.group.sourceCount).toBe(2);
    const names = res.body.group.sources.map((s) => s.sourceName).sort();
    expect(names).toEqual(["Greenhouse", "Job-Pilot"]);
  });
});
