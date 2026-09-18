/**
 * Lightweight source-health alerting (Phase 6 §31–35).
 *
 * NOT an observability platform. It watches two conditions:
 *   1. `health.consecutiveFailures >= FAILURE_THRESHOLD`
 *   2. a meaningful drop in a source's active job count
 *
 * De-duplication: `JobSource.health.alert.state` gates notifications so a
 * persistently-unhealthy source is not re-alerted every worker tick. Recovery
 * resets the state and sends a single "recovered" notification.
 *
 * Delivery is pluggable via `registerAlertHandler`. The default handler creates
 * an in-app `Notification` (type "system") for every admin user — reusing the
 * existing notification model. No email/Slack; tests never deliver anything.
 */
import { User } from "../../models/user.model.js";
import { Notification } from "../../models_new/Notification.js";

export const FAILURE_THRESHOLD = 3;
const DROP_MIN_BASELINE = 20; // ignore drops on tiny sources
const DROP_PCT = 0.4; // 40%
const DROP_MIN_ABS = 10;

// ── pluggable delivery ───────────────────────────────────────────────────
const handlers = [];
export function registerAlertHandler(fn) {
  handlers.push(fn);
  return () => {
    const i = handlers.indexOf(fn);
    if (i >= 0) handlers.splice(i, 1);
  };
}
export function _clearAlertHandlers() {
  handlers.length = 0;
}

/**
 * @param {{ sourceKey, sourceName, kind, severity, message, meta }} event
 */
export async function notifySourceHealthEvent(event) {
  const results = await Promise.allSettled(handlers.map((h) => h(event)));
  return results;
}

// default handler: in-app notification for admins
async function inAppAdminHandler(event) {
  const admins = await User.find({ "roles.admin": true }).select("_id").lean();
  if (!admins.length) return;
  await Notification.insertMany(
    admins.map((a) => ({
      user: a._id,
      type: "system",
      title: `Job source: ${event.sourceName}`,
      message: event.message,
      link: "/admin/job-sources",
      metadata: { kind: event.kind, severity: event.severity, sourceKey: event.sourceKey },
    }))
  );
}
registerAlertHandler(inAppAdminHandler);

// ── evaluation ───────────────────────────────────────────────────────────
/**
 * Decide whether the FAILURE condition changed state.
 * @returns {{ transition: "raise"|"recover"|null, event?: object, nextState: string }}
 */
export function evaluateFailureAlert(source) {
  const failures = source.health?.consecutiveFailures || 0;
  const state = source.health?.alert?.state || "ok";

  if (failures >= FAILURE_THRESHOLD && state !== "failing") {
    return {
      transition: "raise",
      nextState: "failing",
      event: {
        kind: "consecutive-failures",
        severity: "error",
        message: `${failures} consecutive sync failures. Last error: ${
          source.health?.lastError || "unknown"
        }`.slice(0, 400),
      },
    };
  }
  if (failures === 0 && state === "failing") {
    return {
      transition: "recover",
      nextState: "ok",
      event: { kind: "recovered", severity: "info", message: "Sync recovered — source is healthy again." },
    };
  }
  return { transition: null, nextState: state };
}

/**
 * Decide whether the JOB-COUNT-DROP condition changed state.
 * @param {number} prevActive baseline from the last healthy sync
 * @param {number} currActive count after this sync
 */
export function evaluateJobDropAlert(source, prevActive, currActive) {
  const state = source.health?.alert?.state || "ok";
  const baseline = Number(prevActive) || 0;
  const current = Number(currActive) || 0;

  const bigDrop =
    baseline >= DROP_MIN_BASELINE &&
    baseline - current >= DROP_MIN_ABS &&
    current <= baseline * (1 - DROP_PCT);

  if (bigDrop && state !== "jobDrop") {
    const pct = Math.round(((baseline - current) / baseline) * 100);
    return {
      transition: "raise",
      nextState: "jobDrop",
      event: {
        kind: "active-count-drop",
        severity: "warning",
        message: `Active jobs dropped ${pct}% (${baseline} → ${current}).`,
      },
    };
  }
  if (state === "jobDrop" && current >= baseline * (1 - DROP_PCT / 2)) {
    return {
      transition: "recover",
      nextState: "ok",
      event: { kind: "recovered", severity: "info", message: `Active job count recovered (${current}).` },
    };
  }
  return { transition: null, nextState: state };
}

/**
 * Run both evaluations against a source doc, fire notifications for real
 * transitions, and MUTATE `source.health.alert` (caller must `source.save()`).
 *
 * @param {object} source  a JobSource mongoose doc
 * @param {{ currActiveCount: number, runStatus: string }} ctx
 */
export async function evaluateSourceAlerts(source, { currActiveCount, runStatus } = {}) {
  source.health = source.health || {};
  source.health.alert = source.health.alert || { state: "ok", baselineActiveCount: 0, lastActiveCount: 0 };
  const alert = source.health.alert;

  // failure alert (only after a run — status tells us it just tried)
  const fail = evaluateFailureAlert(source);
  if (fail.transition) {
    alert.state = fail.nextState;
    alert.lastNotifiedAt = new Date();
    await notifySourceHealthEvent({
      sourceKey: source.key,
      sourceName: source.name,
      ...fail.event,
    }).catch(() => {});
  }

  // job-drop alert — only meaningful after a non-error run that actually ran
  if (runStatus && runStatus !== "error" && Number.isFinite(currActiveCount)) {
    const baseline = alert.baselineActiveCount || alert.lastActiveCount || currActiveCount;
    const drop = evaluateJobDropAlert(source, baseline, currActiveCount);
    if (drop.transition) {
      // don't override a "failing" state with "ok" on drop-recovery
      if (!(drop.nextState === "ok" && fail.nextState === "failing")) {
        alert.state = drop.nextState;
      }
      alert.lastNotifiedAt = new Date();
      await notifySourceHealthEvent({
        sourceKey: source.key,
        sourceName: source.name,
        ...drop.event,
      }).catch(() => {});
    }
    alert.lastActiveCount = currActiveCount;
    // move the baseline forward only on a clean run so a temporary dip doesn't
    // become the new normal
    if (runStatus === "ok" && (currActiveCount >= baseline || alert.state === "ok")) {
      alert.baselineActiveCount = currActiveCount;
    }
  }
}
