/**
 * OPTIONAL AI refinement layer for job matching (PLAN.md Phase 8 §15–18, §43–44).
 *
 * Rules baked in here:
 *   - Controlled by `AI_RECOMMENDATIONS_ENABLED` (default OFF). When off, or when
 *     no provider is registered, `refineMatches` is a no-op that returns null and
 *     the deterministic score stands.
 *   - The provider is an injected function — no vendor SDK is imported here, so
 *     the app never has a hard dependency on one LLM.
 *   - The provider receives only a MINIMAL profile summary + minimal job fields.
 *     Never a password, token, email, phone, or raw application content.
 *   - The provider must return structured data; anything malformed / slow / 5xx /
 *     rate-limited → we swallow it and fall back. AI failure never breaks search.
 *   - Only a bounded candidate set is ever sent (AI_MAX_CANDIDATES).
 */
import { recoMetrics } from "./recoMetrics.js";

export const AI_MATCH_VERSION = "ai1";
export const AI_MAX_CANDIDATES = 12;
const DEFAULT_TIMEOUT_MS = 8000;

// Phase 9 §47: cap in-flight provider calls so N simultaneous recommendation
// requests can never become N simultaneous LLM calls.
const MAX_CONCURRENCY = Math.max(1, Math.min(Number(process.env.AI_MAX_CONCURRENCY) || 4, 16));
let inFlight = 0;
const waiters = [];
const acquire = () =>
  new Promise((resolve) => {
    if (inFlight < MAX_CONCURRENCY) {
      inFlight += 1;
      resolve();
    } else {
      waiters.push(resolve);
    }
  });
const release = () => {
  const next = waiters.shift();
  if (next) next();
  else inFlight -= 1;
};

let provider = null;

/**
 * Register the LLM-backed match function. Signature:
 *   async ({ profile, jobs }) => [{ groupId, matchScore (0..1), confidence, strengths[], gaps[] }]
 * Kept out of this module so tests inject a fake and production wires a real one.
 */
export function registerMatchProvider(fn) {
  provider = typeof fn === "function" ? fn : null;
}

export function clearMatchProvider() {
  provider = null;
}

// Phase 10: the AI quality guard can suppress the provider without unregistering
// it (advisory, reversible). Kept as a local flag to avoid an import cycle.
let suppressed = false;
export function setAiSuppressed(v) {
  suppressed = Boolean(v);
}
export function isAiSuppressed() {
  return suppressed;
}

export function isAiEnabled() {
  return (
    !suppressed &&
    process.env.AI_RECOMMENDATIONS_ENABLED === "true" &&
    typeof provider === "function"
  );
}

/** Minimal, PII-free profile summary for the prompt. */
export function profileSummaryForAi(profile = {}) {
  return {
    roleFamilies: profile.roleFamilies || [],
    seniority: profile.seniority || "",
    years: profile.years ?? null,
    topSkills: (profile.skills || []).slice(0, 20),
    remotePreference: profile.remotePref || "",
    jobTypePreference: profile.jobTypePref || "",
    locations: profile.locations || [],
    industries: profile.industries || [],
  };
}

/** Minimal job fields for the prompt — no source config, no internal ids beyond the group id. */
function jobForAi(group, baseline) {
  return {
    groupId: String(group._id),
    title: group.displayTitle || "",
    company: group.companyName || "",
    location: group.location || "",
    remoteType: group.remoteType || "unknown",
    jobType: group.jobType || "",
    seniority: group.seniority || "",
    skills: (group.skills || []).slice(0, 25),
    summary: (group.descriptionPreview || "").slice(0, 600),
    baselineScore: baseline?.score ?? null,
  };
}

const clamp01 = (n) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : null);

/** Validate + coerce one provider row. Returns null when unusable. */
function coerceRow(row) {
  if (!row || typeof row !== "object") return null;
  const groupId = row.groupId ? String(row.groupId) : "";
  const matchScore = clamp01(Number(row.matchScore));
  if (!groupId || matchScore === null) return null;
  const conf = ["high", "medium", "low"].includes(row.confidence) ? row.confidence : undefined;
  const arr = (v) => (Array.isArray(v) ? v.map((s) => String(s || "").slice(0, 160)).filter(Boolean).slice(0, 5) : []);
  return { groupId, matchScore, confidence: conf, strengths: arr(row.strengths), gaps: arr(row.gaps) };
}

/**
 * @param {object} profile         profile vector (buildUserProfileVector)
 * @param {Array}  scored          [{ group, baseline }] — already deterministically scored, ranked
 * @param {object} [opts]          { timeoutMs }
 * @returns {Promise<Map<string, object>|null>}  groupId → refined result, or null on any failure
 */
export async function refineMatches(profile, scored, opts = {}) {
  if (!isAiEnabled()) return null;
  const slice = (scored || []).slice(0, AI_MAX_CANDIDATES);
  if (!slice.length) return null;

  const payload = {
    profile: profileSummaryForAi(profile),
    jobs: slice.map(({ group, baseline }) => jobForAi(group, baseline)),
  };

  const timeoutMs = Number(opts.timeoutMs) || DEFAULT_TIMEOUT_MS;
  const classify = typeof opts.classifyError === "function" ? opts.classifyError : () => "other";
  recoMetrics.recordAiAttempt();
  await acquire();
  try {
    let timer;
    const result = await Promise.race([
      provider(payload),
      new Promise((_, rej) => {
        timer = setTimeout(() => rej(Object.assign(new Error("ai-timeout"), { kind: "timeout" })), timeoutMs);
      }),
    ]).finally(() => clearTimeout(timer));

    if (!Array.isArray(result)) {
      recoMetrics.recordAiFallback("parse");
      return null;
    }
    const map = new Map();
    for (const row of result) {
      const c = coerceRow(row);
      if (c) map.set(c.groupId, c);
    }
    if (!map.size) {
      recoMetrics.recordAiFallback("parse");
      return null;
    }
    recoMetrics.recordAiSuccess();
    return map;
  } catch (err) {
    // timeout / rate limit / 5xx / network / malformed — all land here
    const kind = err.kind === "timeout" ? "timeout" : classify(err);
    recoMetrics.recordAiFallback(kind);
    console.warn(`[aiMatcher] refinement skipped (${kind}): ${err.message}`);
    return null;
  } finally {
    release();
  }
}

/**
 * Blend a deterministic baseline with an optional AI row.
 * Deterministic stays the anchor (70%); AI nudges (30%). Explanations merge.
 */
export function blendMatch(baseline, aiRow) {
  if (!aiRow) return { ...baseline, strategy: "deterministic" };
  const score = Math.round((0.7 * baseline.score + 0.3 * aiRow.matchScore) * 100) / 100;
  return {
    ...baseline,
    score,
    confidence: score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low",
    reasons: [...new Set([...(aiRow.strengths || []), ...baseline.reasons])].slice(0, 5),
    gaps: [...new Set([...(aiRow.gaps || []), ...baseline.gaps])].slice(0, 4),
    strategy: "deterministic+ai",
  };
}
