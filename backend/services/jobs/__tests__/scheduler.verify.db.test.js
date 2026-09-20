import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../verifyLinks.js", () => ({ verifyApplyLinks: vi.fn().mockResolvedValue({ checked: 3, verified: 3, dead: 0, transient: 0 }) }));
vi.mock("../../sources/httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { useTestDb } from "../../../test/mongo.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { verifyApplyLinks } from "../verifyLinks.js";
import { safeGet } from "../../sources/httpClient.js";
import { ensureInternalSource } from "../../sources/internal.js";
import { SyncScheduler } from "../scheduler.js";

useTestDb();

beforeEach(async () => {
  verifyApplyLinks.mockClear();
  safeGet.mockReset().mockResolvedValue({ status: 200, headers: {}, body: JSON.stringify({ jobs: [] }), url: "x" });
  await ensureInternalSource();
});

describe("scheduled link verification", () => {
  it("does NOT verify a source that has not opted in", async () => {
    await JobSource.create({
      key: "gh:noverify", name: "GH", type: "ats", adapter: "greenhouse", enabled: true,
      rateLimitPerMin: 0, config: { boardToken: "acme" },
    });
    const res = await new SyncScheduler().tick();
    expect(verifyApplyLinks).not.toHaveBeenCalled();
    expect(res.verified).toEqual([]);
  });

  it("verifies an opted-in source when its verify schedule is due, then stamps lastVerifyLinksAt", async () => {
    const src = await JobSource.create({
      key: "gh:verify", name: "GH", type: "ats", adapter: "greenhouse", enabled: true,
      rateLimitPerMin: 0,
      config: { boardToken: "acme", verifyLinks: true, verifyLinksSchedule: "* * * * *", verifyLinksLimit: 25 },
    });

    const res = await new SyncScheduler().tick();
    expect(verifyApplyLinks).toHaveBeenCalledWith({ sourceId: src._id, limit: 25, commit: true });
    expect(res.verified.map((v) => v.key)).toContain("gh:verify");

    const after = await JobSource.findById(src._id).lean();
    expect(after.lastVerifyLinksAt).toBeInstanceOf(Date);
  });

  it("does not verify again in the same minute (cronDue de-dup)", async () => {
    await JobSource.create({
      key: "gh:verify2", name: "GH", type: "ats", adapter: "greenhouse", enabled: true,
      rateLimitPerMin: 0,
      config: { boardToken: "acme", verifyLinks: true, verifyLinksSchedule: "* * * * *" },
      lastVerifyLinksAt: new Date(),
    });
    await new SyncScheduler().tick();
    expect(verifyApplyLinks).not.toHaveBeenCalled();
  });

  it("caps the verification batch at 200", async () => {
    const src = await JobSource.create({
      key: "gh:verify3", name: "GH", type: "ats", adapter: "greenhouse", enabled: true,
      rateLimitPerMin: 0,
      config: { boardToken: "acme", verifyLinks: true, verifyLinksSchedule: "* * * * *", verifyLinksLimit: 999999 },
    });
    await new SyncScheduler().tick();
    expect(verifyApplyLinks).toHaveBeenCalledWith({ sourceId: src._id, limit: 200, commit: true });
  });
});
