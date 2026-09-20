/**
 * Controlled verification of stored EXTERNAL apply URLs (Phase 4 §23 / Phase 5 §15).
 *
 * - bounded batch (hard cap 200)
 * - per-host sliding-window throttle
 * - only checks URLs already stored on our jobs (never a client-supplied URL)
 * - SSRF-safe client, controlled redirects
 * - a hard 404/410 → `status:"error"` + group rebuild; transient errors are
 *   left for the next pass (no penalty); a 2xx/3xx sets `lastVerifiedAt`
 * - NEVER deletes a job
 */
import { Job } from "../../models/job.model.js";
import { safeGet, throttleHost, SourceHttpError } from "../sources/httpClient.js";
import { rebuildGroup } from "./ingest.js";

const HARD_MAX = 200;
const PER_HOST_PER_MIN = 20;

/**
 * @param {{ sourceId?: any, limit?: number, commit?: boolean }} opts
 * @returns {Promise<{ checked, verified, dead, transient, skipped, commit }>}
 */
export async function verifyApplyLinks({ sourceId, limit = 50, commit = true } = {}) {
  const cap = Math.min(Math.max(1, Number(limit) || 50), HARD_MAX);

  const filter = {
    applyType: "external",
    status: "active",
    isActive: { $ne: false },
    applyUrl: { $regex: /^https?:\/\// },
  };
  if (sourceId) filter.sourceId = sourceId;

  const jobs = await Job.find(filter)
    .select("applyUrl dedupeHash groupKey sourceName lastVerifiedAt")
    .sort({ lastVerifiedAt: 1, _id: 1 })
    .limit(cap)
    .lean();

  const result = { checked: 0, verified: 0, dead: 0, transient: 0, skipped: 0, commit };

  for (const job of jobs) {
    let host;
    try {
      host = new URL(job.applyUrl).hostname;
    } catch {
      result.skipped += 1;
      continue;
    }
    result.checked += 1;
    await throttleHost(host, PER_HOST_PER_MIN);

    try {
      await safeGet(job.applyUrl, { timeoutMs: 12000, maxBytes: 64 * 1024, maxRedirects: 4 });
      result.verified += 1;
      if (commit) await Job.updateOne({ _id: job._id }, { $set: { lastVerifiedAt: new Date() } });
    } catch (err) {
      const gone =
        err instanceof SourceHttpError &&
        err.kind === "http" &&
        /HTTP 404|HTTP 410/.test(err.message);
      if (gone) {
        result.dead += 1;
        if (commit) {
          await Job.updateOne({ _id: job._id }, { $set: { status: "error", isActive: false } });
          const gk = job.groupKey || job.dedupeHash;
          if (gk) await rebuildGroup(gk).catch(() => {});
        }
      } else {
        result.transient += 1;
      }
    }
  }

  return result;
}
