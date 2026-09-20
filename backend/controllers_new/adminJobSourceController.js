import mongoose from "mongoose";

import { JobSource } from "../models_new/JobSource.js";
import { SyncRun } from "../models_new/SyncRun.js";
import { Job } from "../models/job.model.js";
import { AdminAudit } from "../models_new/AdminAudit.js";
import { startSourceSyncBackground } from "../services/jobs/sync.js"; // side-effect: registers adapters
import { getAdapter } from "../services/sources/base.js";
import { verifyApplyLinks } from "../services/jobs/verifyLinks.js";
import { computeSourceHealth, summarizeSyncRun } from "../services/jobs/sourceHealth.js";
import {
  validateSourceConfig,
  getCredentialStatus,
  sanitizeConfig,
  knownAdapters,
  adapterSpec,
  adapterCatalog,
} from "../services/sources/configValidation.js";

const MAX_RUNS_PAGE = 50;

const audit = (req, action, source, meta = {}) =>
  AdminAudit.create({
    userId: req.id,
    action,
    targetId: source?._id,
    targetKey: source?.key || "",
    meta,
  }).catch((e) => console.error("AdminAudit write failed:", e.message));

/** Public, secret-free view of one source (health computed by the caller). */
function toSourceDTO(source, { health, lastRun, credentialStatus, jobCounts } = {}) {
  return {
    id: source._id,
    key: source.key,
    name: source.name,
    type: source.type,
    adapter: source.adapter,
    enabled: source.enabled,
    schedule: source.schedule || "",
    rateLimitPerMin: source.rateLimitPerMin,
    staleAfterDays: source.staleAfterDays,
    config: sanitizeConfig(source.config),
    credentials: { configured: credentialStatus ? credentialStatus.configured : true },
    running: Boolean(lastRun && lastRun.status === "running"),
    alertState: source.health?.alert?.state || "ok",
    health: health || null,
    lastSyncAt: source.lastSyncAt || null,
    lastSyncStatus: source.lastSyncStatus,
    lastSyncDurationMs: source.stats?.lastRunMs || 0,
    consecutiveFailures: source.health?.consecutiveFailures || 0,
    lastError: source.health?.lastError || "",
    lastErrorAt: source.health?.lastErrorAt || null,
    stats: {
      imported: source.stats?.imported || 0,
      updated: source.stats?.updated || 0,
      deactivated: source.stats?.deactivated || 0,
      lastRunMs: source.stats?.lastRunMs || 0,
    },
    lastRun: lastRun || null,
    jobs: jobCounts || null,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

async function jobCountsBySource(sourceIds) {
  const rows = await Job.aggregate([
    { $match: { sourceId: { $in: sourceIds } } },
    {
      $group: {
        _id: "$sourceId",
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "active"] }, { $ne: ["$isActive", false] }] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
      },
    },
  ]);
  const map = new Map();
  for (const r of rows) map.set(String(r._id), { total: r.total, active: r.active, expired: r.expired });
  return map;
}

async function latestRunBySource(sourceIds) {
  const rows = await SyncRun.aggregate([
    { $match: { sourceId: { $in: sourceIds } } },
    { $sort: { startedAt: -1 } },
    { $group: { _id: "$sourceId", run: { $first: "$$ROOT" } } },
  ]);
  const map = new Map();
  for (const r of rows) map.set(String(r._id), summarizeSyncRun(r.run));
  return map;
}

// ── GET / ────────────────────────────────────────────────────────────────
export const listJobSources = async (req, res) => {
  try {
    const sources = await JobSource.find().sort({ type: 1, name: 1 }).lean().limit(200);
    const ids = sources.map((s) => s._id);
    const [counts, runs] = await Promise.all([jobCountsBySource(ids), latestRunBySource(ids)]);

    const data = sources.map((s) => {
      const credentialStatus = getCredentialStatus(s.adapter, s.config);
      const configCheck = validateSourceConfig(s.adapter, s.config || {});
      const lastRun = runs.get(String(s._id)) || null;
      const health = computeSourceHealth(s, {
        lastRun,
        credentialStatus,
        configError: configCheck.error,
      });
      return toSourceDTO(s, {
        health,
        lastRun,
        credentialStatus,
        jobCounts: counts.get(String(s._id)) || { total: 0, active: 0, expired: 0 },
      });
    });

    return res.status(200).json({ success: true, data: { sources: data } });
  } catch (error) {
    console.error("listJobSources error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load job sources" });
  }
};

