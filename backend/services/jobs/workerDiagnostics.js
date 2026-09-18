/**
 * Read-only helpers describing what the background SyncScheduler is expected to
 * do. Pure functions over already-loaded JobSource docs — no DB, no secrets,
 * safe to log and to expose through admin diagnostics.
 *
 * There is exactly ONE scheduler (services/jobs/scheduler.js). These helpers do
 * not schedule anything; they only explain / observe it.
 */
import { effectiveSchedule } from "../sources/sourceSchedules.js";
import { cronDue, nextCronFireAfter } from "./cron.js";

/**
 * @param {Array<{key,adapter,enabled,schedule,lastSyncAt,config}>} sources  all JobSource docs
 * @param {Date} now
 * @returns {{
 *   configured:number, enabled:number, scheduled:number,
 *   enabledKeys:string[],
 *   dueNow:string[],
 *   nextDue:{ key:string, schedule:string, at:string, inMinutes:number }|null
 * }}
 */
export function describeWorkerPlan(sources = [], now = new Date()) {
  const enabled = sources.filter((s) => s.enabled);
  // "scheduled" = enabled sources that obey a cron (the internal source runs
  // every tick and has an empty effective schedule).
  const scheduled = enabled.filter((s) => Boolean(effectiveSchedule(s)));

  const dueNow = [];
  let nextDue = null;

  for (const s of enabled) {
    const schedule = effectiveSchedule(s);
    const explicit = Boolean(s.schedule && String(s.schedule).trim());
    const firstRun = !s.lastSyncAt && !explicit;
    if (firstRun || !schedule || cronDue(schedule, s.lastSyncAt, now)) dueNow.push(s.key);

    if (!schedule) continue; // every-tick source has no meaningful "next"
    const at = nextCronFireAfter(schedule, s.lastSyncAt && new Date(s.lastSyncAt) > now ? new Date(s.lastSyncAt) : now);
    if (at && (!nextDue || at < new Date(nextDue.at))) {
      nextDue = {
        key: s.key,
        schedule,
        at: at.toISOString(),
        inMinutes: Math.max(0, Math.round((at.getTime() - now.getTime()) / 60000)),
      };
    }
  }

  return {
    configured: sources.length,
    enabled: enabled.length,
    scheduled: scheduled.length,
    enabledKeys: enabled.map((s) => s.key),
    dueNow,
    nextDue,
  };
}

/**
 * Worker liveness inferred from persisted sync state ONLY. Persisted state
 * cannot tell a scheduled sync apart from a recent manual `sync:jobs`, so this
 * NEVER returns "running" — that claim requires observing a SyncRun land at a
 * real cron slot with no worker deployed elsewhere. It returns:
 *
 *   "stopped" — every cron-scheduled source has missed its window (a running
 *               worker would not let that happen)
 *   "unknown" — otherwise (could be running, could be freshly manually synced)
 *
 * @param {{ scheduledSources:number, overdueScheduledSources:string[] }} worker
 * @returns {"stopped"|"unknown"}
 */
export function inferWorkerStatus(worker = {}) {
  const scheduled = worker.scheduledSources || 0;
  if (scheduled === 0) return "unknown";
  const overdue = (worker.overdueScheduledSources || []).length;
  return overdue >= scheduled ? "stopped" : "unknown";
}
