import { describe, it, expect, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { User } from "../../../models/user.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { RecommendationDismissal } from "../../../models_new/RecommendationDismissal.js";
import {
  getJobRecommendations,
  getJobMatchExplanation,
  dismissJob,
  undismissJob,
} from "../../../controllers_new/recommendationController.js";
import { getRecoMetrics } from "../../../controllers_new/adminRecoController.js";
import { runRecoPrecompute } from "../recoPrecompute.js";
import { _cacheClear, _cacheSize } from "../recoCache.js";

useTestDb();

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};
const oid = () => new mongoose.Types.ObjectId();

async function makeGroup(over = {}) {
  const jobId = oid();
  return JobGroup.create({
    dedupeHash: over.dedupeHash || `h${Math.random().toString(36).slice(2)}`,
    displayTitle: "Backend Engineer",
    normalizedTitle: "backend engineer",
    companyName: "Acme",
    normalizedCompany: "acme",
    location: "Bengaluru",
    normalizedLocation: "bengaluru",
    remoteType: "remote",
    seniority: "senior",
    jobType: "Full-time",
    experienceLevel: 4,
    industry: "Technology",
    skills: ["Node.js", "MongoDB"],
    descriptionPreview: "Build Node.js services.",
    status: "active",
    bestJobId: jobId,
    sources: [{ jobId, sourceName: "Job-Pilot", sourceType: "internal", applyType: "internal", status: "active", applyUrl: "" }],
    activeSourceCount: 1,
    postedAt: new Date(),
    ...over,
  });
}

const seekerProfile = {
  skills: ["React", "Node.js", "TypeScript", "MongoDB"],
  headline: "Senior Backend Engineer",
  location: "Bengaluru",
  workPreference: "Remote",
  employmentType: "Full time",
  experience: [{ title: "Backend Engineer", startDate: "2019-01-01", current: true }],
};

let seeker;
let other;

beforeEach(async () => {
  _cacheClear();
  await JobGroup.createIndexes();
  seeker = await User.create({ fullname: "S", email: `s${Date.now()}@x.com`, password: "h", roles: { jobSeeker: true }, profile: seekerProfile });
  other = await User.create({ fullname: "O", email: `o${Date.now()}@x.com`, password: "h", roles: { jobSeeker: true }, profile: seekerProfile });
});
afterEach(() => { delete process.env.RECO_PRECOMPUTE_ENABLED; });

describe("dismiss / not interested", () => {
  it("dismisses a group, is idempotent, and excludes it from future recommendations", async () => {
    const keep = await makeGroup({ displayTitle: "Node.js Developer", normalizedTitle: "node.js developer" });
    const drop = await makeGroup({ displayTitle: "Senior Backend Engineer", normalizedTitle: "senior backend engineer" });

    const d1 = mockRes();
    await dismissJob({ id: seeker._id, params: { groupId: String(drop._id) }, body: { reason: "not relocating" } }, d1);
    expect(d1.statusCode).toBe(200);
    // idempotent
    await dismissJob({ id: seeker._id, params: { groupId: String(drop._id) }, body: {} }, mockRes());
    expect(await RecommendationDismissal.countDocuments({ userId: seeker._id })).toBe(1);

    const recs = mockRes();
    await getJobRecommendations({ id: seeker._id, query: {} }, recs);
    const titles = recs.body.jobs.map((j) => j.title);
    expect(titles).toContain("Node.js Developer");
    expect(titles).not.toContain("Senior Backend Engineer");
  });

  it("suppresses the SAME vacancy seen through another source (groupKey based)", async () => {
    const g = await makeGroup({
      dedupeHash: "shared-hash",
      displayTitle: "Senior Backend Engineer",
      sources: [
        { jobId: oid(), sourceName: "Greenhouse", sourceType: "ats", applyType: "external", status: "active", applyUrl: "https://x/1" },
        { jobId: oid(), sourceName: "Lever", sourceType: "ats", applyType: "external", status: "active", applyUrl: "https://y/2" },
      ],
      activeSourceCount: 2,
    });
    await dismissJob({ id: seeker._id, params: { groupId: String(g._id) }, body: {} }, mockRes());
    const recs = mockRes();
    await getJobRecommendations({ id: seeker._id, query: {} }, recs);
    expect(recs.body.jobs.map((j) => j.title)).not.toContain("Senior Backend Engineer");
  });

  it("undismiss restores the group", async () => {
    const g = await makeGroup({ displayTitle: "Senior Backend Engineer", normalizedTitle: "senior backend engineer" });
    await dismissJob({ id: seeker._id, params: { groupId: String(g._id) }, body: {} }, mockRes());
    const u = mockRes();
    await undismissJob({ id: seeker._id, params: { groupId: String(g._id) } }, u);
    expect(u.statusCode).toBe(200);
    expect(await RecommendationDismissal.countDocuments({ userId: seeker._id })).toBe(0);
  });

  it("400 on invalid id, 404 on unknown group", async () => {
    const a = mockRes();
    await dismissJob({ id: seeker._id, params: { groupId: "nope" }, body: {} }, a);
    expect(a.statusCode).toBe(400);
    const b = mockRes();
    await dismissJob({ id: seeker._id, params: { groupId: String(oid()) }, body: {} }, b);
    expect(b.statusCode).toBe(404);
  });

  it("one user's dismissal does not affect another user", async () => {
    const g = await makeGroup({ displayTitle: "Senior Backend Engineer", normalizedTitle: "senior backend engineer" });
    await dismissJob({ id: seeker._id, params: { groupId: String(g._id) }, body: {} }, mockRes());
    const recs = mockRes();
    await getJobRecommendations({ id: other._id, query: {} }, recs);
    expect(recs.body.jobs.map((j) => j.title)).toContain("Senior Backend Engineer");
  });
});

