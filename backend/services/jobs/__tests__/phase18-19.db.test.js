import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

vi.mock("../../sources/httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), safeRequest: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { useTestDb } from "../../../test/mongo.js";
import { Job } from "../../../models/job.model.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { SyncRun } from "../../../models_new/SyncRun.js";
import { AdminAudit } from "../../../models_new/AdminAudit.js";
import { User } from "../../../models/user.model.js";
import { getConfigCheck } from "../../../controllers_new/adminCatalogController.js";
import { testJobSource } from "../../../controllers_new/adminJobSourceController.js";
import { implementedSourceKeys, capabilityMatrix } from "../../sources/sourceCapabilities.js";
import { knownAdapters } from "../../sources/configValidation.js";
import { safeGet, SourceHttpError } from "../../sources/httpClient.js";

useTestDb();

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });
const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

let adminId;

beforeEach(async () => {
  safeGet.mockReset();
  await Promise.all([
    Job.deleteMany({}), JobGroup.deleteMany({}), JobSource.deleteMany({}),
    SyncRun.deleteMany({}), AdminAudit.deleteMany({}), User.deleteMany({}),
  ]);
  const admin = await User.create({
    fullname: "Ad Min", email: `admin${Date.now()}@x.com`, password: "hashed", roles: { admin: true },
  });
  adminId = admin._id;
});

// ── Phase 19: registry / matrix parity (fresh) ──────────────────────────
describe("Phase 19 — capability matrix parity", () => {
  it("implemented adapters == registered adapters; Himalayas is not-verified", () => {
    expect([...implementedSourceKeys()].sort()).toEqual([...knownAdapters()].sort());
    const m = capabilityMatrix();
    const him = m.find((s) => s.key === "himalayas");
    expect(him.adapter).toBeNull();
    expect(him.availability).toBe("not-verified");
    for (const s of m) {
      if (s.availability !== "implemented") expect(s.adapter).toBeNull();
    }
  });
});

// ── Phase 18 §18.6: config-check diagnostic ─────────────────────────────
describe("Phase 18 — GET config-check", () => {
  it("reports activation readiness per adapter/source without leaking secrets", async () => {
    await JobSource.create({ key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: false, config: { count: 50 } });
    await JobSource.create({ key: "usajobs:g", name: "USAJOBS", type: "feed", adapter: "usajobs", enabled: false, config: { apiKeyRef: "USAJOBS_API_KEY", userAgentRef: "USAJOBS_USER_AGENT" } });
    await JobSource.create({ key: "gh:x", name: "GH", type: "ats", adapter: "greenhouse", enabled: false, config: {} });

    const res = mockRes();
    await getConfigCheck({}, res);
    expect(res.statusCode).toBe(200);
    const rows = Object.fromEntries(res.body.data.adapters.map((r) => [r.adapter, r]));

    const jobicy = rows.jobicy.sources.find((s) => s.key === "jobicy:g");
    expect(jobicy.credentialRequired).toBe(false);
    expect(jobicy.credentialPresent).toBe(true);
    expect(jobicy.configValid).toBe(true);
    expect(jobicy.activationReady).toBe(true); // no credential needed

    const usa = rows.usajobs.sources.find((s) => s.key === "usajobs:g");
    expect(usa.credentialRequired).toBe(true);
    expect(usa.credentialPresent).toBe(false); // env not set in test
    expect(usa.missingCredentialEnvNames).toEqual(["USAJOBS_API_KEY", "USAJOBS_USER_AGENT"]); // NAMES only
    expect(usa.activationReady).toBe(false);

    const gh = rows.greenhouse.sources.find((s) => s.key === "gh:x");
    expect(gh.configValid).toBe(false); // no boardToken
    expect(gh.missingConfig).toContain("boardToken");

    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/sk-[A-Za-z0-9]{12}/);
    expect(json).not.toMatch(/=[A-Za-z0-9]{20,}/); // no leaked credential values
  });
});

// ── Phase 18 §18.10: bounded test-connection ────────────────────────────
describe("Phase 18 — POST /:id/test (bounded probe, no persistence)", () => {
  const makeReq = (id, body = {}) => ({ id: adminId, params: { id: String(id) }, body });

  it("returns a redacted sample on success and writes an audit — no Job/JobGroup created", async () => {
    const src = await JobSource.create({ key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: false, config: { count: 100 } });
    safeGet.mockResolvedValue(okBody({ jobs: [
      { id: 1, jobTitle: "SRE", companyName: "Globex", url: "https://jobicy.com/jobs/1", jobGeo: "USA" },
      { id: 2, jobTitle: "Backend Eng", companyName: "Initech", url: "https://jobicy.com/jobs/2", jobGeo: "Anywhere" },
    ], success: true }));

    const res = mockRes();
    await testJobSource(makeReq(src._id), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.ok).toBe(true);
    expect(res.body.data.fetched).toBe(2);
    expect(res.body.data.sample[0]).toMatchObject({ title: "SRE", company: "Globex", hasApplyUrl: true });

    // bounded: probe forced count<=5
    expect(safeGet.mock.calls[0][0]).toContain("count=5");
    // no side effects
    expect(await Job.countDocuments()).toBe(0);
    expect(await JobGroup.countDocuments()).toBe(0);
    expect(await SyncRun.countDocuments()).toBe(0);
    // audit written with the real admin id
    const audits = await AdminAudit.find({ action: "job-source.test" }).lean();
    expect(audits).toHaveLength(1);
    expect(String(audits[0].userId)).toBe(String(adminId));
  });

  it("reports ok:false with the error kind when the source endpoint fails", async () => {
    const src = await JobSource.create({ key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: false, config: {} });
    safeGet.mockRejectedValue(new SourceHttpError("HTTP 429 from jobicy.com", "http"));

    const res = mockRes();
    await testJobSource(makeReq(src._id), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.ok).toBe(false);
    expect(res.body.data.kind).toBe("http");
    expect(await Job.countDocuments()).toBe(0);
  });

  it("400s before any outbound call when the credential is missing", async () => {
    const src = await JobSource.create({ key: "usajobs:g", name: "USAJOBS", type: "feed", adapter: "usajobs", enabled: false, config: { apiKeyRef: "USAJOBS_API_KEY", userAgentRef: "USAJOBS_USER_AGENT" } });
    const res = mockRes();
    await testJobSource(makeReq(src._id), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Credential not configured/);
    expect(safeGet).not.toHaveBeenCalled();
  });

  it("400s on an invalid stored config", async () => {
    const src = await JobSource.create({ key: "gh:x", name: "GH", type: "ats", adapter: "greenhouse", enabled: false, config: {} });
    const res = mockRes();
    await testJobSource(makeReq(src._id), res);
    expect(res.statusCode).toBe(400);
    expect(safeGet).not.toHaveBeenCalled();
  });

  it("reachable-but-empty → ok:false with an explanatory note", async () => {
    const src = await JobSource.create({ key: "jobicy:g", name: "Jobicy", type: "aggregator", adapter: "jobicy", enabled: false, config: {} });
    safeGet.mockResolvedValue(okBody({ jobs: [], success: true }));
    const res = mockRes();
    await testJobSource(makeReq(src._id), res);
    expect(res.body.data.ok).toBe(false);
    expect(res.body.data.note).toMatch(/no rows/i);
  });
});
