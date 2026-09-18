/**
 * Recommendation-quality observability (PLAN.md Phase 9 §41–45).
 *
 * Small in-process counters + a bounded latency ring. NEVER records prompts,
 * profile contents, application data, tokens, credentials or any PII — only
 * operational metadata. Resets on restart (that is acceptable for this scope;
 * a metrics backend is out of scope).
 */
const LAT_RING = 200;

const state = {
  since: new Date().toISOString(),
  requests: 0,
  strategy: { deterministic: 0, "deterministic+ai": 0, fallback: 0 },
  ai: { attempts: 0, success: 0, fallback: 0, errors: {} }, // errors: { timeout, http, rate_limit, parse, network, disabled, other }
  cache: { hit: 0, miss: 0, error: 0, store: 0 },
  candidates: { sum: 0, n: 0, aiSum: 0, aiN: 0 },
  dismissals: 0,
  precompute: { runs: 0, users: 0, failures: 0 },
  latency: { total: [], ai: [] },
};

const push = (ring, ms) => {
  if (!Number.isFinite(ms)) return;
  ring.push(Math.round(ms));
  if (ring.length > LAT_RING) ring.shift();
};
const pct = (ring, p) => {
  if (!ring.length) return null;
  const s = [...ring].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const avg = (ring) => (ring.length ? Math.round(ring.reduce((a, b) => a + b, 0) / ring.length) : null);

export const recoMetrics = {
  recordRequest({ strategy, candidateCount, aiCandidateCount, totalMs, aiMs } = {}) {
    state.requests += 1;
    if (strategy && state.strategy[strategy] !== undefined) state.strategy[strategy] += 1;
    if (Number.isFinite(candidateCount)) { state.candidates.sum += candidateCount; state.candidates.n += 1; }
    if (Number.isFinite(aiCandidateCount)) { state.candidates.aiSum += aiCandidateCount; state.candidates.aiN += 1; }
    push(state.latency.total, totalMs);
    push(state.latency.ai, aiMs);
  },
  recordAiAttempt() { state.ai.attempts += 1; },
  recordAiSuccess() { state.ai.success += 1; },
  recordAiFallback(errorKind = "other") {
    state.ai.fallback += 1;
    const k = ["timeout", "http", "rate_limit", "parse", "network", "disabled", "other"].includes(errorKind) ? errorKind : "other";
    state.ai.errors[k] = (state.ai.errors[k] || 0) + 1;
  },
  recordCache(kind) { if (state.cache[kind] !== undefined) state.cache[kind] += 1; },
  recordDismissal() { state.dismissals += 1; },
  recordPrecompute({ users = 0, failures = 0 } = {}) {
    state.precompute.runs += 1;
    state.precompute.users += users;
    state.precompute.failures += failures;
  },

  /** Aggregated, privacy-safe snapshot for an admin dashboard. */
  snapshot() {
    const cacheTotal = state.cache.hit + state.cache.miss;
    const aiRate = state.ai.attempts ? state.ai.success / state.ai.attempts : null;
    return {
      since: state.since,
      requests: state.requests,
      strategy: { ...state.strategy },
      cache: {
        ...state.cache,
        hitRate: cacheTotal ? round(state.cache.hit / cacheTotal) : null,
      },
      ai: {
        attempts: state.ai.attempts,
        success: state.ai.success,
        fallback: state.ai.fallback,
        successRate: aiRate === null ? null : round(aiRate),
        fallbackRate: state.ai.attempts ? round(state.ai.fallback / state.ai.attempts) : null,
        errors: { ...state.ai.errors },
      },
      candidates: {
        avg: state.candidates.n ? round(state.candidates.sum / state.candidates.n, 1) : null,
        aiAvg: state.candidates.aiN ? round(state.candidates.aiSum / state.candidates.aiN, 1) : null,
      },
      latencyMs: {
        totalAvg: avg(state.latency.total),
        totalP95: pct(state.latency.total, 95),
        aiAvg: avg(state.latency.ai),
        aiP95: pct(state.latency.ai, 95),
        samples: state.latency.total.length,
      },
      dismissals: state.dismissals,
      precompute: { ...state.precompute },
    };
  },

  _reset() {
    Object.assign(state, {
      requests: 0,
      strategy: { deterministic: 0, "deterministic+ai": 0, fallback: 0 },
      ai: { attempts: 0, success: 0, fallback: 0, errors: {} },
      cache: { hit: 0, miss: 0, error: 0, store: 0 },
      candidates: { sum: 0, n: 0, aiSum: 0, aiN: 0 },
      dismissals: 0,
      precompute: { runs: 0, users: 0, failures: 0 },
      latency: { total: [], ai: [] },
    });
  },
};

function round(n, dp = 2) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