describe("caching in the endpoint", () => {
  it("second call is served from cache (meta.cached) until an activity invalidates it", async () => {
    await makeGroup({ displayTitle: "Senior Backend Engineer", normalizedTitle: "senior backend engineer" });
    const r1 = mockRes();
    await getJobRecommendations({ id: seeker._id, query: {} }, r1);
    expect(r1.body.meta.cached).toBeUndefined();

    const r2 = mockRes();
    await getJobRecommendations({ id: seeker._id, query: {} }, r2);
    expect(r2.body.meta.cached).toBe(true);

    // a dismissal invalidates the user's cache
    const g2 = await makeGroup({ displayTitle: "Node.js Developer", normalizedTitle: "node.js developer" });
    await dismissJob({ id: seeker._id, params: { groupId: String(g2._id) }, body: {} }, mockRes());
    const r3 = mockRes();
    await getJobRecommendations({ id: seeker._id, query: {} }, r3);
    expect(r3.body.meta.cached).toBeUndefined();
  });
});

describe("background precompute", () => {
  it("is a no-op when disabled", async () => {
    const r = await runRecoPrecompute({ env: {} });
    expect(r).toMatchObject({ enabled: false, skipped: "disabled" });
  });

  it("processes eligible job-seekers, warms the cache, and isolates a single failure", async () => {
    await makeGroup({ displayTitle: "Senior Backend Engineer", normalizedTitle: "senior backend engineer" });
    // an eligible user with a broken profile shape should not stop the pass
    await User.create({ fullname: "Bad", email: `bad${Date.now()}@x.com`, password: "h", roles: { jobSeeker: true }, profile: { headline: "x" } });

    _cacheClear();
    const r = await runRecoPrecompute({ env: { RECO_PRECOMPUTE_ENABLED: "true", RECO_PRECOMPUTE_BATCH: "10" } });
    expect(r.enabled).toBe(true);
    expect(r.processed).toBeGreaterThan(0);
    expect(r.failed).toBe(0);
    expect(_cacheSize()).toBeGreaterThan(0); // cache warmed

    // the warmed user now gets a cache hit
    const recs = mockRes();
    await getJobRecommendations({ id: seeker._id, query: {} }, recs);
    expect(recs.body.meta.cached).toBe(true);
  });
});

describe("Job Details match explanation", () => {
  it("returns real signals for the authed user and a dismissed flag", async () => {
    const g = await makeGroup({ displayTitle: "Senior Backend Engineer" });
    const res = mockRes();
    await getJobMatchExplanation({ id: seeker._id, params: { groupId: String(g._id) } }, res);
    expect(res.body.data.personalized).toBe(true);
    expect(res.body.data.signals).toHaveProperty("skills");
    expect(res.body.data.dismissed).toBe(false);

    await dismissJob({ id: seeker._id, params: { groupId: String(g._id) }, body: {} }, mockRes());
    const res2 = mockRes();
    await getJobMatchExplanation({ id: seeker._id, params: { groupId: String(g._id) } }, res2);
    expect(res2.body.data.dismissed).toBe(true);
  });

  it("only reflects the requesting user (no cross-user context)", async () => {
    const g = await makeGroup({ displayTitle: "Senior Backend Engineer" });
    await User.updateOne({ _id: other._id }, { $set: { "profile.skills": ["cobol", "fortran"] } });
    const resSeeker = mockRes();
    await getJobMatchExplanation({ id: seeker._id, params: { groupId: String(g._id) } }, resSeeker);
    const resOther = mockRes();
    await getJobMatchExplanation({ id: other._id, params: { groupId: String(g._id) } }, resOther);
    // different users → different match scores for the same job
    expect(resSeeker.body.data.percent).not.toBe(resOther.body.data.percent);
  });
});

describe("admin reco metrics", () => {
  it("returns provider status + runtime snapshot, no secrets", async () => {
    const res = mockRes();
    await getRecoMetrics({ id: "admin" }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.provider).toHaveProperty("providerConfigured");
    expect(res.body.data.runtime).toHaveProperty("requests");
    expect(res.body.data.offlineBenchmark.deterministic).toHaveProperty("hitRateAt5");
    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/sk-[A-Za-z0-9]/);
    expect(json).not.toMatch(/Bearer /);
    for (const f of ["AI_API_KEY", "apikey", "password", "authorization", "credential"]) {
      expect(json.toLowerCase()).not.toContain(f.toLowerCase());
    }
  });
});
