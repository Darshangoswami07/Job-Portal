import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { Company } from "../../../models/company.model.js";
import { User } from "../../../models/user.model.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { SyncRun } from "../../../models_new/SyncRun.js";
import { ensureInternalSource } from "../../sources/internal.js";
import { SyncScheduler } from "../scheduler.js";

useTestDb();

let companyId;
let recruiterId;

beforeEach(async () => {
  const rec = await User.create({ fullname: "R", email: `r${Date.now()}@x.com`, password: "h", roles: { recruiter: true } });
  recruiterId = rec._id;
  const co = await Company.create({ name: "Acme", userId: recruiterId });
  companyId = co._id;
});

const makeJob = (over = {}) =>
  Job.create({
    title: "Backend Engineer",
    description: "Build services for the platform team. ".repeat(4),
    location: "Bengaluru",
    workType: "On-site",
    jobType: "Full-time",
    salary: 20,
    experienceLevel: 3,
    position: 1,
    company: companyId,
    created_by: recruiterId,
    ...over,
  });

describe("SyncScheduler.tick", () => {
  it("never runs a disabled source", async () => {
    await JobSource.create({
      key: "off:1",
      name: "Off",
      type: "ats",
      adapter: "greenhouse",
      enabled: false,
      config: { boardToken: "acme" },
    });
    const res = await new SyncScheduler().tick();
    // the internal source is always ensured + due; the disabled one is not run
    expect(res.ran.map((r) => r.key)).not.toContain("off:1");
    expect(await SyncRun.countDocuments({ sourceKey: "off:1" })).toBe(0);
  });

  it("runs a due source (empty schedule = every tick) and skips a not-due cron source", async () => {
    await makeJob();
    await ensureInternalSource(); // schedule "" → always due
    await JobSource.create({
      key: "gh:future",
      name: "GH",
      type: "ats",
      adapter: "greenhouse",
      enabled: true,
      schedule: "0 0 1 1 *", // Jan 1 00:00 — almost never "now"
      config: { boardToken: "acme" },
    });

    const res = await new SyncScheduler().tick(new Date(Date.UTC(2024, 5, 3, 10, 30)));
    const keys = res.ran.map((r) => r.key);
    expect(keys).toContain("internal");
    expect(keys).not.toContain("gh:future");

    const job = await Job.findOne().lean();
    expect(job.groupId).toBeTruthy(); // internal sync ran end-to-end
  });

  it("isolates a failing source — others still run", async () => {
    await makeJob();
    await ensureInternalSource();
    await JobSource.create({
      key: "gh:broken",
      name: "Broken GH",
      type: "ats",
      adapter: "greenhouse",
      enabled: true,
      schedule: "", // due
      config: {}, // no boardToken → adapter throws a config error
    });

    const res = await new SyncScheduler().tick();
    const byKey = Object.fromEntries(res.ran.map((r) => [r.key, r.result]));
    expect(byKey["internal"].ok).toBe(true);
    expect(byKey["gh:broken"].ok).toBe(false);

    const broken = await JobSource.findOne({ key: "gh:broken" }).lean();
    expect(broken.lastSyncStatus).toBe("error");
    expect(broken.health.consecutiveFailures).toBe(1);

    const internalJob = await Job.findOne().lean();
    expect(internalJob.groupId).toBeTruthy();
  });

  it("prevents overlapping ticks", async () => {
    await makeJob();
    await ensureInternalSource();
    const s = new SyncScheduler();
    const [a, b] = await Promise.all([s.tick(), s.tick()]);
    const skipped = [a, b].filter((r) => r.skipped === "ticking");
    expect(skipped).toHaveLength(1);
  });

  it("start()/stop() are graceful", async () => {
    const s = new SyncScheduler({ tickMs: 999999 });
    s.start();
    await s.stop();
    expect(mongoose.connection.readyState).toBe(1); // scheduler does not close the connection
  });
});
