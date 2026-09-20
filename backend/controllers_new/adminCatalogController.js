/**
 * Admin catalog / source-coverage diagnostics (PLAN.md Phase 12 §12.2,
 * Phase 13 §13.13–13.15). Aggregated, projected, admin-only. No secrets, no
 * private user data, no raw provider payloads.
 */
import { JobSource } from "../models_new/JobSource.js";
import { SyncRun } from "../models_new/SyncRun.js";
import { Job } from "../models/job.model.js";
import { JobGroup } from "../models_new/JobGroup.js";
import { capabilityMatrix, SOURCE_CAPABILITIES } from "../services/sources/sourceCapabilities.js";
import { effectiveSchedule } from "../services/sources/sourceSchedules.js";
import { nextCronFireAfter } from "../services/jobs/cron.js";
import { inferWorkerStatus } from "../services/jobs/workerDiagnostics.js";
import {
  knownAdapters,
  validateSourceConfig,
  getCredentialStatus,
  adapterSpec,
} from "../services/sources/configValidation.js";

const CLOSED = ["expired", "filled", "removed", "error"];
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/**
 * Rough expected interval (ms) for an effective schedule string, used only to
 * decide whether a source is "overdue". Not a scheduler — a heuristic over the
 * cadences sourceSchedules.js actually emits.
 */
function estimateScheduleIntervalMs(cron) {
  const c = String(cron || "").trim();
  if (!c) return 5 * 60 * 1000; // internal — every tick
  const parts = c.split(/\s+/);
  if (parts.length !== 5) return 6 * HOUR_MS;
  const [min, hour] = parts;
  if (/^\*\/(\d+)$/.test(min)) return Math.max(1, Number(min.split("/")[1])) * 60 * 1000;
  if (/^\*\/(\d+)$/.test(hour)) return Math.max(1, Number(hour.split("/")[1])) * HOUR_MS;
  if (hour === "*") return HOUR_MS;
  return DAY_MS; // a fixed hour → daily
}

/**
 * Deterministic 0–100 operational score from ACTUAL persisted sync state.
 * `null` for a source that is not an enabled+configured implemented adapter.
 */
function computeSourceQualityScore({ availability, configured, enabled, lastSyncStatus, consecutiveFailures, overdue, todayRuns, todayFailures, activeJobs, hasSynced }) {
  if (availability !== "implemented" || !configured || !enabled) return null;
  let score = 100;
  if (lastSyncStatus === "error") score -= 50;
  else if (lastSyncStatus === "partial") score -= 15;
  else if (lastSyncStatus === "never") score -= 30;
  score -= Math.min(40, (consecutiveFailures || 0) * 10);
  if (overdue) score -= 20;
  if (todayRuns > 0) score -= Math.round((todayFailures / todayRuns) * 30);
  if (hasSynced && activeJobs === 0) score -= 15;
  return Math.max(0, Math.min(100, score));
}