async function loadSourceOr404(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: "Invalid source id" });
    return null;
  }
  const source = await JobSource.findById(id);
  if (!source) {
    res.status(404).json({ success: false, message: "Job source not found" });
    return null;
  }
  return source;
}

// ── GET /:id ─────────────────────────────────────────────────────────────
export const getJobSource = async (req, res) => {
  try {
    const source = await loadSourceOr404(req, res);
    if (!source) return undefined;

    const [lastRunDoc, counts] = await Promise.all([
      SyncRun.findOne({ sourceId: source._id }).sort({ startedAt: -1 }).lean(),
      jobCountsBySource([source._id]),
    ]);
    const lastRun = summarizeSyncRun(lastRunDoc);
    const credentialStatus = getCredentialStatus(source.adapter, source.config);
    const configCheck = validateSourceConfig(source.adapter, source.config || {});
    const health = computeSourceHealth(source.toObject(), {
      lastRun,
      credentialStatus,
      configError: configCheck.error,
    });

    return res.status(200).json({
      success: true,
      data: {
        source: toSourceDTO(source.toObject(), {
          health,
          lastRun,
          credentialStatus,
          jobCounts: counts.get(String(source._id)) || { total: 0, active: 0, expired: 0 },
        }),
        warnings: [...(health.warnings || []), ...(configCheck.warnings || [])],
      },
    });
  } catch (error) {
    console.error("getJobSource error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load job source" });
  }
};

// ── POST / ───────────────────────────────────────────────────────────────
export const createJobSource = async (req, res) => {
  try {
    const { key, name, type, adapter, enabled, schedule, config, credentialRef, rateLimitPerMin, staleAfterDays } =
      req.body;

    if (!key || !name || !type || !adapter) {
      return res.status(400).json({ success: false, message: "key, name, type and adapter are required" });
    }
    if (!knownAdapters().includes(adapter)) {
      return res.status(400).json({ success: false, message: `Unknown adapter "${adapter}"` });
    }
    const spec = adapterSpec(adapter);
    if (spec && type !== spec.type) {
      return res.status(400).json({ success: false, message: `adapter "${adapter}" requires type "${spec.type}"` });
    }
    if (credentialRef && !/^[A-Z][A-Z0-9_]*$/.test(String(credentialRef))) {
      return res.status(400).json({ success: false, message: "credentialRef must be an ENV VAR NAME, not a value" });
    }
    const cfgCheck = validateSourceConfig(adapter, config || {});
    if (cfgCheck.error) return res.status(400).json({ success: false, message: cfgCheck.error });

    if (await JobSource.exists({ key })) {
      return res.status(409).json({ success: false, message: `A source with key "${key}" already exists` });
    }

    const source = await JobSource.create({
      key: String(key).trim(),
      name: String(name).trim(),
      type,
      adapter,
      enabled: Boolean(enabled),
      schedule: schedule || undefined,
      config: config || {},
      credentialRef: credentialRef || "",
      ...(rateLimitPerMin !== undefined ? { rateLimitPerMin: Number(rateLimitPerMin) } : {}),
      ...(staleAfterDays !== undefined ? { staleAfterDays: Number(staleAfterDays) } : {}),
    });

    await audit(req, "job-source.create", source, { adapter, type, enabled: source.enabled });
    return res.status(201).json({ success: true, data: { source: toSourceDTO(source.toObject()) } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate source key" });
    }
    console.error("createJobSource error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create job source" });
  }
};

// ── PATCH /:id ───────────────────────────────────────────────────────────
const MUTABLE = ["name", "enabled", "schedule", "rateLimitPerMin", "staleAfterDays", "config", "credentialRef"];
const PROTECTED = ["key", "type", "adapter"];

