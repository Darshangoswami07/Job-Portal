import { describe, it, expect, beforeEach } from "vitest";

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { MergeBlock, orderedPair } from "../../../models_new/MergeBlock.js";
import { ingestRawJob } from "../ingest.js";
import { findAutoMergeKey, isPairBlocked } from "../similarity.js";

useTestDb();

const DESC =
  `We are hiring a backend engineer to design, build and operate resilient
   distributed services that power our product. You will own public APIs, data
   pipelines, background jobs and the observability around them. You will pair
   with product managers to scope work, review other engineers' code, and help
   set technical direction. Strong experience with Node.js, relational and
   document databases, message queues, containerised deploys and automated
   testing is expected. We care about reliability, clear writing and steady
   incremental delivery.`;

let atsA;
let atsB;
let atsC;

beforeEach(async () => {
  atsA = await JobSource.create({ key: "gh-acme", name: "Greenhouse", type: "ats", adapter: "greenhouse", enabled: true });
  atsB = await JobSource.create({ key: "lever-acme", name: "Lever", type: "ats", adapter: "lever", enabled: true });
  atsC = await JobSource.create({ key: "ashby-acme", name: "Ashby", type: "ats", adapter: "ashby", enabled: true });
});

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
  postedAt: "2026-08-01T00:00:00Z",
  ...over,
});

describe("Level-3 similarity merge (true positives)", () => {
  it("folds the same vacancy from two sources into one auto-merged JobGroup", async () => {
    const a = await ingestRawJob(raw(), atsA);
    const b = await ingestRawJob(
      raw({
        externalId: "9",
        // a slightly different location string → a DIFFERENT deterministic hash
        location: "Bengaluru, Karnataka, India",
        originalUrl: "https://jobs.lever.co/acme/9",
        applyUrl: "https://jobs.lever.co/acme/9",
      }),
      atsB
    );

    expect(a.dedupeHash).not.toBe(b.dedupeHash); // Level 2 kept them apart
    expect(b.groupKey).toBe(a.groupKey); // Level 3 joined them

    const groups = await JobGroup.find({ status: "active" }).lean();
    expect(groups).toHaveLength(1);
    expect(groups[0].autoMerged).toBe(true);
    expect(groups[0].memberHashes).toHaveLength(2);
    expect(groups[0].sources).toHaveLength(2);
    // per-source apply URLs are preserved, never cross-contaminated
    expect(groups[0].sources.map((s) => s.applyUrl).sort()).toEqual([
      "https://boards.greenhouse.io/acme/jobs/1",
      "https://jobs.lever.co/acme/9",
    ]);
  });

  it("is deterministic — re-ingesting does not change the grouping", async () => {
    await ingestRawJob(raw(), atsA);
    const b1 = await ingestRawJob(raw({ externalId: "9", location: "Bengaluru, Karnataka, India" }), atsB);
    const b2 = await ingestRawJob(raw({ externalId: "9", location: "Bengaluru, Karnataka, India" }), atsB);
    expect(b2.groupKey).toBe(b1.groupKey);
    expect(await JobGroup.countDocuments({ status: "active" })).toBe(1);
  });
});

describe("Level-3 similarity merge (false positives blocked)", () => {
  it("does NOT merge a different role family at the same company", async () => {
    await ingestRawJob(raw(), atsA);
    const fe = await ingestRawJob(
      raw({
        externalId: "9",
        title: "Senior Frontend Engineer",
        location: "Bengaluru, Karnataka, India",
      }),
      atsB
    );
    expect(fe.groupKey).toBe(fe.dedupeHash);
    expect(await JobGroup.countDocuments({ status: "active" })).toBe(2);
  });

  it("NEVER merges two postings from the same source with different ids", async () => {
    await ingestRawJob(raw({ externalId: "1" }), atsA);
    const dup = await ingestRawJob(raw({ externalId: "2", location: "Bengaluru, Karnataka, India" }), atsA);
    expect(dup.groupKey).toBe(dup.dedupeHash);
    expect(await JobGroup.countDocuments({ status: "active" })).toBe(2);
  });

  it("respects an admin split: a blocked pair never auto-merges again", async () => {
    const a = await ingestRawJob(raw(), atsA);
    const c = await ingestRawJob(
      raw({
        externalId: "7",
        location: "Bengaluru, Karnataka, India",
        originalUrl: "https://jobs.ashbyhq.com/acme/7",
        applyUrl: "https://jobs.ashbyhq.com/acme/7",
      }),
      atsC
    );
    expect(c.groupKey).toBe(a.groupKey); // merged without a block

    // admin splits → MergeBlock for the pair, and the split job goes back to its hash
    const [x, y] = orderedPair(a.groupKey, c.dedupeHash);
    await MergeBlock.create({ keyA: x, keyB: y, reason: "false positive" });
    await Job.updateOne({ _id: c.jobId }, { $set: { groupKey: c.dedupeHash } });

    expect(await isPairBlocked(a.groupKey, c.dedupeHash)).toBe(true);

    const cJob = await Job.findById(c.jobId).lean();
    const key = await findAutoMergeKey(cJob);
    expect(key).toBe(""); // the assist now refuses to re-merge this pair
  });
});
