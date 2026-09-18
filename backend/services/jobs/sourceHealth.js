/**
 * Compute an operational health status for a JobSource (Phase 5 §12 / §17).
 *
 * Pure — it takes already-loaded state (the source doc + its latest SyncRun +
 * a credential-status result). Health is derived from ACTUAL sync state, not
 * merely "enabled".
 *
 *   disabled  — source is turned off
 *   error     — repeated failures, last run errored, or a hard config problem
 *   warning   — never synced, last run partial, stale, or credentials missing
 *   healthy   — a recent successful sync
 */
const STALE_MS = 26 * 60 * 60 * 1000; // ~1 day + slack

export function computeSourceHealth(source = {}, { lastRun, credentialStatus, configError } = {}) {
  const warnings = [];

  if (!source.enabled) {
    return { status: "disabled", warnings: ["Source is disabled — it will not be synced"] };
  }

  if (configError) {
    return { status: "error", warnings: [configError] };
  }

  const failures = source.health?.consecutiveFailures || 0;
  const lastStatus = source.lastSyncStatus || "never";
  const lastSyncAt = source.lastSyncAt ? new Date(source.lastSyncAt).getTime() : 0;
  const age = lastSyncAt ? Date.now() - lastSyncAt : Infinity;

  if (credentialStatus && credentialStatus.configured === false) {
    warnings.push("Credential not configured");
  }
  if (failures >= 3) warnings.push(`${failures} consecutive sync failures`);
  if (lastStatus === "error") warnings.push("Last sync failed");
  if (lastStatus === "partial") warnings.push("Last sync completed with errors");
  if (lastStatus === "never") warnings.push("Source has never synced");
  if (Number.isFinite(age) && age > STALE_MS) warnings.push("No sync in over 24 hours");
  if (!Number.isFinite(age) && lastStatus !== "never") warnings.push("No successful sync recorded");
  if (
    lastRun &&
    lastRun.status === "ok" &&
    (lastRun.fetched || 0) === 0 &&
    (source.stats?.imported || 0) > 0
  ) {
    warnings.push("Last sync returned no jobs");
  }

  let status = "healthy";
  if (
    failures >= 3 ||
    lastStatus === "error" ||
    (credentialStatus && credentialStatus.configured === false)
  ) {
    status = "error";
  } else if (
    lastStatus === "never" ||
    lastStatus === "partial" ||
    (Number.isFinite(age) && age > STALE_MS) ||
    warnings.length > 0
  ) {
    status = "warning";
  }

  return { status, warnings };
}

/** Compact, secret-free summary of a SyncRun for the admin UI. */
export function summarizeSyncRun(run) {
  if (!run) return null;
  return {
    id: run._id,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.durationMs,
    status: run.status,
    fetched: run.fetched || 0,
    inserted: run.inserted || 0,
    updated: run.updated || 0,
    unchanged: run.unchanged || 0,
    deactivated: run.deactivated || 0,
    errorCount: Array.isArray(run.errorLog) ? run.errorLog.length : 0,
    // first-line error messages only — never stack traces / paths
    errors: Array.isArray(run.errorLog)
      ? run.errorLog.slice(0, 10).map((e) => ({ stage: e.stage || "", message: String(e.message || "").slice(0, 300) }))
      : [],
  };
}
