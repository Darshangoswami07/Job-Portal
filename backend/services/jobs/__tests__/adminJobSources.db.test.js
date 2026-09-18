import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../sources/httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { useTestDb } from "../../../test/mongo.js";
import { User } from "../../../models/user.model.js";
import { Job } from "../../../models/job.model.js";
import { Company } from "../../../models/company.model.js";
import { JobSource } from "../../../models_new/JobSource.js";
import { SyncRun } from "../../../models_new/SyncRun.js";
import { AdminAudit } from "../../../models_new/AdminAudit.js";
import { safeGet, SourceHttpError } from "../../sources/httpClient.js";
import requireRole from "../../../middlewares/requireRole.js";
import { ensureInternalSource } from "../../sources/internal.js";
import { acquireSourceLock } from "../sourceLock.js";
import {
  listJobSources,
  getJobSource,
  createJobSource,
  updateJobSource,
  syncJobSource,
  verifyJobSourceLinks,
  listSyncRuns,
  getJobSourceHealth,
  getAdapterCatalog,
} from "../../../controllers_new/adminJobSourceController.js";

useTestDb();

let admin;
let seeker;
let recruiter;

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  res.redirect = (c, u) => ((res.statusCode = c), (res._redirect = u), res);
  return res;
};
const req = (over = {}) => ({ id: admin?._id, params: {}, query: {}, body: {}, ...over });

const ghPayload = (jobs) => ({ status: 200, headers: {}, body: JSON.stringify({ jobs, meta: { total: jobs.length } }), url: "x" });

beforeEach(async () => {
  safeGet.mockReset();
  admin = await User.create({ fullname: "A", email: `a${Date.now()}@x.com`, password: "h", roles: { admin: true } });
  seeker = await User.create({ fullname: "S", email: `s${Date.now()}@x.com`, password: "h", roles: { jobSeeker: true } });
  recruiter = await User.create({ fullname: "R", email: `r${Date.now()}@x.com`, password: "h", roles: { recruiter: true } });
  await ensureInternalSource();
});

// ── authorization ────────────────────────────────────────────────────────
describe("requireRole('admin')", () => {
  const run = async (userId) => {
    const res = mockRes();
    let nexted = false;
    await requireRole("admin")({ id: userId }, res, () => (nexted = true));
    return { res, nexted };
  };

  it("rejects anonymous", async () => {
    const { res, nexted } = await run(undefined);
    expect(res.statusCode).toBe(401);
    expect(nexted).toBe(false);
  });
  it("rejects a regular user", async () => {
    const { res, nexted } = await run(seeker._id);
    expect(res.statusCode).toBe(403);
    expect(nexted).toBe(false);
  });
  it("rejects a recruiter", async () => {
    const { res, nexted } = await run(recruiter._id);
    expect(res.statusCode).toBe(403);
    expect(nexted).toBe(false);
  });
  it("allows an admin", async () => {
    const { nexted } = await run(admin._id);
    expect(nexted).toBe(true);
  });
});

// ── list / detail ────────────────────────────────────────────────────────
describe("list & detail", () => {
  it("lists sources with computed health and NO secrets", async () => {
    await JobSource.create({
      key: "adzuna",
      name: "Adzuna",
      type: "aggregator",
      adapter: "adzuna",
      enabled: true,
      config: { appIdRef: "ADZUNA_APP_ID", appKeyRef: "ADZUNA_APP_KEY", country: "in" },
    });
    const res = mockRes();
    await listJobSources(req(), res);
    expect(res.body.success).toBe(true);
    const sources = res.body.data.sources;
    expect(sources.length).toBeGreaterThanOrEqual(2);

    const json = JSON.stringify(res.body);
    expect(json).not.toContain("credentialRef");
    expect(json).not.toContain("ADZUNA_APP_ID"); // env var name redacted
    expect(json).not.toContain("ADZUNA_APP_KEY");

    const adzuna = sources.find((s) => s.key === "adzuna");
    expect(adzuna.credentials).toEqual({ configured: false });
    expect(adzuna.config.country).toBe("in");
    expect(adzuna.config.appIdRef).toBe("***configured***");
    expect(adzuna.health.status).toBe("error"); // enabled but no credentials
    const internal = sources.find((s) => s.key === "internal");
    expect(internal.health.status).toBe("warning"); // enabled, never synced
  });

  it("detail returns job counts + last run + warnings, id validated", async () => {
    const src = await JobSource.findOne({ key: "internal" });
    const bad = mockRes();
    await getJobSource(req({ params: { id: "nope" } }), bad);
    expect(bad.statusCode).toBe(400);

    const res = mockRes();
    await getJobSource(req({ params: { id: String(src._id) } }), res);
    expect(res.body.data.source.jobs).toEqual({ total: 0, active: 0, expired: 0 });
    expect(Array.isArray(res.body.data.warnings)).toBe(true);
  });
});

