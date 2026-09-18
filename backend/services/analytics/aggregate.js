/**
 * Bounded analytics aggregation for the admin dashboard (PLAN.md Phase 10
 * §10.4–10.7). All queries are time-windowed + indexed. Returns "insufficient
 * traffic" rather than inventing numbers. Never returns raw documents.
 */
import { AnalyticsEvent } from "../../models_new/AnalyticsEvent.js";
import { JobGroup } from "../../models_new/JobGroup.js";
import { Job } from "../../models/job.model.js";
import { JobSource } from "../../models_new/JobSource.js";
import { SyncRun } from "../../models_new/SyncRun.js";
import { computeSourceHealth } from "../jobs/sourceHealth.js";
import { recoMetrics } from "../jobs/recoMetrics.js";

const CLOSED = ["expired", "filled", "removed", "error"];
const MIN_SAMPLE = 20; // below this we report "insufficient traffic"

const rate = (num, den) => (den >= MIN_SAMPLE ? Math.round((num / den) * 1000) / 1000 : null);

async function countByType(since) {
  const rows = await AnalyticsEvent.aggregate([
    { $match: { at: { $gte: since } } },
    { $group: { _id: "$type", n: { $sum: 1 } } },
  ]);
  const map = {};
  for (const r of rows) map[r._id] = r.n;
  return map;
}

async function topQueries(since, type, limit = 10) {
  const rows = await AnalyticsEvent.aggregate([
    { $match: { type, at: { $gte: since }, "meta.q": { $type: "string", $ne: "" } } },
    { $group: { _id: "$meta.q", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ query: r._id, count: r.n }));
}

export async function buildAnalytics({ days = 30 } = {}) {
  const since = new Date(Date.now() - Math.max(1, Math.min(days, 180)) * 24 * 60 * 60 * 1000);

  const [
    activeJobs,
    activeGroups,
    autoMergedGroups,
    sources,
    lastRuns,
    byType,
    topSearches,
    zeroResultSearches,
  ] = await Promise.all([
    Job.countDocuments({ isActive: { $ne: false }, status: { $nin: CLOSED } }),
    JobGroup.countDocuments({ status: "active" }),
    JobGroup.countDocuments({ status: "active", autoMerged: true }),
    JobSource.find({}).select("key name enabled adapter type health lastSyncAt lastSyncStatus stats staleAfterDays config").lean(),
    SyncRun.find({}).sort({ startedAt: -1 }).limit(80).select("sourceKey status startedAt finishedAt durationMs counts").lean(),
    countByType(since),
    topQueries(since, "search_performed"),
    topQueries(since, "search_zero_result"),
  ]);

  // ── source health summary ───────────────────────────────────────────────
  const lastRunBySource = new Map();
  for (const r of lastRuns) if (!lastRunBySource.has(r.sourceKey)) lastRunBySource.set(r.sourceKey, r);
  const sourceRows = sources.map((s) => {
    const lastRun = lastRunBySource.get(s.key) || null;
    const health = computeSourceHealth(s, { lastRun });
    return {
      key: s.key,
      name: s.name,
      adapter: s.adapter,
      enabled: s.enabled,
      status: health.status,
      reason: health.reason || "",
      lastSyncAt: s.lastSyncAt || null,
      lastSyncStatus: s.lastSyncStatus || null,
      lastSyncMs: lastRun?.durationMs ?? null,
      imported: s.stats?.imported || 0,
      updated: s.stats?.updated || 0,
      deactivated: s.stats?.deactivated || 0,
      consecutiveFailures: s.health?.consecutiveFailures || 0,
    };
  });
  const healthCounts = sourceRows.reduce(
    (acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc),
    { healthy: 0, warning: 0, error: 0, disabled: 0 }
  );

  // ── search funnel ───────────────────────────────────────────────────────
  const searches = byType.search_performed || 0;
  const zeroResults = byType.search_zero_result || 0;
  const detailOpens = byType.job_view || 0;
  const applyClicks = byType.job_apply_click || 0;
  const searchFunnel = {
    windowDays: days,
    searches,
    withResults: Math.max(0, searches - zeroResults),
    zeroResult: zeroResults,
    zeroResultRate: rate(zeroResults, searches),
    detailOpens,
    applyClicks,
    detailToApplyRate: rate(applyClicks, detailOpens),
    topQueries: topSearches,
    zeroResultQueries: zeroResultSearches,
    sourceFilterUses: byType.source_filtered || 0,
    sample: searches >= MIN_SAMPLE ? "ok" : "insufficient traffic",
  };

  // ── recommendation funnel ───────────────────────────────────────────────
  const impressions = byType.recommendation_impression || 0;
  const clicks = byType.recommendation_clicked || 0;
  const recSaves = byType.recommendation_saved || 0;
  const recApplies = byType.recommendation_applied || 0;
  const recDismiss = byType.job_dismissed || 0;
  const runtime = recoMetrics.snapshot();
  const recommendationFunnel = {
    windowDays: days,
    requests: runtime.requests,
    strategy: runtime.strategy,
    impressions,
    clicks,
    saves: recSaves,
    applies: recApplies,
    dismissals: recDismiss,
    ctr: rate(clicks, impressions),
    saveRate: rate(recSaves, impressions),
    applyThroughRate: rate(recApplies, impressions),
    dismissRate: rate(recDismiss, impressions),
    cache: runtime.cache,
    ai: runtime.ai,
    latencyMs: runtime.latencyMs,
    sample: impressions >= MIN_SAMPLE ? "ok" : "insufficient traffic",
  };

  return {
    generatedAt: new Date().toISOString(),
    windowDays: days,
    overview: {
      activeJobs,
      activeGroups,
      autoMergedGroups,
      sources: sources.length,
      enabledSources: sources.filter((s) => s.enabled).length,
      sourceHealth: healthCounts,
    },
    search: searchFunnel,
    recommendations: recommendationFunnel,
    sources: sourceRows,
  };
}