// ── GET /api/v1/admin/job-sources/config-check ────────────────────────────
// Phase 18 §18.6 — a safe activation-readiness diagnostic. For every
// implemented adapter and every configured JobSource: is it configured, what
// config fields are missing, is the required credential present (by NAME only),
// is it enabled. NEVER returns a secret value or an env-var's contents.
export const getConfigCheck = async (_req, res) => {
  try {
    const adapters = knownAdapters();
    const sources = await JobSource.find({})
      .select("key name adapter type enabled config")
      .lean();
    const bySrcAdapter = new Map();
    for (const s of sources) {
      if (!bySrcAdapter.has(s.adapter)) bySrcAdapter.set(s.adapter, []);
      bySrcAdapter.get(s.adapter).push(s);
    }

    const rows = adapters.map((adapter) => {
      const spec = adapterSpec(adapter) || {};
      const required = Array.isArray(spec.required) ? spec.required : [];
      const credentialEnvNames =
        typeof spec.credentialEnvs === "function"
          ? spec.credentialEnvs({})
          : spec.credentialEnvs || [];

      const srcs = (bySrcAdapter.get(adapter) || []).map((s) => {
        const cfg = s.config || {};
        const cfgCheck = validateSourceConfig(adapter, cfg);
        const cred = getCredentialStatus(adapter, cfg);
        const missingConfig = required.filter(
          (k) => cfg[k] === undefined || cfg[k] === "" || cfg[k] === null
        );
        return {
          key: s.key,
          name: s.name,
          enabled: Boolean(s.enabled),
          configValid: !cfgCheck.error,
          configError: cfgCheck.error || null,
          missingConfig,
          credentialRequired: (typeof spec.credentialEnvs === "function"
            ? spec.credentialEnvs(cfg)
            : spec.credentialEnvs || []
          ).length > 0,
          credentialPresent: cred.configured,
          missingCredentialEnvNames: cred.missing, // NAMES, never values
          activationReady:
            !cfgCheck.error && missingConfig.length === 0 && cred.configured,
        };
      });

      return {
        adapter,
        type: spec.type || null,
        requiresCredential: credentialEnvNames.length > 0,
        credentialEnvNames, // NAMES only
        sources: srcs,
        hasConfiguredSource: srcs.some((x) => x.activationReady),
      };
    });

    return res.status(200).json({
      success: true,
      data: { generatedAt: new Date().toISOString(), adapters: rows },
    });
  } catch (error) {
    console.error("getConfigCheck error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to run config check" });
  }
};

// ── GET /api/v1/admin/job-sources/capabilities ─────────────────────────────
export const getCapabilityMatrix = async (_req, res) => {
  const matrix = capabilityMatrix();
  const summary = matrix.reduce(
    (acc, s) => ((acc[s.availability] = (acc[s.availability] || 0) + 1), acc),
    {}
  );
  return res.status(200).json({ success: true, data: { summary, sources: matrix } });
};