// ── create ───────────────────────────────────────────────────────────────
describe("create", () => {
  const base = { key: "greenhouse:acme", name: "Acme GH", type: "ats", adapter: "greenhouse", config: { boardToken: "acme" } };

  it("creates a valid source", async () => {
    const res = mockRes();
    await createJobSource(req({ body: base }), res);
    expect(res.statusCode).toBe(201);
    expect(res.body.data.source.key).toBe("greenhouse:acme");
    expect(await AdminAudit.countDocuments({ action: "job-source.create" })).toBe(1);
  });

  it("rejects a duplicate key", async () => {
    await JobSource.create(base);
    const res = mockRes();
    await createJobSource(req({ body: base }), res);
    expect(res.statusCode).toBe(409);
  });

  it("rejects an unknown adapter", async () => {
    const res = mockRes();
    await createJobSource(req({ body: { ...base, adapter: "scraper", key: "x" } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/adapter/i);
  });

  it("rejects invalid adapter config", async () => {
    const res = mockRes();
    await createJobSource(req({ body: { ...base, key: "y", config: {} } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/boardToken/);
  });

  it("rejects a credentialRef that looks like a value, not an env name", async () => {
    const res = mockRes();
    await createJobSource(req({ body: { ...base, key: "z", credentialRef: "sk-abc123def" } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/ENV VAR NAME/);
  });
});

// ── update / enable-disable ──────────────────────────────────────────────
describe("update", () => {
  it("enables/disables and audits; disabling never deletes data", async () => {
    const src = await JobSource.create({ key: "gh:1", name: "GH", type: "ats", adapter: "greenhouse", enabled: false, config: { boardToken: "acme" } });
    await Job.create({ title: "T", description: "d".repeat(60), location: "X", sourceId: src._id, sourceType: "ats", externalId: "e1", status: "active", dedupeHash: "h1" });

    let res = mockRes();
    await updateJobSource(req({ params: { id: String(src._id) }, body: { enabled: true } }), res);
    expect((await JobSource.findById(src._id)).enabled).toBe(true);
    expect(await AdminAudit.countDocuments({ action: "job-source.enable" })).toBe(1);

    res = mockRes();
    await updateJobSource(req({ params: { id: String(src._id) }, body: { enabled: false } }), res);
    expect((await JobSource.findById(src._id)).enabled).toBe(false);
    expect(await Job.countDocuments()).toBe(1); // jobs untouched
    expect(await AdminAudit.countDocuments({ action: "job-source.disable" })).toBe(1);
  });

  it("refuses to change protected identity fields", async () => {
    const src = await JobSource.create({ key: "gh:2", name: "GH", type: "ats", adapter: "greenhouse", config: { boardToken: "acme" } });
    const res = mockRes();
    await updateJobSource(req({ params: { id: String(src._id) }, body: { adapter: "adzuna" } }), res);
    expect(res.statusCode).toBe(400);
  });

  it("re-validates merged config and rejects bad values", async () => {
    const src = await JobSource.create({ key: "gh:3", name: "GH", type: "ats", adapter: "greenhouse", config: { boardToken: "acme" } });
    const res = mockRes();
    await updateJobSource(req({ params: { id: String(src._id) }, body: { config: { boardToken: "bad token!" } } }), res);
    expect(res.statusCode).toBe(400);

    const rl = mockRes();
    await updateJobSource(req({ params: { id: String(src._id) }, body: { rateLimitPerMin: 99999 } }), rl);
    expect(rl.statusCode).toBe(400);
  });
});

// ── sync ─────────────────────────────────────────────────────────────────
describe("manual sync", () => {
  it("starts a background sync (202 running) and records a SyncRun", async () => {
    safeGet.mockResolvedValue(ghPayload([{ id: 1, title: "Engineer", absolute_url: "https://boards.greenhouse.io/acme/jobs/1", content: "&lt;p&gt;role&lt;/p&gt;", company_name: "Acme", location: { name: "Remote" }, metadata: [] }]));
    const src = await JobSource.create({ key: "gh:s", name: "GH", type: "ats", adapter: "greenhouse", enabled: true, rateLimitPerMin: 0, config: { boardToken: "acme" } });

    const res = mockRes();
    await syncJobSource(req({ params: { id: String(src._id) } }), res);
    expect(res.statusCode).toBe(202);
    expect(res.body.data.started).toBe(true);
    expect(res.body.data.status).toBe("running");
    expect(res.body.data.runId).toBeTruthy();
    expect(await AdminAudit.countDocuments({ action: "job-source.sync" })).toBe(1);

    // the SyncRun exists immediately (running) and finishes shortly after
    expect(await SyncRun.countDocuments({ sourceId: src._id })).toBe(1);
    for (let i = 0; i < 40; i += 1) {
      const run = await SyncRun.findById(res.body.data.runId).lean();
      if (run.status !== "running") break;
      await new Promise((r) => setTimeout(r, 50));
    }
    const run = await SyncRun.findById(res.body.data.runId).lean();
    expect(run.status).toBe("ok");
    expect(run.fetched).toBe(1);
    expect(await Job.countDocuments({ sourceId: src._id })).toBe(1);
  });

  it("rejects sync of a disabled source", async () => {
    const src = await JobSource.create({ key: "gh:d", name: "GH", type: "ats", adapter: "greenhouse", enabled: false, config: { boardToken: "acme" } });
    const res = mockRes();
    await syncJobSource(req({ params: { id: String(src._id) } }), res);
    expect(res.statusCode).toBe(409);
  });

  it("returns 409 when a sync is already running (advisory lock respected)", async () => {
    const src = await JobSource.create({ key: "gh:l", name: "GH", type: "ats", adapter: "greenhouse", enabled: true, rateLimitPerMin: 0, config: { boardToken: "acme" } });
    await acquireSourceLock(src._id, { holder: "someone-else" });
    const res = mockRes();
    await syncJobSource(req({ params: { id: String(src._id) } }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already running/i);
  });
});

// ── history ──────────────────────────────────────────────────────────────
describe("sync history", () => {
  it("paginates, caps the limit, and filters by source", async () => {
    const a = await JobSource.create({ key: "a1", name: "A", type: "ats", adapter: "greenhouse", config: { boardToken: "acme" } });
    const b = await JobSource.create({ key: "b1", name: "B", type: "ats", adapter: "greenhouse", config: { boardToken: "acme" } });
    for (let i = 0; i < 7; i += 1) await SyncRun.create({ sourceId: a._id, startedAt: new Date(Date.now() - i * 1000), status: "ok" });
    await SyncRun.create({ sourceId: b._id, startedAt: new Date(), status: "ok" });

    const res = mockRes();
    await listSyncRuns(req({ params: { id: String(a._id) }, query: { page: "1", limit: "3" } }), res);
    expect(res.body.data.runs).toHaveLength(3);
    expect(res.body.data.pagination.total).toBe(7);
    expect(res.body.data.pagination.totalPages).toBe(3);

    const capped = mockRes();
    await listSyncRuns(req({ params: { id: String(a._id) }, query: { limit: "9999" } }), capped);
    expect(capped.body.data.pagination.limit).toBe(50);
  });
});

// ── health ───────────────────────────────────────────────────────────────
describe("health endpoint", () => {
  it("reports disabled / warning / error correctly", async () => {
    const disabled = await JobSource.create({ key: "h:d", name: "D", type: "ats", adapter: "greenhouse", enabled: false, config: { boardToken: "acme" } });
    const failing = await JobSource.create({ key: "h:e", name: "E", type: "ats", adapter: "greenhouse", enabled: true, config: { boardToken: "acme" }, lastSyncStatus: "error", health: { consecutiveFailures: 4 } });

    let res = mockRes();
    await getJobSourceHealth(req({ params: { id: String(disabled._id) } }), res);
    expect(res.body.data.health.status).toBe("disabled");

    res = mockRes();
    await getJobSourceHealth(req({ params: { id: String(failing._id) } }), res);
    expect(res.body.data.health.status).toBe("error");
  });
});

// ── link verification ────────────────────────────────────────────────────
describe("verify-links", () => {
  it("only checks the source's own stored URLs, is bounded, and is failure-safe", async () => {
    const src = await JobSource.create({ key: "v:1", name: "V", type: "ats", adapter: "greenhouse", enabled: true, config: { boardToken: "acme" } });
    const other = await JobSource.create({ key: "v:2", name: "V2", type: "ats", adapter: "greenhouse", enabled: true, config: { boardToken: "b" } });
    await Job.create({ title: "A", description: "d".repeat(60), location: "X", sourceId: src._id, externalId: "1", applyType: "external", applyUrl: "https://ok.example/1", status: "active", dedupeHash: "hA" });
    await Job.create({ title: "B", description: "d".repeat(60), location: "X", sourceId: src._id, externalId: "2", applyType: "external", applyUrl: "https://dead.example/2", status: "active", dedupeHash: "hB" });
    await Job.create({ title: "C", description: "d".repeat(60), location: "X", sourceId: other._id, externalId: "3", applyType: "external", applyUrl: "https://other.example/3", status: "active", dedupeHash: "hC" });

    safeGet.mockImplementation(async (url) => {
      if (url.includes("dead")) throw new SourceHttpError("HTTP 404 from dead.example", "http");
      return { status: 200, headers: {}, body: "", url };
    });

    const res = mockRes();
    await verifyJobSourceLinks(req({ params: { id: String(src._id) }, body: { limit: 5000 } }), res);
    expect(res.body.data.checked).toBe(2); // only src's jobs, not `other`
    expect(res.body.data.verified).toBe(1);
    expect(res.body.data.dead).toBe(1);

    const deadJob = await Job.findOne({ externalId: "2" }).lean();
    expect(deadJob.status).toBe("error"); // hidden, NOT deleted
    expect(await Job.countDocuments()).toBe(3);
    expect(await AdminAudit.countDocuments({ action: "job-source.verify-links" })).toBe(1);
  });
});

// ── Phase 6: adapter catalog + live sync status ──────────────────────────
describe("adapter catalog (for the Add Source form)", () => {
  it("lists only real registered adapters with field descriptors, no secrets", async () => {
    const res = mockRes();
    await getAdapterCatalog(req(), res);
    const adapters = res.body.data.adapters;
    const names = adapters.map((a) => a.adapter);
    expect(names).toEqual(expect.arrayContaining(["internal", "greenhouse", "adzuna"]));
    expect(names).not.toContain("scraper");

    const gh = adapters.find((a) => a.adapter === "greenhouse");
    expect(gh.needsCredential).toBe(false);
    expect(gh.configFields[0].key).toBe("boardToken");

    const adzuna = adapters.find((a) => a.adapter === "adzuna");
    expect(adzuna.needsCredential).toBe(true);
    // field descriptors carry no actual values
    for (const a of adapters) {
      for (const f of a.configFields) expect(f).not.toHaveProperty("value");
    }
  });
});

describe("live sync status", () => {
  it("POST /sync returns 202 running; health reflects running then completes", async () => {
    safeGet.mockResolvedValue(
      ghPayload([{ id: 5, title: "Engineer", absolute_url: "https://boards.greenhouse.io/acme/jobs/5", content: "&lt;p&gt;r&lt;/p&gt;", company_name: "Acme", location: { name: "Remote" }, metadata: [] }])
    );
    const src = await JobSource.create({ key: "gh:live", name: "GH", type: "ats", adapter: "greenhouse", enabled: true, rateLimitPerMin: 0, config: { boardToken: "acme" } });

    const start = mockRes();
    await syncJobSource(req({ params: { id: String(src._id) } }), start);
    expect(start.statusCode).toBe(202);
    expect(start.body.data.status).toBe("running");

    for (let i = 0; i < 40; i += 1) {
      const h = mockRes();
      await getJobSourceHealth(req({ params: { id: String(src._id) } }), h);
      if (!h.body.data.running) {
        expect(h.body.data.lastRun.status).toBe("ok");
        expect(h.body.data.activeJobs).toBe(1);
        return;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error("sync never left running state");
  });
});

// ── security sweep ───────────────────────────────────────────────────────
describe("no secrets ever leave the API", () => {
  it("no response body contains credential values / env names / stack traces", async () => {
    process.env.SECRET_ADZUNA_ID = "super-secret-id";
    await JobSource.create({
      key: "sec:1",
      name: "Sec",
      type: "aggregator",
      adapter: "adzuna",
      enabled: true,
      credentialRef: "SECRET_ADZUNA_ID",
      config: { appIdRef: "SECRET_ADZUNA_ID", appKeyRef: "ADZUNA_APP_KEY" },
    });
    const list = mockRes();
    await listJobSources(req(), list);
    const src = list.body.data.sources.find((s) => s.key === "sec:1");
    const detail = mockRes();
    await getJobSource(req({ params: { id: String(src.id) } }), detail);

    for (const payload of [JSON.stringify(list.body), JSON.stringify(detail.body)]) {
      expect(payload).not.toContain("super-secret-id");
      expect(payload).not.toContain("SECRET_ADZUNA_ID");
      expect(payload).not.toContain("credentialRef");
    }
    delete process.env.SECRET_ADZUNA_ID;
  });
});