export const updateJobSource = async (req, res) => {
  try {
    const source = await loadSourceOr404(req, res);
    if (!source) return undefined;

    for (const f of PROTECTED) {
      if (req.body[f] !== undefined && req.body[f] !== source[f]) {
        return res.status(400).json({ success: false, message: `"${f}" cannot be changed` });
      }
    }

    const before = { enabled: source.enabled, schedule: source.schedule };
    const patch = {};
    for (const f of MUTABLE) if (req.body[f] !== undefined) patch[f] = req.body[f];

    if (patch.credentialRef && !/^[A-Z][A-Z0-9_]*$/.test(String(patch.credentialRef))) {
      return res.status(400).json({ success: false, message: "credentialRef must be an ENV VAR NAME, not a value" });
    }
    if (patch.config !== undefined) {
      const merged = { ...(source.config || {}), ...(patch.config || {}) };
      const check = validateSourceConfig(source.adapter, merged);
      if (check.error) return res.status(400).json({ success: false, message: check.error });
      patch.config = merged;
    }
    if (patch.schedule !== undefined && patch.schedule !== "") {
      const check = validateSourceConfig(source.adapter, { ...(source.config || {}), schedule: patch.schedule });
      if (check.error) return res.status(400).json({ success: false, message: check.error });
    }
    if (patch.rateLimitPerMin !== undefined) {
      const n = Number(patch.rateLimitPerMin);
      if (!Number.isFinite(n) || n < 0 || n > 1000) {
        return res.status(400).json({ success: false, message: "rateLimitPerMin must be 0–1000" });
      }
      patch.rateLimitPerMin = n;
    }

    Object.assign(source, patch);
    await source.save();

    if (patch.enabled !== undefined && patch.enabled !== before.enabled) {
      await audit(req, patch.enabled ? "job-source.enable" : "job-source.disable", source);
    } else {
      await audit(req, "job-source.update", source, { fields: Object.keys(patch) });
    }

    return res.status(200).json({ success: true, data: { source: toSourceDTO(source.toObject()) } });
  } catch (error) {
    console.error("updateJobSource error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update job source" });
  }
};

// ── POST /:id/sync ───────────────────────────────────────────────────────
export const syncJobSource = async (req, res) => {
  try {
    const source = await loadSourceOr404(req, res);
    if (!source) return undefined;

    if (!source.enabled) {
      return res.status(409).json({ success: false, message: "Source is disabled — enable it before syncing" });
    }

    await audit(req, "job-source.sync", source);
    // Non-blocking: returns as soon as the SyncRun is "running"; the UI polls
    // GET /:id/health for live status. Same advisory lock as the scheduler.
    const result = await startSourceSyncBackground(source);

    if (result.skipped === "locked") {
      return res.status(409).json({ success: false, message: "A sync for this source is already running" });
    }
    if (result.skipped) {
      return res.status(409).json({ success: false, message: `Sync skipped: ${result.skipped}` });
    }
    return res.status(202).json({
      success: true,
      data: { runId: result.runId, status: "running", started: true },
    });
  } catch (error) {
    console.error("syncJobSource error:", error.message);
    return res.status(500).json({ success: false, message: "Sync failed to start" });
  }
};

