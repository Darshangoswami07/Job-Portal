import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { getCatalogStats, __resetCatalogStatsCache } from "../../../controllers/job.controller.js";

useTestDb();

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};
const oid = () => new mongoose.Types.ObjectId();

const today = new Date();
today.setUTCHours(6, 0, 0, 0);

async function seed() {
  const g1 = oid(), g2 = oid(), g3 = oid();
  await Job.collection.insertMany([
    { _id: oid(), title: "Backend Engineer", description: "x".repeat(40), status: "active", isActive: true, groupKey: "k1", groupId: g1, firstSeenAt: today },
    { _id: oid(), title: "Backend Engineer", description: "x".repeat(40), status: "active", isActive: true, groupKey: "k1", groupId: g1, firstSeenAt: today },
    { _id: oid(), title: "Data Scientist", description: "x".repeat(40), status: "active", isActive: true, groupKey: "k2", groupId: g2, firstSeenAt: new Date("2020-01-01") },
    { _id: oid(), title: "Closed Role", description: "x".repeat(40), status: "expired", isActive: false, groupKey: "k3", groupId: g3 },
  ]);
  await JobGroup.collection.insertMany([
    { _id: g1, dedupeHash: "k1", status: "active", displayTitle: "Backend Engineer", companyName: "Acme", normalizedCompany: "acme", location: "Remote", normalizedLocation: "remote", remoteType: "remote", department: "Engineering", sourceNames: ["Jobicy", "The Muse"], postedAt: new Date() },
    { _id: g2, dedupeHash: "k2", status: "active", displayTitle: "Data Scientist", companyName: "Globex", normalizedCompany: "globex", location: "Bengaluru, India", normalizedLocation: "bengaluru india", remoteType: "onsite", department: "Data", sourceNames: ["The Muse"], postedAt: new Date() },
    { _id: g3, dedupeHash: "k3", status: "inactive", displayTitle: "Closed Role", companyName: "Acme", normalizedCompany: "acme", sourceNames: ["Job-Pilot"], postedAt: new Date() },
  ]);
}

beforeEach(async () => {
  await Promise.all([Job.deleteMany({}), JobGroup.deleteMany({})]);
  __resetCatalogStatsCache(); // the endpoint has a 60s in-process TTL cache
});

describe("GET /api/v1/job/catalog-stats", () => {
  it("returns real aggregates from active JobGroups / Jobs only", async () => {
    await seed();
    const res = mockRes();
    await getCatalogStats({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const s = res.body.stats;
    expect(s.activeJobs).toBe(3); // the expired one excluded
    expect(s.activeJobGroups).toBe(2); // g3 is inactive
    expect(s.companies).toBe(2); // acme, globex (from active groups)
    expect(s.locations).toBe(2); // remote, bengaluru india
    expect(s.categories).toBe(2); // Engineering, Data
    expect(s.remoteJobs).toBe(1); // g1
    expect(s.sources).toBe(2); // Jobicy, The Muse (Job-Pilot only on the inactive group)
    expect(res.body.sourceNames.sort()).toEqual(["Jobicy", "The Muse"]);
    expect(s.jobsAddedToday).toBe(2); // the two firstSeenAt=today rows
  });

  it("top categories + companies are count-sorted and only cover active jobs", async () => {
    await seed();
    const res = mockRes();
    await getCatalogStats({}, res);
    // counts tie at 1 here — assert the set + shape, not the tie-break order
    expect(res.body.topCategories.map((c) => c.name).sort()).toEqual(["Data", "Engineering"]);
    expect(res.body.topCategories.every((c) => c.count === 1)).toBe(true);
    expect(res.body.topCompanies.map((c) => c.name).sort()).toEqual(["Acme", "Globex"]);
    // "Job-Pilot" never appears as a live source — its only group is inactive
    expect(res.body.sourceNames).not.toContain("Job-Pilot");
  });

  it("degrades gracefully on an empty catalogue (no fabricated numbers)", async () => {
    const res = mockRes();
    await getCatalogStats({}, res);
    const s = res.body.stats;
    expect(s).toMatchObject({
      activeJobs: 0, activeJobGroups: 0, companies: 0, locations: 0,
      categories: 0, remoteJobs: 0, sources: 0, jobsAddedToday: 0,
    });
    expect(res.body.sourceNames).toEqual([]);
    expect(res.body.topCategories).toEqual([]);
    expect(res.body.generatedAt).toBeTruthy();
  });

  it("never exposes credentials, PII or raw job payloads", async () => {
    await seed();
    const res = mockRes();
    await getCatalogStats({}, res);
    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/password|token|apiKey|api_key|mongodb\+srv|Bearer /i);
    expect(json).not.toContain("description");
    expect(json).not.toContain("email");
  });
});
