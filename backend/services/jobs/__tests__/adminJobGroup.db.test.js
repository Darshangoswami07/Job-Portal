import { describe, it, expect, beforeEach } from "vitest";

import { useTestDb } from "../../../test/mongo.js";
import { User } from "../../../models/user.model.js";
import { Job } from "../../../models/job.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { AdminAudit } from "../../../models_new/AdminAudit.js";
import { MergeBlock } from "../../../models_new/MergeBlock.js";
import { ingestRawJob } from "../ingest.js";
import { isPairBlocked } from "../similarity.js";
import { listJobGroups, getJobGroup, splitJobGroup } from "../../../controllers_new/adminJobGroupController.js";

useTestDb();

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

const DESC =
  `We are hiring a backend engineer to design, build and operate resilient
   distributed services powering our product. You own public APIs, data pipelines
   and the observability around them, pair with product to scope work, review code
   and set technical direction. Node.js, databases, queues, containers and
   automated testing expected. We value reliability and steady delivery.`;

const raw = (over = {}) => ({
  externalId: "1",
  title: "Senior Backend Engineer",
  description: DESC,
  companyName: "Acme Inc",
  location: "Bengaluru, India",
  workType: "On-site",
  jobType: "Full-time",
  originalUrl: "https://boards.greenhouse.io/acme/jobs/1",
  applyUrl: "https://boards.greenhouse.io/acme/jobs/1",
  ...over,
});

let admin;
let srcA;
let srcB;

beforeEach(async () => {
  admin = await User.create({ fullname: "A", email: `a${Date.now()}@x.com`, password: "h", roles: { admin: true } });
  srcA = await JobSource.create({ key: "gh", name: "Greenhouse", type: "ats", adapter: "greenhouse", enabled: true });
  srcB = await JobSource.create({ key: "lv", name: "Lever", type: "ats", adapter: "lever", enabled: true });
});

async function mergedGroup() {
  await ingestRawJob(raw(), srcA);
  await ingestRawJob(
    raw({ externalId: "9", location: "Bengaluru, Karnataka, India", originalUrl: "https://jobs.lever.co/acme/9", applyUrl: "https://jobs.lever.co/acme/9" }),
    srcB
  );
  return JobGroup.findOne({ autoMerged: true });
}

describe("admin job-group listing", () => {
  it("lists auto-merged groups with member hashes", async () => {
    await mergedGroup();
    const res = mockRes();
    await listJobGroups({ id: admin._id, query: { autoMerged: "true" }, body: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.groups).toHaveLength(1);
    expect(res.body.data.groups[0].autoMerged).toBe(true);
    expect(res.body.data.groups[0].memberHashes).toHaveLength(2);
  });

  it("detail returns the source postings behind the group with URLs preserved", async () => {
    const g = await mergedGroup();
    const res = mockRes();
    await getJobGroup({ id: admin._id, params: { id: String(g._id) }, query: {}, body: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.members).toHaveLength(2);
    expect(res.body.data.members.map((m) => m.applyUrl).sort()).toEqual([
      "https://boards.greenhouse.io/acme/jobs/1",
      "https://jobs.lever.co/acme/9",
    ]);
  });
});

describe("admin split group", () => {
  it("separates the picked posting, blocks the pair, keeps both source jobs", async () => {
    const g = await mergedGroup();
    const target = (await getJobGroupMembers(g._id)).find((m) => m.externalId === "9");

    const res = mockRes();
    await splitJobGroup({ id: admin._id, params: { id: String(g._id) }, body: { jobId: String(target.jobId) } }, res);
    expect(res.statusCode).toBe(200);

    // two active groups now, one per hash
    expect(await JobGroup.countDocuments({ status: "active" })).toBe(2);

    // both source jobs still exist, URLs intact
    const jobs = await Job.find({}).select("externalId applyUrl groupKey dedupeHash").lean();
    expect(jobs).toHaveLength(2);
    expect(jobs.every((j) => j.applyUrl.startsWith("https://"))).toBe(true);
    const a = jobs.find((j) => j.externalId === "1");
    const b = jobs.find((j) => j.externalId === "9");
    expect(b.groupKey).toBe(b.dedupeHash);
    expect(b.groupKey).not.toBe(a.groupKey);

    // pair is blocked + audit recorded
    expect(await isPairBlocked(a.groupKey, b.dedupeHash)).toBe(true);
    expect(await AdminAudit.countDocuments({ action: "job-group.split" })).toBe(1);
  });

  it("re-ingesting the split posting does not re-merge it", async () => {
    const g = await mergedGroup();
    const target = (await getJobGroupMembers(g._id)).find((m) => m.externalId === "9");
    await splitJobGroup(
      { id: admin._id, params: { id: String(g._id) }, body: { jobId: String(target.jobId) } },
      mockRes()
    );

    await ingestRawJob(
      raw({ externalId: "9", location: "Bengaluru, Karnataka, India", originalUrl: "https://jobs.lever.co/acme/9", applyUrl: "https://jobs.lever.co/acme/9" }),
      srcB
    );
    expect(await JobGroup.countDocuments({ status: "active" })).toBe(2);
  });

  it("400s when the group has a single underlying posting", async () => {
    await ingestRawJob(raw(), srcA);
    const g = await JobGroup.findOne({});
    const job = await Job.findOne({});
    const res = mockRes();
    await splitJobGroup({ id: admin._id, params: { id: String(g._id) }, body: { jobId: String(job._id) } }, res);
    expect(res.statusCode).toBe(400);
  });
});

async function getJobGroupMembers(groupId) {
  const res = mockRes();
  await getJobGroup({ id: "x", params: { id: String(groupId) }, query: {}, body: {} }, res);
  return res.body.data.members;
}
