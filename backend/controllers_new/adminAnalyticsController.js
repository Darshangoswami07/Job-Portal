/**
 * Admin analytics dashboard data + AI quality controls (Phase 10 §10.7–10.10).
 * Aggregated, projected, privacy-safe — never raw events, never secrets.
 */
import { buildAnalytics } from "../services/analytics/aggregate.js";
import { aiQualitySnapshot, checkAiQuality, clearAiQualityGuard } from "../services/jobs/aiQualityGuard.js";
import { aiProviderStatus } from "../services/jobs/aiProvider.js";
import { isPrecomputeEnabled } from "../services/jobs/recoPrecompute.js";
import { evaluate } from "../services/jobs/matchEval.js";

export const getAdminAnalytics = async (req, res) => {
  try {
    const days = Math.max(1, Math.min(Number(req.query.days) || 30, 180));
    const data = await buildAnalytics({ days }).catch((err) => {
      console.error("buildAnalytics partial failure:", err.message);
      return { error: "analytics-partial", generatedAt: new Date().toISOString() };
    });
    return res.status(200).json({
      success: true,
      data: {
        ...data,
        config: {
          ...aiProviderStatus(),
          precomputeEnabled: isPrecomputeEnabled(),
          aiQuality: aiQualitySnapshot(),
        },
        offlineBenchmark: benchmarkSummary(evaluate()),
      },
    });
  } catch (error) {
    console.error("getAdminAnalytics error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load analytics" });
  }
};

// ── POST /api/v1/admin/analytics/ai-quality/check ───────────────────────────
export const runAiQualityCheck = async (_req, res) => {
  try {
    // In production `aiRowFor` would call the configured provider; here (and
    // when no provider is set) it returns null → AI == deterministic, guard stays open.
    const snap = await checkAiQuality(async () => null);
    return res.status(200).json({ success: true, data: snap });
  } catch (error) {
    console.error("runAiQualityCheck error:", error.message);
    return res.status(500).json({ success: false, message: "Quality check failed" });
  }
};

// ── POST /api/v1/admin/analytics/ai-quality/clear ──────────────────────────
export const clearAiQuality = (_req, res) => {
  clearAiQualityGuard();
  return res.status(200).json({ success: true, data: aiQualitySnapshot() });
};

function benchmarkSummary(report) {
  return {
    precisionAt5: round(report.meanPrecisionAtK),
    hitRateAt5: round(report.hitRateAtK),
    mrr: round(report.mrr),
    ndcgAt5: round(report.ndcgAtK ?? null),
    topHitRate: round(report.perUser.filter((r) => r.topIsRelevant).length / report.perUser.length),
    personas: report.perUser.length,
  };
}
const round = (n) => (n === null || n === undefined ? null : Math.round(n * 100) / 100);
