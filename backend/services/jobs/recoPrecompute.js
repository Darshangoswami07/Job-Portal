/**
 * Background recommendation precompute (PLAN.md Phase 9 §21–24).
 *
 * Warms the per-user recommendation cache so an active job-seeker's "For You"
 * page is instant. Runs as one bounded pass inside the existing scheduler tick —
 * NOT a new worker subsystem, NOT a queue. Failure-isolated: one user's build
 * error never stops the pass, and a provider/DB problem here never affects job
 * sync, search or Apply.
 *
 * Off unless `RECO_PRECOMPUTE_ENABLED === "true"`.
 */
import { User } from "../../models/user.model.js";
import { buildRecommendations } from "../../controllers_new/recommendationController.js";
import { recoMetrics } from "./recoMetrics.js";

const DEFAULT_BATCH = 25;
const HARD_BATCH = 100;
const ACTIVE_DAYS = 14;

export function isPrecomputeEnabled(env = process.env) {
  return env.RECO_PRECOMPUTE_ENABLED === "true";
}

/**
 * Eligible = job-seekers active in the last ACTIVE_DAYS with at least some
 * profile signal (skills or headline). Bounded by `limit`.
 */
async function eligibleUsers(limit) {
  const cutoff = new Date(Date.now() - ACTIVE_DAYS * 24 * 60 * 60 * 1000);
  return User.find({
    "roles.jobSeeker": true,
    updatedAt: { $gte: cutoff },
    $or: [{ "profile.skills.0": { $exists: true } }, { "profile.headline": { $gt: "" } }],
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select("_id")
    .lean();
}

/**
 * @returns {Promise<{ enabled:boolean, processed:number, failed:number, skipped?:string }>}
 */
export async function runRecoPrecompute({ env = process.env } = {}) {
  if (!isPrecomputeEnabled(env)) return { enabled: false, processed: 0, failed: 0, skipped: "disabled" };

  const batch = Math.max(1, Math.min(Number(env.RECO_PRECOMPUTE_BATCH) || DEFAULT_BATCH, HARD_BATCH));
  const users = await eligibleUsers(batch);

  let processed = 0;
  let failed = 0;
  for (const u of users) {
    try {
      await buildRecommendations(u._id, { force: true }); // warms the cache
      processed += 1;
    } catch (err) {
      failed += 1;
      console.warn(`[recoPrecompute] user ${String(u._id).slice(-6)} failed: ${err.message}`);
    }
  }
  recoMetrics.recordPrecompute({ users: processed, failures: failed });
  return { enabled: true, processed, failed };
}
