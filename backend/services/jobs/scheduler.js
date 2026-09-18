/**
 * Background sync scheduler (PLAN.md §20).
 *
 * Runs OUTSIDE the request path. Two supported deployment shapes:
 *   1. a dedicated worker process — `backend/worker.js` / `npm run worker`
 *   2. `RUN_SYNC_WORKER=true` on a single-instance web service (fallback)
 *
 * Safety:
 *   - one tick at a time (`_ticking` guard) — no overlapping ticks
 *   - each source runs through `runSourceSync`, which holds a Mongo advisory
 *     lock, so even two schedulers cannot double-sync a source
 *   - a source-level failure is caught and isolated; other sources still run
 *   - `stop()` waits for the in-flight tick, enabling graceful shutdown
 *   - the internal source (empty schedule) runs every tick; every other source
 *     obeys its own `JobSource.schedule` cron string
 */
import { JobSource } from "../../models_new/JobSource.js";
import { ensureInternalSource } from "../sources/internal.js";
import { runSourceSync } from "./sync.js";
import { verifyApplyLinks } from "./verifyLinks.js";
import { cronDue } from "./cron.js";
import { effectiveSchedule } from "../sources/sourceSchedules.js";
import { isPrecomputeEnabled, runRecoPrecompute } from "./recoPrecompute.js";

const DEFAULT_TICK_MS = 60_000;
const DEFAULT_VERIFY_SCHEDULE = "0 4 * * *"; // daily 04:00 UTC
const DEFAULT_VERIFY_LIMIT = 50;
const RECO_PRECOMPUTE_SCHEDULE = "*/15 * * * *"; // every 15 min when enabled

export class SyncScheduler {
  constructor({ tickMs = DEFAULT_TICK_MS, logger = console } = {}) {
    this.tickMs = tickMs;
    this.logger = logger;
    this._timer = null;
    this._ticking = false;
    this._stopped = true;
    this._lastPrecomputeAt = null;
  }

  start() {
    if (!this._stopped) return;
    this._stopped = false;
    this.logger.log(`[scheduler] started (tick ${this.tickMs}ms)`);
    // fire once immediately, then on the interval
    this.tick().catch((e) => this.logger.error("[scheduler] initial tick error:", e.message));
    this._timer = setInterval(() => {
      this.tick().catch((e) => this.logger.error("[scheduler] tick error:", e.message));
    }, this.tickMs);
    if (this._timer.unref) this._timer.unref();
  }

  async stop() {
    this._stopped = true;
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    // wait for an in-flight tick to finish
    for (let i = 0; i < 300 && this._ticking; i += 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
    this.logger.log("[scheduler] stopped");
  }

  async tick(now = new Date()) {
    if (this._ticking) return { skipped: "ticking", ran: [], verified: [] };
    this._ticking = true;
    const ran = [];
    const verified = [];
    try {
      await ensureInternalSource();
      const sources = await JobSource.find({ enabled: true });

      // 1. scheduled syncs — explicit `source.schedule` is honoured strictly;
      //    otherwise a per-adapter default cadence (Phase 13). Empty effective
      //    schedule = every tick (the internal source). A source on a DEFAULT
      //    cadence that has never synced runs ASAP so a freshly-added source is
      //    not left waiting for its first cron slot; an explicitly-scheduled
      //    source always waits for its own schedule.
      for (const source of sources) {
        const explicit = Boolean(source.schedule && String(source.schedule).trim());
        const schedule = effectiveSchedule(source);
        const firstRun = !source.lastSyncAt && !explicit;
        const due = firstRun || !schedule || cronDue(schedule, source.lastSyncAt, now);
        if (!due) continue;
        try {
          const result = await runSourceSync(source);
          ran.push({ key: source.key, result });
        } catch (err) {
          this.logger.error(`[scheduler] source "${source.key}" failed:`, err.message);
          ran.push({ key: source.key, result: { ok: false, error: err.message } });
        }
      }

      // 2. scheduled apply-link verification — opt-in per source, low frequency,
      //    bounded batch, SSRF-safe (uses the shared verifyApplyLinks service).
      for (const source of sources) {
        if (!source.config?.verifyLinks) continue;
        const schedule = source.config.verifyLinksSchedule || DEFAULT_VERIFY_SCHEDULE;
        if (!cronDue(schedule, source.lastVerifyLinksAt, now)) continue;
        try {
          const limit = Math.min(Number(source.config.verifyLinksLimit) || DEFAULT_VERIFY_LIMIT, 200);
          const result = await verifyApplyLinks({ sourceId: source._id, limit, commit: true });
          source.lastVerifyLinksAt = new Date();
          await source.save();
          verified.push({ key: source.key, result });
        } catch (err) {
          this.logger.error(`[scheduler] verify-links "${source.key}" failed:`, err.message);
          verified.push({ key: source.key, result: { error: err.message } });
        }
      }
      // 3. recommendation precompute — opt-in, bounded, failure-isolated.
      //    A failure here NEVER affects sync / search / Apply.
      if (isPrecomputeEnabled() && cronDue(RECO_PRECOMPUTE_SCHEDULE, this._lastPrecomputeAt, now)) {
        try {
          const r = await runRecoPrecompute();
          this._lastPrecomputeAt = now;
          this.precomputed = r;
        } catch (err) {
          this.logger.error("[scheduler] reco precompute failed:", err.message);
        }
      }
    } finally {
      this._ticking = false;
    }
    return { ran, verified, precomputed: this.precomputed };
  }
}

let singleton = null;

/** Start the process-wide scheduler (idempotent). */
export function startScheduler(opts) {
  if (singleton) return singleton;
  singleton = new SyncScheduler(opts);
  singleton.start();
  return singleton;
}

export async function stopScheduler() {
  if (!singleton) return;
  await singleton.stop();
  singleton = null;
}
