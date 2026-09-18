import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { searchJobs } from "../../../controllers/job.controller.js";

useTestDb();

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

const group = (over = {}) =>
  JobGroup.create({
    dedupeHash: `h${Math.random().toString(36).slice(2)}`,
    displayTitle: "Backend Engineer",
    companyName: "Acme",
    normalizedCompany: "acme",
    location: "Bengaluru",
    normalizedLocation: "bengaluru",
    remoteType: "onsite",
    jobType: "Full-time",
    seniority: "senior",
    experienceLevel: 4,
    status: "active",
    sourceNames: ["Greenhouse"],
    sources: [{ jobId: new mongoose.Types.ObjectId(), sourceName: "Greenhouse", sourceType: "ats", applyType: "external", status: "active", applyUrl: "https://x/1" }],
    activeSourceCount: 1,
    postedAt: new Date(),
    ...over,
  });

beforeEach(async () => {
  await JobSource.create({ key: "gh", name: "Greenhouse", type: "ats", adapter: "greenhouse", enabled: true, config: { boardToken: "acme" } });
  await JobSource.create({ key: "old", name: "LegacyFeed", type: "feed", adapter: "greenhouse", enabled: false, config: { boardToken: "acme" } });

  await group();
  await group({ remoteType: "remote", normalizedLocation: "remote", location: "Remote" });
  await group({ jobType: "Internship", seniority: "intern", experienceLevel: 0, displayTitle: "Backend Intern" });
  await group({ sourceNames: ["LegacyFeed"], sources: [{ jobId: new mongoose.Types.ObjectId(), sourceName: "LegacyFeed", sourceType: "feed", applyType: "external", status: "active", applyUrl: "https://y/1" }] });
});

describe("grouped search facets", () => {
  it("returns facet counts for remoteType / jobType / seniority / location / experience", async () => {
    const res = mockRes();
    await searchJobs({ query: {} }, res);
    expect(res.statusCode).toBe(200);

    const f = res.body.meta.facets;
    expect(f).toBeTruthy();

    const remote = Object.fromEntries(f.remoteType.map((r) => [r.value, r.count]));
    expect(remote.onsite).toBe(3);
    expect(remote.remote).toBe(1);

    const jt = Object.fromEntries(f.jobType.map((r) => [r.value, r.count]));
    expect(jt["Full-time"]).toBe(3);
    expect(jt.Internship).toBe(1);

    expect(f.seniority.find((r) => r.value === "senior").count).toBe(3);
    expect(f.location.find((r) => r.value === "bengaluru").count).toBe(3);
    expect(f.experienceLevel.length).toBeGreaterThan(0);
  });

  it("source facet + meta.sources only list configured (enabled + valid) sources", async () => {
    const res = mockRes();
    await searchJobs({ query: {} }, res);

    // a group tagged with the DISABLED source exists, but it is not selectable
    expect(res.body.meta.sources).toEqual(["Greenhouse"]);
    expect(res.body.meta.facets.source.map((s) => s.value)).toEqual(["Greenhouse"]);
  });

  it("facets respect the active filter", async () => {
    const res = mockRes();
    await searchJobs({ query: { remoteType: "remote" } }, res);
    const jt = res.body.meta.facets.jobType;
    // only the one remote group counts now
    expect(jt.reduce((n, r) => n + r.count, 0)).toBe(1);
  });
});
