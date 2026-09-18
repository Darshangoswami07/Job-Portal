import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { User } from "../../../models/user.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { searchJobs } from "../../../controllers/job.controller.js";

useTestDb();

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};
const oid = () => new mongoose.Types.ObjectId();

const grp = (over = {}) => {
  const jid = oid();
  return {
    dedupeHash: `h${Math.random().toString(36).slice(2)}`,
    displayTitle: "Backend Engineer",
    normalizedTitle: "backend engineer",
    companyName: "Acme",
    normalizedCompany: "acme",
    location: "Bengaluru",
    normalizedLocation: "bengaluru",
    remoteType: "onsite",
    seniority: "",
    jobType: "Full-time",
    skills: [],
    descriptionPreview: "A role.",
    status: "active",
    bestJobId: jid,
    sources: [{ jobId: jid, sourceName: "Job-Pilot", sourceType: "internal", applyType: "internal", status: "active", applyUrl: "" }],
    activeSourceCount: 1,
    postedAt: new Date(),
    ...over,
  };
};

let seeker;

beforeEach(async () => {
  await JobGroup.createIndexes();
  seeker = await User.create({
    fullname: "S", email: `s${Date.now()}@x.com`, password: "h", roles: { jobSeeker: true },
    profile: {
      skills: ["React", "TypeScript", "CSS"],
      headline: "Frontend Engineer",
      workPreference: "Remote",
      experience: [{ title: "Frontend Engineer", startDate: "2021-01-01", current: true }],
    },
  });
  await JobGroup.insertMany([
    grp({ displayTitle: "Backend Engineer", normalizedTitle: "backend engineer", skills: ["Java", "Spring"], remoteType: "onsite", postedAt: new Date(Date.now() - 1000) }),
    grp({ displayTitle: "Frontend Engineer", normalizedTitle: "frontend engineer", skills: ["React", "TypeScript"], remoteType: "remote", postedAt: new Date(Date.now() - 5000) }),
    grp({ displayTitle: "DevOps Engineer", normalizedTitle: "devops engineer", skills: ["Terraform", "AWS"], remoteType: "onsite", postedAt: new Date(Date.now() - 9000) }),
    grp({ displayTitle: "React Developer", normalizedTitle: "react developer", skills: ["React", "Redux"], remoteType: "remote", postedAt: new Date(Date.now() - 13000) }),
  ]);
});

describe("sort=recommended", () => {
  it("re-ranks by fit for a logged-in user (React roles rise for a frontend profile)", async () => {
    const res = mockRes();
    await searchJobs({ query: { sort: "recommended" }, id: seeker._id }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.personalized).toBe(true);
    expect(res.body.jobs[0].matchPercent).toBeGreaterThan(0);

    const titles = res.body.jobs.map((j) => j.title);
    const frontendish = titles.findIndex((t) => /frontend|react/i.test(t));
    const backend = titles.findIndex((t) => /backend|devops/i.test(t));
    expect(frontendish).toBeLessThan(backend);
  });

  it("is NOT personalized for an anonymous user — falls back to relevance/recency", async () => {
    const res = mockRes();
    await searchJobs({ query: { sort: "recommended" } }, res); // no req.id
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.personalized).toBe(false);
    expect(res.body.jobs.length).toBeGreaterThan(0);
    expect(res.body.jobs[0].matchScore).toBeUndefined();
  });

  it("explicit keyword intent stays dominant: q=devops never returns a React role first", async () => {
    await JobGroup.createIndexes();
    const res = mockRes();
    await searchJobs({ query: { q: "devops", sort: "recommended" }, id: seeker._id }, res);
    expect(res.statusCode).toBe(200);
    const titles = res.body.jobs.map((j) => j.title.toLowerCase());
    expect(titles.every((t) => !t.includes("react") || t.includes("devops"))).toBe(true);
    if (titles.length) expect(titles[0]).toContain("devops");
  });
});

describe("existing sort modes unchanged", () => {
  it("sort=relevance returns no match scores and no personalized flag", async () => {
    const res = mockRes();
    await searchJobs({ query: { sort: "relevance" }, id: seeker._id }, res);
    expect(res.body.meta.personalized).toBe(false);
    expect(res.body.jobs[0].matchScore).toBeUndefined();
  });

  it("sort=newest stays chronological", async () => {
    const res = mockRes();
    await searchJobs({ query: { sort: "newest" }, id: seeker._id }, res);
    const times = res.body.jobs.map((j) => new Date(j.postedAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });
});
