/**
 * Source synchronization orchestrator (PLAN.md §14 / §20).
 *
 * `runSourceSync`            — resolve → lock → SyncRun → execute (awaited) → unlock
 * `startSourceSyncBackground`— same, but returns as soon as the SyncRun is
 *                              "running" and finishes ingestion detached (used
 *                              by the admin "Sync now" button for live status)
 * `runAllSyncs`              — sequential sync of every enabled source (CLI/worker)
 *
 * Phase 6 adds: source-aware stale expiry (`staleAfterDays`), active-job-count
 * tracking, and health-alert evaluation on every run (clean OR failed).
 */
import mongoose from "mongoose";

import { JobSource } from "../../models_new/JobSource.js";
import { Job } from "../../models/job.model.js";
import { startSyncRun, finishSyncRun, getAdapter } from "../sources/base.js";
import { ensureInternalSource, internalAdapter } from "../sources/internal.js";
// side-effect imports: register the external-source adapters
import "../sources/greenhouse.js";
import "../sources/lever.js";
import "../sources/ashby.js";
import "../sources/smartrecruiters.js";
import "../sources/workable.js";
import "../sources/adzuna.js";
import "../sources/jsearch.js";
import "../sources/jooble.js";
import "../sources/themuse.js";
import "../sources/usajobs.js";
import "../sources/jobicy.js";
import { acquireSourceLock, releaseSourceLock, newLockHolderId } from "./sourceLock.js";
import { ingestRawJob, rebuildGroup } from "./ingest.js";
import { evaluateSourceAlerts } from "./sourceAlerts.js";

const BATCH_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

async function resolveSource(ref) {
  if (ref && typeof ref === "object" && ref._id) return ref;
  if (!ref || ref === "internal") return ensureInternalSource();
  if (mongoose.isValidObjectId(ref)) return JobSource.findById(ref);
  return JobSource.findOne({ key: ref });
}

function resolveAdapter(source, provided) {
  if (provided) return provided;
  const registered = getAdapter(source.adapter);
  if (registered) return registered;
  if (source.adapter === "internal" || source.type === "internal") return internalAdapter;
  return null;
}

const activeJobCount = (sourceId) =>
  Job.countDocuments({ sourceId, status: "active", isActive: { $ne: false } });

/** The actual sync work. Self-contained: never throws out — always returns a summary. */
async function executeSync(source, run, providedAdapter, { mode = "incremental" } = {}) {
  const counts = { fetched: 0, inserted: 0, updated: 0, unchanged: 0, skipped: 0, deactivated: 0, reactivated: 0 };
  const metrics = { queriesRequested: 0, pagesRequested: 0, providerResults: 0, rejected: 0, deduped: 0, rateLimited: 0, countries: [] };
  const errorLog = [];
  const seenExternalIds = new Set();
  const touchedHashes = new Set();

  try {
    const adapter = resolveAdapter(source, providedAdapter);
    if (!adapter) throw new Error(`No adapter available for source "${source.key}" (adapter="${source.adapter}")`);

    // Adapters may return a plain RawJob[] (legacy) OR { jobs, metrics }.
    const fetched = await adapter.fetch(source, { mode });
    const rawJobs = Array.isArray(fetched) ? fetched : Array.isArray(fetched?.jobs) ? fetched.jobs : [];
    if (fetched && !Array.isArray(fetched) && fetched.metrics) Object.assign(metrics, fetched.metrics);
    counts.fetched = rawJobs.length;
    metrics.providerResults = metrics.providerResults || rawJobs.length;

    for (let i = 0; i < rawJobs.length; i += BATCH_SIZE) {
      const batch = rawJobs.slice(i, i + BATCH_SIZE);
      for (const raw of batch) {
        const extId = raw?.externalId ? String(raw.externalId) : "";
        if (extId && seenExternalIds.has(extId)) { metrics.deduped += 1; continue; } // same id across pages/queries
        try {
          const result = await ingestRawJob(raw, source);
          counts[result.action] = (counts[result.action] || 0) + 1;
          if (result.reactivated) counts.reactivated += 1;
          if (extId) seenExternalIds.add(extId);
          if (result.dedupeHash) touchedHashes.add(result.dedupeHash);
          if (result.groupKey) touchedHashes.add(result.groupKey);
          if (result.previousDedupeHash) touchedHashes.add(result.previousDedupeHash);
        } catch (err) {
          metrics.rejected += 1;
          errorLog.push({
            stage: "ingest",
            message: `${raw?.title || raw?.externalId || "?"}: ${err.message}`,
          });
        }
      }
    }

    const finalStatus = errorLog.length ? "partial" : "ok";

    // Conservative freshness sweep — expire active jobs from THIS source that a
    // CLEAN, non-empty run did not return. ONLY safe for adapters whose fetch
    // returns the source's COMPLETE current listing (ATS boards, internal).
    // Partial-coverage aggregators (keyword-search / bounded pagination) and any
    // backfill run rotate through a window, so an unseen job is NOT gone — those
    // rely solely on the per-source `staleAfterDays` sweep below.
    const partialWindow = adapter.coverage === "partial" || mode === "backfill";
    if (!partialWindow && errorLog.length === 0 && counts.fetched > 0) {
      const doomedFilter = {
        sourceId: source._id,
        externalId: { $nin: [...seenExternalIds] },
        status: "active",
        lastSeenAt: { $lt: run.startedAt },
      };
      const doomed = await Job.find(doomedFilter).select("dedupeHash groupKey").lean();
      const res = await Job.updateMany(doomedFilter, { $set: { status: "expired", isActive: false } });
      counts.deactivated += res.modifiedCount || 0;
      for (const d of doomed) {
        if (d.groupKey) touchedHashes.add(d.groupKey);
        else if (d.dedupeHash) touchedHashes.add(d.dedupeHash);
      }
    }

    // Source-aware stale expiry (Phase 6 §25–27): only when the adapter actually
    // responded (finalStatus not "error" — a thrown fetch never reaches here),
    // and only for jobs genuinely unseen for `staleAfterDays`. NOT triggered by
    // a single empty response — the threshold spans many sync cycles.
    const staleDays = Number(source.staleAfterDays) || 0;
    if (staleDays > 0) {
      const cutoff = new Date(Date.now() - staleDays * DAY_MS);
      const staleFilter = {
        sourceId: source._id,
        status: "active",
        isActive: { $ne: false },
        lastSeenAt: { $exists: true, $lt: cutoff },
      };
      const stale = await Job.find(staleFilter).select("dedupeHash groupKey").lean();
      if (stale.length) {
        const r = await Job.updateMany(staleFilter, { $set: { status: "expired", isActive: false } });
        counts.deactivated += r.modifiedCount || 0;
        for (const s of stale) {
          if (s.groupKey) touchedHashes.add(s.groupKey);
          else if (s.dedupeHash) touchedHashes.add(s.dedupeHash);
        }
      }
    }

    for (const hash of touchedHashes) {
      try {
        await rebuildGroup(hash);
      } catch (err) {
        errorLog.push({ stage: "group", message: `${hash}: ${err.message}` });
      }
    }

    source.lastSyncAt = new Date();
    source.lastSyncStatus = finalStatus;
    source.health.consecutiveFailures = 0;
    source.health.lastError = "";
    source.stats.imported = (source.stats.imported || 0) + (counts.inserted || 0);
    source.stats.updated = (source.stats.updated || 0) + (counts.updated || 0);
    source.stats.deactivated = (source.stats.deactivated || 0) + (counts.deactivated || 0);
    source.stats.lastRunMs = Date.now() - new Date(run.startedAt).getTime();

    const currActiveCount = await activeJobCount(source._id);
    await evaluateSourceAlerts(source, { currActiveCount, runStatus: finalStatus });
    await source.save();

    await finishSyncRun(run, {
      status: finalStatus,
      mode,
      fetched: counts.fetched,
      inserted: counts.inserted || 0,
      updated: counts.updated || 0,
      unchanged: counts.unchanged || 0,
      deactivated: counts.deactivated || 0,
      reactivated: counts.reactivated || 0,
      metrics,
      errorLog,
    });

    return { ok: true, sourceKey: source.key, runId: run._id, mode, counts, metrics, errors: errorLog.length };
  } catch (err) {
    source.lastSyncStatus = "error";
    source.health.consecutiveFailures = (source.health.consecutiveFailures || 0) + 1;
    source.health.lastError = err.message;
    source.health.lastErrorAt = new Date();
    await evaluateSourceAlerts(source, { runStatus: "error" }).catch(() => {});
    await source.save().catch(() => {});
    await finishSyncRun(run, {
      status: "error",
      mode,
      metrics,
      errorLog: [{ stage: "fetch", message: err.message }],
    }).catch(() => {});
    return { ok: false, sourceKey: source.key, runId: run._id, mode, error: err.message };
  }
}

