import { describe, it, expect, beforeEach } from "vitest";

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { Company } from "../../../models/company.model.js";
import { User } from "../../../models/user.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import {
  internalJobFilter,
  normalizeInternalJobType,
  internalAdapter,
} from "../../sources/internal.js";
import { runSourceSync } from "../sync.js";
import { searchJobs } from "../../../controllers/job.controller.js";

useTestDb();

let companyId;
let recruiterId;

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

const makeJob = (over = {}) =>
  Job.create({
    title: "Backend Engineer",
    description: "Build and operate APIs and data services for the platform team. ".repeat(4),
    location: "Bangalore",
    workType: "On-site",
    jobType: "Full-time",
    salary: 20,
    experienceLevel: 3,
    position: 1,
    company: companyId,
    created_by: recruiterId,
    ...over,
  });

beforeEach(async () => {
  const u = await User.create({ fullname: "R", email: `r${Date.now()}@x.com`, password: "h", roles: { recruiter: true } });
  recruiterId = u._id;
  const c = await Company.create({ name: "Acme", userId: u._id });
  companyId = c._id;
});

describe("normalizeInternalJobType", () => {
  it("heals legacy / free-text values onto the enum", () => {
    expect(normalizeInternalJobType("FullTime")).toBe("Full-time");
    expect(normalizeInternalJobType("full time")).toBe("Full-time");
    expect(normalizeInternalJobType("PART_TIME")).toBe("Part-time");
    expect(normalizeInternalJobType("Contractor")).toBe("Contract");
    expect(normalizeInternalJobType("Full-time")).toBe("Full-time");
    expect(normalizeInternalJobType("")).toBe("");
    expect(normalizeInternalJobType("something odd")).toBe("");
  });
});

describe("internalJobFilter", () => {
  it("includes recruiter jobs regardless of the legacy `source` label", async () => {
    await makeJob({ source: "JobHub" });
    await makeJob({ title: "X", source: "JobPilot Ai" });
    await makeJob({ title: "Y", source: "" });
    const rows = await Job.find(internalJobFilter());
    expect(rows).toHaveLength(3);
  });

  it("excludes jobs owned by an external source", async () => {
    await makeJob({ source: "Greenhouse", sourceType: "ats", applyUrl: "https://boards.greenhouse.io/acme/1" });
    const rows = await Job.find(internalJobFilter());
    expect(rows).toHaveLength(0);
  });
});

describe("internal sync end-to-end with messy legacy data", () => {
  it("ingests a job whose jobType is the out-of-enum 'FullTime' and surfaces it in grouped search", async () => {
    // simulate a legacy row: write past schema validation
    await Job.collection.insertOne({
      title: "Legacy Python Developer",
      description: "Work on backend Python services and data pipelines for the analytics team. ".repeat(3),
      location: "Pune",
      workType: "On-site",
      jobType: "FullTime", // <-- not in the enum
      salary: 18,
      position: 1,
      company: companyId,
      created_by: recruiterId,
      source: "JobHub",
      isActive: true,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    });

    const res = await runSourceSync("internal");
    expect(res.ok).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.counts.fetched).toBeGreaterThan(0);

    const job = await Job.findOne({ title: "Legacy Python Developer" });
    expect(job.dedupeHash).toBeTruthy();
    expect(job.groupKey).toBe(job.dedupeHash);
    expect(["Full-time", undefined]).toContain(job.jobType); // healed or dropped, never left invalid

    const groups = await JobGroup.find({ status: "active" });
    expect(groups.length).toBeGreaterThan(0);

    const sres = mockRes();
    await searchJobs({ query: {} }, sres);
    expect(sres.body.jobs.map((j) => j.title)).toContain("Legacy Python Developer");
  });

  it("REGRESSION: jobs exist but JobGroup is empty → internal sync → search returns them", async () => {
    // The exact 'Find Jobs page empty' scenario: recruiter jobs in the DB, but
    // the ingest pipeline never ran, so there are no JobGroups.
    await makeJob({ title: "Backend Engineer", source: "JobHub" });
    await makeJob({ title: "Frontend Developer", source: "JobHub", location: "Pune" });
    await makeJob({ title: "Data Analyst" }); // source defaults

    expect(await Job.countDocuments()).toBe(3);
    expect(await JobGroup.countDocuments()).toBe(0);

    // before repair the grouped search is empty
    const before = mockRes();
    await searchJobs({ query: {} }, before);
    expect(before.body.jobs).toHaveLength(0);
    expect(before.body.pagination.total).toBe(0);

    // the repair path (same call the startup self-heal makes)
    const r = await runSourceSync("internal");
    expect(r.ok).toBe(true);
    expect(r.counts.fetched).toBe(3);

    expect(await JobGroup.countDocuments({ status: "active" })).toBe(3);

    const after = mockRes();
    await searchJobs({ query: {} }, after);
    expect(after.body.jobs).toHaveLength(3);
    expect(after.body.pagination.total).toBe(3);
    // every card carries a real Job id + a groupId so details / saved / apply keep working
    for (const card of after.body.jobs) {
      expect(card._id).toBeTruthy();
      expect(card.groupId).toBeTruthy();
    }
  });
});