// ── GET /api/v1/admin/catalog-health ──────────────────────────────────────
export const getCatalogHealth = async (_req, res) => {
  try {
    const activeJob = { isActive: { $ne: false }, status: { $nin: CLOSED } };
    const staleCutoff = new Date(Date.now() - 2 * DAY_MS);

    const [
      totalJobs, activeJobs, totalGroups, activeGroups,
      missingGroupId, missingGroupKey, orphanGroups,
      sources,
    ] = await Promise.all([
      Job.estimatedDocumentCount(),
      Job.countDocuments(activeJob),
      JobGroup.estimatedDocumentCount(),
      JobGroup.countDocuments({ status: "active" }),
      Job.countDocuments({ ...activeJob, $or: [{ groupId: null }, { groupId: { $exists: false } }] }),
      Job.countDocuments({ ...activeJob, $or: [{ groupKey: "" }, { groupKey: { $exists: false } }, { groupKey: null }] }),
      JobGroup.countDocuments({ status: "active", $or: [{ "sources.0": { $exists: false } }, { activeSourceCount: 0 }] }),
      JobSource.find({}).select("key name enabled adapter type lastSyncAt lastSyncStatus schedule").lean(),
    ]);

    // per-source active-job counts (one grouped query — no N+1)
    const bySource = await Job.aggregate([
      { $match: activeJob },
      { $group: { _id: "$sourceId", n: { $sum: 1 } } },
    ]);
    const activeBySource = new Map(bySource.map((r) => [String(r._id), r.n]));

    // Duplicate-control + diversity + freshness — bounded aggregates over
    // active jobs / groups. Real values only; never fabricated history.
    const now = Date.now();
    const [multiSourceGroups, diversity, seniorityAgg, freshnessAgg] = await Promise.all([
      // groups a single vacancy is carried by from 2+ DISTINCT sources
      JobGroup.countDocuments({ status: "active", $expr: { $gte: [{ $size: { $ifNull: ["$sourceNames", []] } }, 2] } }),
      Job.aggregate([
        { $match: activeJob },
        {
          $group: {
            _id: null,
            companies: { $addToSet: "$normalizedCompany" },
            locations: { $addToSet: "$normalizedLocation" },
            remote: { $sum: { $cond: [{ $eq: ["$remoteType", "remote"] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            companies: { $size: "$companies" },
            locations: { $size: "$locations" },
            remoteJobs: "$remote",
          },
        },
      ]),
      // seniority lives on the JobGroup (computed at rebuild), not the Job row
      JobGroup.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, s: { $addToSet: "$seniority" } } },
        { $project: { _id: 0, seniorities: { $size: "$s" } } },
      ]),
      Job.aggregate([
        { $match: { ...activeJob, postedAt: { $type: "date" } } },
        {
          $group: {
            _id: null,
            withPostedAt: { $sum: 1 },
            avgAgeMs: { $avg: { $subtract: [new Date(now), "$postedAt"] } },
            oldest: { $max: { $subtract: [new Date(now), "$postedAt"] } },
            newest: { $min: { $subtract: [new Date(now), "$postedAt"] } },
          },
        },
      ]),
    ]);
    const div = diversity[0] || { companies: 0, locations: 0, remoteJobs: 0 };
    const seniorities = seniorityAgg[0]?.seniorities || 0;
    const fr = freshnessAgg[0] || null;

    const zeroActiveSources = [];
    const staleSources = [];
    for (const s of sources) {
      if (!s.enabled) continue;
      if (!(activeBySource.get(String(s._id)) > 0)) zeroActiveSources.push(s.key);
      if (!s.lastSyncAt || new Date(s.lastSyncAt) < staleCutoff) staleSources.push(s.key);
    }

    return res.status(200).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        jobs: { total: totalJobs, active: activeJobs },
        jobGroups: { total: totalGroups, active: activeGroups },
        integrity: {
          activeJobsMissingGroupId: missingGroupId,
          activeJobsMissingGroupKey: missingGroupKey,
          activeGroupsWithoutActiveMembers: orphanGroups,
          healthy: missingGroupId === 0 && missingGroupKey === 0 && orphanGroups === 0,
        },
        sources: {
          total: sources.length,
          enabled: sources.filter((s) => s.enabled).length,
          zeroActiveJobs: zeroActiveSources,
          notSyncedRecently: staleSources,
        },
        duplication: {
          activeJobRows: activeJobs,
          activeGroups,
          multiSourceGroups,
          // >1 means some vacancies are legitimately carried by several sources
          jobsPerGroup: activeGroups > 0 ? Number((activeJobs / activeGroups).toFixed(3)) : 0,
        },
        diversity: {
          companies: div.companies,
          locations: div.locations,
          seniorities,
          remoteJobs: div.remoteJobs,
        },
        freshness: fr
          ? {
              activeJobsWithPostedAt: fr.withPostedAt,
              avgAgeDays: Number((fr.avgAgeMs / DAY_MS).toFixed(1)),
              oldestDays: Number((fr.oldest / DAY_MS).toFixed(1)),
              newestDays: Number((fr.newest / DAY_MS).toFixed(1)),
            }
          : { activeJobsWithPostedAt: 0, note: "no active jobs carry a postedAt date" },
      },
    });
  } catch (error) {
    console.error("getCatalogHealth error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load catalog health" });
  }
};