/**
 * Run one synchronization for a source (awaited).
 * @param {string|object} sourceRef  key, ObjectId, or a JobSource document
 */
export async function runSourceSync(sourceRef, { adapter: providedAdapter, mode = "incremental" } = {}) {
  const source = await resolveSource(sourceRef);
  if (!source) return { ok: false, skipped: "source-not-found" };
  if (!source.enabled) return { ok: false, skipped: "disabled", sourceKey: source.key };

  const holder = newLockHolderId();
  // a backfill can legitimately run longer than the default 15-min lease
  const lock = await acquireSourceLock(source._id, { holder, ttlMs: mode === "backfill" ? 45 * 60 * 1000 : undefined });
  if (!lock.acquired) return { ok: false, skipped: "locked", sourceKey: source.key };

  const run = await startSyncRun(source);
  try {
    return await executeSync(source, run, providedAdapter, { mode });
  } finally {
    await releaseSourceLock(source._id, holder).catch(() => {});
  }
}

/**
 * Start a sync and return once the SyncRun is "running" — ingestion continues
 * detached. Used by the admin "Sync now" button so the UI can poll live status.
 */
export async function startSourceSyncBackground(sourceRef) {
  const source = await resolveSource(sourceRef);
  if (!source) return { started: false, skipped: "source-not-found" };
  if (!source.enabled) return { started: false, skipped: "disabled", sourceKey: source.key };

  const holder = newLockHolderId();
  const lock = await acquireSourceLock(source._id, { holder });
  if (!lock.acquired) return { started: false, skipped: "locked", sourceKey: source.key };

  const run = await startSyncRun(source);
  executeSync(source, run)
    .catch((e) => console.error(`[sync bg] ${source.key}:`, e.message))
    .finally(() => releaseSourceLock(source._id, holder).catch(() => {}));

  return { started: true, runId: run._id, sourceKey: source.key };
}

/** Convenience for the CLI / worker: sync every enabled source sequentially. */
export async function runAllSyncs() {
  await ensureInternalSource();
  const { ensureAggregatorSources } = await import("../sources/aggregatorSources.js");
  await ensureAggregatorSources();

  const sources = await JobSource.find({ enabled: true });
  const results = [];
  for (const source of sources) {
    try {
      results.push(await runSourceSync(source));
    } catch (err) {
      results.push({ ok: false, sourceKey: source.key, error: err.message });
    }
  }
  return results;
}
