/**
 * Admin recommendation-quality dashboard data (PLAN.md Phase 9 §45).
 * Aggregated operational metadata only — never prompts, profiles, application
 * content, tokens or credentials.
 */
import { recoMetrics } from "../services/jobs/recoMetrics.js";
import { aiProviderStatus } from "../services/jobs/aiProvider.js";
import { evaluate } from "../services/jobs/matchEval.js";

export const getRecoMetrics = async (_req, res) => {
  try {
    const provider = aiProviderStatus(); // { featureEnabled, providerName, providerConfigured, promptVersion }
    return res.status(200).json({
      success: true,
      data: {
        provider,
        runtime: recoMetrics.snapshot(),
        offlineBenchmark: {
          deterministic: summarize(evaluate()),
          note: "Synthetic offline benchmark. AI column requires a configured provider and is measured via evaluate(aiScorer).",
        },
      },
    });
  } catch (error) {
    console.error("getRecoMetrics error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load recommendation metrics" });
  }
};

function summarize(report) {
  return {
    precisionAt5: round(report.meanPrecisionAtK),
    hitRateAt5: round(report.hitRateAtK),
    mrr: round(report.mrr),
    topHitRate: round(report.perUser.filter((r) => r.topIsRelevant).length / report.perUser.length),
    users: report.perUser.length,
  };
}
const round = (n) => Math.round(n * 100) / 100;