// ── GET /api/v1/admin/source-coverage ─────────────────────────────────────
export const getSourceCoverage = async (_req, res) => {
  try {
    const known = new Set(knownAdapters());
    const availByAdapter = new Map(
      Object.values(SOURCE_CAPABILITIES).filter((s) => s.adapter).map((s) => [s.adapter, s.availability])
    );
    const activeJob = { isActive: { $ne: false }, status: { $nin: CLOSED } };
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const [sources, activeBySource, lastRuns, lastFailures, todayRuns] = await Promise.all([
      JobSource.find({}).select("key name enabled adapter type lastSyncAt lastSyncStatus schedule health config").lean(),
      Job.aggregate([{ $match: activeJob }, { $group: { _id: "$sourceId", n: { $sum: 1 } } }]),
      SyncRun.aggregate([
        { $sort: { startedAt: -1 } },
        { $group: { _id: "$sourceId", status: { $first: "$status" }, startedAt: { $first: "$startedAt" } } },
      ]),
      SyncRun.aggregate([
        { $match: { status: "error" } },
        { $sort: { startedAt: -1 } },
        { $group: { _id: "$sourceId", startedAt: { $first: "$startedAt" } } },
      ]),
      SyncRun.aggregate([
        { $match: { startedAt: { $gte: startOfDay } } },
        {
          $group: {
            _id: "$sourceId",
            added: { $sum: "$inserted" },
            updated: { $sum: "$updated" },
            expired: { $sum: "$deactivated" },
            reactivated: { $sum: "$reactivated" },
            runs: { $sum: 1 },
            failures: { $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const activeMap = new Map(activeBySource.map((r) => [String(r._id), r.n]));
    const lastRunMap = new Map(lastRuns.map((r) => [String(r._id), r]));
    const lastFailMap = new Map(lastFailures.map((r) => [String(r._id), r.startedAt]));
    const todayMap = new Map(todayRuns.map((r) => [String(r._id), r]));

    // Health state — combines the source's availability (from the capability
    // matrix) with its actual sync history. An unavailable source is NEVER
    // labelled "healthy".
    // A source is "overdue" when the gap since its last successful (or, failing
    // that, its last attempted) sync exceeds 3× its expected schedule interval.
    const isOverdue = (s, schedule, lastSuccessfulAt) => {
      const ref = lastSuccessfulAt || s.lastSyncAt;
      if (!ref) return true; // enabled + configured but never synced
      const grace = Math.max(3 * estimateScheduleIntervalMs(schedule), 6 * HOUR_MS);
      return Date.now() - new Date(ref).getTime() > grace;
    };

    const healthState = (s, availability, configured, overdue) => {
      if (availability === "requires-partnership" || availability === "not-verified") return availability;
      if (!s.enabled) return "disabled";
      if (!configured) return "not-configured";
      const failures = s.health?.consecutiveFailures || 0;
      const last = s.lastSyncStatus || "never";
      if (failures >= 3 || last === "error") return "error";
      if (last === "never" || last === "partial" || overdue) return "warning";
      return "healthy";
    };

    const rows = sources.map((s) => {
      const t = todayMap.get(String(s._id)) || {};
      const availability = availByAdapter.get(s.adapter) || (known.has(s.adapter) ? "implemented" : "unknown");
      const configured = known.has(s.adapter) && !validateSourceConfig(s.adapter, s.config || {}).error;
      const schedule = effectiveSchedule(s);
      const lr = lastRunMap.get(String(s._id));
      const lastSuccessfulSyncAt = (lr?.status === "ok" || lr?.status === "partial") ? lr.startedAt : null;
      const overdue = Boolean(s.enabled && configured && availability === "implemented" && isOverdue(s, schedule, lastSuccessfulSyncAt));
      const healthStateValue = healthState(s, availability, configured, overdue);
      const activeJobs = activeMap.get(String(s._id)) || 0;
      const today = {
        added: t.added || 0,
        updated: t.updated || 0,
        expired: t.expired || 0,
        reactivated: t.reactivated || 0,
        runs: t.runs || 0,
        failures: t.failures || 0,
      };
      return {
        key: s.key,
        name: s.name,
        adapter: s.adapter,
        type: s.type,
        enabled: s.enabled,
        availability,
        configured,
        healthState: healthStateValue,
        overdue,
        nextExpectedSyncAt:
          s.enabled && availability === "implemented"
            ? nextCronFireAfter(schedule, new Date(Math.max(Date.now(), new Date(s.lastSyncAt || 0).getTime())))
            : null,
        qualityScore: computeSourceQualityScore({
          availability, configured, enabled: s.enabled,
          lastSyncStatus: s.lastSyncStatus || "never",
          consecutiveFailures: s.health?.consecutiveFailures || 0,
          overdue, todayRuns: today.runs, todayFailures: today.failures,
          activeJobs, hasSynced: Boolean(s.lastSyncAt),
        }),
        schedule,
        activeJobs,
        lastSyncAt: s.lastSyncAt || null,
        lastSyncStatus: s.lastSyncStatus || null,
        lastSuccessfulSyncAt,
        lastFailedSyncAt: lastFailMap.get(String(s._id)) || null,
        consecutiveFailures: s.health?.consecutiveFailures || 0,
        today,
      };
    });

    // platform daily totals
    const totals = rows.reduce(
      (acc, r) => {
        acc.added += r.today.added;
        acc.updated += r.today.updated;
        acc.expired += r.today.expired;
        acc.reactivated += r.today.reactivated;
        acc.failures += r.today.failures;
        return acc;
      },
      { added: 0, updated: 0, expired: 0, reactivated: 0, failures: 0 }
    );

    const byAvailability = rows.reduce(
      (acc, r) => ((acc[r.availability] = (acc[r.availability] || 0) + 1), acc),
      {}
    );

    // Operational roll-up over CONFIGURABLE sources only (an implemented adapter
    // with a JobSource row) — partnership / not-verified rows are excluded so
    // they never dilute the active-source health picture.
    const operable = rows.filter((r) => r.availability === "implemented" || r.availability === "unknown");
    const health = operable.reduce(
      (acc, r) => {
        acc.configuredSources += r.configured ? 1 : 0;
        acc.enabled += r.enabled ? 1 : 0;
        acc.overdue += r.overdue ? 1 : 0;
        acc.contributing += r.enabled && r.activeJobs > 0 ? 1 : 0;
        acc[r.healthState] = (acc[r.healthState] || 0) + 1;
        return acc;
      },
      { totalConfigurableSources: operable.length, configuredSources: 0, enabled: 0, overdue: 0, contributing: 0 }
    );

    // Background-scheduler observability (Phase 24 §24G/§24H). Purely
    // descriptive — it reports what the persisted sync state shows, never a
    // fabricated "running" claim. The scheduler runs OUTSIDE the request path
    // (a dedicated worker / RUN_SYNC_WORKER), so if it is up every enabled
    // non-internal source stays inside its schedule (overdue === []).
    const scheduled = operable.filter((r) => r.enabled && r.adapter !== "internal");
    const mostRecentScheduledSync = scheduled
      .map((r) => (r.lastSyncAt ? new Date(r.lastSyncAt).getTime() : 0))
      .reduce((a, b) => Math.max(a, b), 0);
    const worker = {
      scheduledSources: scheduled.length,
      lastScheduledSyncAt: mostRecentScheduledSync ? new Date(mostRecentScheduledSync).toISOString() : null,
      nextExpectedSyncAt: scheduled
        .map((r) => r.nextExpectedSyncAt)
        .filter(Boolean)
        .sort()[0] || null,
      overdueScheduledSources: scheduled.filter((r) => r.overdue).map((r) => r.key),
      // true only when a schedule window has clearly been missed for every
      // scheduled source; false does NOT prove the worker is up.
      allScheduledOverdue: scheduled.length > 0 && scheduled.every((r) => r.overdue),
    };
    // Best-effort liveness from persisted state only — never a fabricated claim.
    worker.status = inferWorkerStatus(worker);

    return res.status(200).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        dayStartUtc: startOfDay.toISOString(),
        totals,
        byAvailability,
        health,
        worker,
        sources: rows,
      },
    });
  } catch (error) {
    console.error("getSourceCoverage error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load source coverage" });
  }
};