// ── POST /:id/test ───────────────────────────────────────────────────────
// Phase 18 §18.10 — a bounded connectivity + parser check. Runs the adapter's
// fetch against a hard-capped config override, returns a tiny redacted sample,
// and performs NO ingestion / NO JobGroup mutation / NO persistence.
const TEST_SAMPLE = 3;
export const testJobSource = async (req, res) => {
  try {
    const source = await loadSourceOr404(req, res);
    if (!source) return undefined;

    const cfgCheck = validateSourceConfig(source.adapter, source.config || {});
    if (cfgCheck.error) {
      return res.status(400).json({ success: false, message: cfgCheck.error });
    }
    const cred = getCredentialStatus(source.adapter, source.config);
    if (!cred.configured) {
      return res.status(400).json({
        success: false,
        message: `Credential not configured: ${cred.missing.join(", ")}`,
      });
    }
    const adapter = getAdapter(source.adapter);
    if (!adapter || typeof adapter.fetch !== "function") {
      return res.status(400).json({ success: false, message: `No adapter registered for "${source.adapter}"` });
    }

    await audit(req, "job-source.test", source);

    // hard-capped, short-timeout, single-page probe — never the real config
    const probe = {
      _id: source._id,
      key: source.key,
      name: source.name,
      type: source.type,
      adapter: source.adapter,
      rateLimitPerMin: source.rateLimitPerMin || 60,
      config: {
        ...(source.config || {}),
        pages: 1, numPages: 1, count: Math.min(Number(source.config?.count) || 5, 5),
        resultsPerPage: 5, timeoutMs: 8000,
        // keep a keyword-search probe to a single request
        maxQueries: 1, maxPagesPerQuery: 1, maxRequests: 1, queries: ["software engineer"], families: undefined, filters: undefined,
      },
    };

    const started = Date.now();
    let raw;
    try {
      raw = await adapter.fetch(probe);
    } catch (err) {
      return res.status(200).json({
        success: true,
        data: {
          ok: false,
          durationMs: Date.now() - started,
          error: String(err?.message || "fetch failed").slice(0, 300),
          kind: err?.kind || "error",
        },
      });
    }

    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.jobs) ? raw.jobs : [];
    const sample = list.slice(0, TEST_SAMPLE).map((r) => ({
      externalId: r.externalId || "",
      title: r.title || "",
      company: r.companyName || "",
      location: r.location || "",
      hasApplyUrl: Boolean(r.applyUrl || r.originalUrl),
    }));

    return res.status(200).json({
      success: true,
      data: {
        ok: list.length > 0,
        durationMs: Date.now() - started,
        fetched: list.length,
        parsed: sample.length,
        sample,
        note: list.length === 0 ? "Adapter reachable but returned no rows for the probe query" : undefined,
      },
    });
  } catch (error) {
    console.error("testJobSource error:", error.message);
    return res.status(500).json({ success: false, message: "Source test failed" });
  }
};

// ── POST /:id/verify-links ───────────────────────────────────────────────
export const verifyJobSourceLinks = async (req, res) => {
  try {
    const source = await loadSourceOr404(req, res);
    if (!source) return undefined;

    const limit = Math.min(Math.max(1, Number(req.body?.limit) || 50), 200);
    await audit(req, "job-source.verify-links", source, { limit });
    const result = await verifyApplyLinks({ sourceId: source._id, limit, commit: true });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("verifyJobSourceLinks error:", error.message);
    return res.status(500).json({ success: false, message: "Link verification failed" });
  }
};

// ── GET /:id/sync-runs ───────────────────────────────────────────────────
export const listSyncRuns = async (req, res) => {
  try {
    const source = await loadSourceOr404(req, res);
    if (!source) return undefined;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), MAX_RUNS_PAGE);
    const skip = (page - 1) * limit;

    const [runs, total] = await Promise.all([
      SyncRun.find({ sourceId: source._id }).sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
      SyncRun.countDocuments({ sourceId: source._id }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        runs: runs.map(summarizeSyncRun),
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  } catch (error) {
    console.error("listSyncRuns error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load sync history" });
  }
};

// ── GET /:id/health ──────────────────────────────────────────────────────
export const getJobSourceHealth = async (req, res) => {
  try {
    const source = await loadSourceOr404(req, res);
    if (!source) return undefined;

    const lastRunDoc = await SyncRun.findOne({ sourceId: source._id }).sort({ startedAt: -1 }).lean();
    const lastRun = summarizeSyncRun(lastRunDoc);
    const credentialStatus = getCredentialStatus(source.adapter, source.config);
    const configCheck = validateSourceConfig(source.adapter, source.config || {});
    const health = computeSourceHealth(source.toObject(), {
      lastRun,
      credentialStatus,
      configError: configCheck.error,
    });

    return res.status(200).json({
      success: true,
      data: {
        health,
        lastRun,
        running: Boolean(lastRun && lastRun.status === "running"),
        alertState: source.health?.alert?.state || "ok",
        activeJobs: await Job.countDocuments({
          sourceId: source._id,
          status: "active",
          isActive: { $ne: false },
        }),
        credentials: { configured: credentialStatus.configured },
        configWarnings: configCheck.warnings || [],
      },
    });
  } catch (error) {
    console.error("getJobSourceHealth error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load source health" });
  }
};

// ── GET /adapters ────────────────────────────────────────────────────────
export const getAdapterCatalog = async (_req, res) => {
  return res.status(200).json({ success: true, data: { adapters: adapterCatalog() } });
};
