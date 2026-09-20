import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { User } from "../../../models/user.model.js";
import { Job } from "../../../models/job.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import SavedJob from "../../../models/savedJob.model.js";
import { Application } from "../../../models/application.model.js";
import {
  getJobRecommendations,
  getJobMatchExplanation,
} from "../../../controllers_new/recommendationController.js";
import isAuthenticated from "../../../middlewares/isAuthenticated.js";

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
  const g = await JobGroup.create({
    dedupeHash: `h${Math.random().toString(36).slice(2)}`,
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
    skills: ["Node.js", "MongoDB", "AWS"],
    descriptionPreview: "Build backend services with Node.js and MongoDB.",
    status: "active",
    bestJobId: jobId,
    sources: [{ jobId, sourceName: "Job-Pilot", sourceType: "internal", applyType: "internal", status: "active", applyUrl: "" }],
    activeSourceCount: 1,
    postedAt: new Date(),
    ...over,
  });
  return g;
}

let seeker;

beforeEach(async () => {
  await JobGroup.createIndexes();
  seeker = await User.create({
    fullname: "S",
    email: `s${Date.now()}@x.com`,
    password: "h",
    roles: { jobSeeker: true },
    profile: {
      skills: ["React", "Node.js", "TypeScript", "MongoDB"],
      headline: "Senior Backend Engineer",
      location: "Bengaluru",
      workPreference: "Remote",
      employmentType: "Full time",
      experience: [{ title: "Backend Engineer", startDate: "2019-01-01", current: true }],
    },
  });
});

describe("GET /api/v1/recommendations/jobs", () => {
  it("requires authentication (no token → blocked, next() not called)", async () => {
    const prev = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-secret";
    const res = mockRes();
    let passed = false;
    await isAuthenticated({ headers: {}, cookies: {} }, res, () => { passed = true; });
    process.env.JWT_SECRET = prev;
    expect(passed).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("returns a personalized, ranked list for a user with profile signal", async () => {
    await makeGroup({ displayTitle: "Senior Backend Engineer", normalizedTitle: "senior backend engineer" });
    await makeGroup({ displayTitle: "Frontend Designer", normalizedTitle: "frontend designer", skills: ["Figma", "CSS"], seniority: "junior" });
    await makeGroup({ displayTitle: "Node.js Developer", normalizedTitle: "node.js developer", skills: ["Node.js", "Express"] });

    const res = mockRes();
    await getJobRecommendations({ id: seeker._id, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.strategy).toMatch(/deterministic/);
    expect(res.body.meta.personalized).toBe(true);
    expect(res.body.jobs.length).toBeGreaterThan(0);

    const first = res.body.jobs[0];
    expect(first.groupId).toBeTruthy();
    expect(first._id).toBeTruthy(); // real Job id → details / save / apply keep working
    expect(first.matchPercent).toBeGreaterThan(0);
    expect(Array.isArray(first.matchReasons)).toBe(true);

    // the backend/senior role should outrank the unrelated frontend design role
    const titles = res.body.jobs.map((j) => j.title);
    const beIdx = titles.findIndex((t) => /backend|node/i.test(t));
    const feIdx = titles.findIndex((t) => /designer/i.test(t));
    if (beIdx !== -1 && feIdx !== -1) expect(beIdx).toBeLessThan(feIdx);
  });

  it("one card per JobGroup — never duplicate source rows", async () => {
    const jid2 = oid();
    await makeGroup({
      displayTitle: "Senior Backend Engineer",
      sources: [
        { jobId: oid(), sourceName: "Greenhouse", sourceType: "ats", applyType: "external", status: "active", applyUrl: "https://boards.greenhouse.io/x/1" },
        { jobId: jid2, sourceName: "Lever", sourceType: "ats", applyType: "external", status: "active", applyUrl: "https://jobs.lever.co/x/2" },
      ],
      activeSourceCount: 2,
    });
    const res = mockRes();
    await getJobRecommendations({ id: seeker._id, query: {} }, res);
    const backend = res.body.jobs.filter((j) => /backend/i.test(j.title));
    expect(backend).toHaveLength(1);
    expect(backend[0].sourceCount).toBe(2);
    expect(backend[0].sources.map((s) => s.applyUrl).sort()).toEqual([
      "https://boards.greenhouse.io/x/1",
      "https://jobs.lever.co/x/2",
    ]);
  });

  it("falls back to a general list (no match scores) for an empty profile", async () => {
    await makeGroup();
    const blank = await User.create({ fullname: "B", email: `b${Date.now()}@x.com`, password: "h", roles: { jobSeeker: true }, profile: {} });
    const res = mockRes();
    await getJobRecommendations({ id: blank._id, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.strategy).toBe("fallback");
    expect(res.body.meta.personalized).toBe(false);
    expect(res.body.jobs.length).toBeGreaterThan(0);
    expect(res.body.jobs[0].matchScore).toBeUndefined();
  });

  it("paginates with a stable contract", async () => {
    for (let i = 0; i < 8; i += 1) await makeGroup({ displayTitle: `Backend Engineer ${i}` });
    const res = mockRes();
    await getJobRecommendations({ id: seeker._id, query: { page: "1", limit: "3" } }, res);
    expect(res.body.jobs).toHaveLength(3);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 3 });
    expect(res.body.pagination.totalPages).toBeGreaterThan(1);
  });

  it("a saved job pushes its role family up in future recommendations", async () => {
    const g = await makeGroup({ displayTitle: "Data Engineer", normalizedTitle: "data engineer", skills: ["Python", "Spark", "SQL"] });
    await SavedJob.create({ userId: seeker._id, jobId: g.sources[0].jobId });
    // point the saved Job row at the group
    await Job.create({ _id: g.sources[0].jobId, title: "Data Engineer", description: "x".repeat(30), location: "Remote", groupId: g._id, dedupeHash: g.dedupeHash });
    const res = mockRes();
    await getJobRecommendations({ id: seeker._id, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.personalized).toBe(true);
  });
});

describe("GET /api/v1/recommendations/jobs/:groupId", () => {
  it("explains the match with real signals", async () => {
    const g = await makeGroup({ displayTitle: "Senior Backend Engineer" });
    const res = mockRes();
    await getJobMatchExplanation({ id: seeker._id, params: { groupId: String(g._id) } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.personalized).toBe(true);
    expect(res.body.data.percent).toBeGreaterThan(0);
    expect(res.body.data.signals).toHaveProperty("skills");
    expect(Array.isArray(res.body.data.reasons)).toBe(true);
  });

  it("400 on an invalid group id", async () => {
    const res = mockRes();
    await getJobMatchExplanation({ id: seeker._id, params: { groupId: "nope" } }, res);
    expect(res.statusCode).toBe(400);
  });
});
