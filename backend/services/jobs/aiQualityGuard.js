/**
 * AI quality regression guard (PLAN.md Phase 10 §10.10).
 *
 * If the AI-refined strategy scores materially WORSE than the deterministic
 * baseline on the offline benchmark, this guard trips and `refineMatches`
 * stops calling the provider — deterministic ranking is preferred. A lower-
 * quality AI strategy is never auto-preferred.
 *
 * The guard is advisory + reversible: it re-checks on demand and can be cleared.
 */
import { evaluate, evaluateAsync } from "./matchEval.js";
import { matchUserToJob } from "./matching.js";
import { setAiSuppressed } from "./aiMatcher.js";

const THRESHOLD = clamp(Number(process.env.AI_QUALITY_REGRESSION_THRESHOLD) || 0.1);

function clamp(n) {
  if (!Number.isFinite(n)) return 0.1;
  return Math.max(0.01, Math.min(n, 0.5));
}

const state = { tripped: false, lastCheck: null, baseline: null, ai: null, reason: "" };

export function isAiQualityTripped() {
  return state.tripped;
}

export function aiQualitySnapshot() {
  return { ...state, threshold: THRESHOLD };
}

export function clearAiQualityGuard() {
  state.tripped = false;
  state.reason = "";
  setAiSuppressed(false);
}

/**
 * Run the offline comparison of the AI's OWN ranking signal vs the deterministic
 * baseline. `aiRowFor(profile, group)` returns an AI-style row `{ matchScore }`
 * (or null → treated as "AI abstains", falls back to deterministic for that
 * item, so an abstaining AI can never trip the guard). In production this wraps
 * a real provider call; in tests it is a stub.
 * @returns the snapshot
 */
export async function checkAiQuality(aiRowFor) {
  const baseline = evaluate();
  const withAi = await evaluateAsync(async (profile, group) => {
    const det = matchUserToJob(profile, group).score;
    try {
      const row = await aiRowFor(profile, group);
      return row && Number.isFinite(Number(row.matchScore)) ? Number(row.matchScore) : det;
    } catch {
      return det;
    }
  });

  // Composite quality = mean of the three headline metrics.
  const q = (r) => (r.meanPrecisionAtK + r.hitRateAtK + r.mrr) / 3;
  const drop = q(baseline) - q(withAi);

  state.lastCheck = new Date().toISOString();
  state.baseline = round3({ p: baseline.meanPrecisionAtK, hr: baseline.hitRateAtK, mrr: baseline.mrr });
  state.ai = round3({ p: withAi.meanPrecisionAtK, hr: withAi.hitRateAtK, mrr: withAi.mrr });
  if (drop > THRESHOLD) {
    state.tripped = true;
    state.reason = `AI composite quality dropped ${drop.toFixed(3)} > ${THRESHOLD} threshold`;
    setAiSuppressed(true);
  } else {
    state.tripped = false;
    state.reason = "";
    setAiSuppressed(false);
  }
  return aiQualitySnapshot();
}

function round3(o) {
  const out = {};
  for (const [k, v] of Object.entries(o)) out[k] = Math.round(v * 1000) / 1000;
  return out;
}
