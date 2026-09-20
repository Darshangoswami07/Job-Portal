/**
 * Level-3 cross-source dedupe: SIMILARITY ASSIST (PLAN.md §7).
 *
 * This never replaces the deterministic identity:
 *   Level 1 — exact source identity (sourceId + externalId)
 *   Level 2 — conservative normalized hash (dedupe.js `generateDedupeHash`)
 *   Level 3 — this module: only when Level 2 leaves two rows in separate groups
 *             but they are almost certainly the same vacancy.
 *
 * Rules that must always hold:
 *   - Candidates are narrowed FIRST by exact normalizedCompany (indexed) — the
 *     comparison is never O(N²) across the catalogue.
 *   - Only a HIGH-confidence match auto-merges. MEDIUM/LOW never auto-merge.
 *   - Merge guards can veto a merge no matter how high the text similarity is.
 *   - Two postings from the SAME source with different source ids never merge.
 *   - An admin split (MergeBlock) permanently suppresses the pair.
 *   - Deterministic: same inputs → same result, no ordering dependence.
 */
import { htmlToText, extractDomain } from "./normalize.js";
import { seniorityBucket } from "./dedupe.js";
import { MergeBlock, orderedPair } from "../../models_new/MergeBlock.js";

const CANDIDATE_LIMIT = 50;

const TITLE_STOPWORDS = new Set([
  "the", "a", "an", "of", "and", "for", "to", "in", "at", "with", "on", "or",
  "role", "position", "job", "opening", "vacancy",
]);

/**
 * Token set of a normalized title, minus stopwords. If dropping stopwords would
 * leave fewer than two tokens (e.g. "Recruiter Job A"), keep the full token set
 * instead so a stopword-dominated title cannot collapse to a trivial match.
 */
export function titleTokenSet(normalizedTitle) {
  const all = String(normalizedTitle || "")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const meaningful = all.filter((t) => !TITLE_STOPWORDS.has(t));
  return new Set(meaningful.length >= 2 ? meaningful : all);
}

export function jaccard(a, b) {
  if (!a || !b || !a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

/** k-word shingle set of a (possibly HTML) description, bounded for cost. */
export function shingleSet(text, k = 4, cap = 4000) {
  const words = htmlToText(text || "", cap)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const set = new Set();
  for (let i = 0; i + k <= words.length; i += 1) set.add(words.slice(i, i + k).join(" "));
  return set;
}

// Role family — a "Backend Engineer" and a "Frontend Engineer" at the same
// company with similar boilerplate must never merge.
const FAMILY_RULES = [
  [/\b(front[\s-]?end|frontend)\b/, "frontend"],
  [/\b(back[\s-]?end|backend)\b/, "backend"],
  [/\b(full[\s-]?stack)\b/, "fullstack"],
  [/\b(android|ios|mobile)\b/, "mobile"],
  [/\b(data scientist|machine learning|ml engineer|data engineer|analytics)\b/, "data"],
  [/\b(devops|sre|site reliability|platform|infrastructure)\b/, "devops"],
  [/\b(qa|quality assurance|sdet|test engineer)\b/, "qa"],
  [/\b(designer|ux|ui\/ux|product design)\b/, "design"],
  [/\b(product manager|program manager|project manager)\b/, "pm"],
  [/\b(sales|account executive|business development)\b/, "sales"],
  [/\b(marketing|growth|content)\b/, "marketing"],
];

export function roleFamily(title) {
  const t = String(title || "").toLowerCase();
  for (const [re, fam] of FAMILY_RULES) if (re.test(t)) return fam;
  return "";
}

const REMOTE_KNOWN = new Set(["remote", "hybrid", "onsite"]);

function locationTokens(normalizedLocation) {
  return new Set(
    String(normalizedLocation || "")
      .split(/[\s,/-]+/)
      .map((t) => t.trim())
      .filter(Boolean)
  );
}

/**
 * Hard reasons two jobs must NOT be merged. Empty array ⇒ no structural veto.
 * @returns {string[]}
 */
export function mergeGuard(a = {}, b = {}) {
  const blocks = [];

  // never merge two postings from the same source with different ids
  if (
    a.sourceId && b.sourceId &&
    String(a.sourceId) === String(b.sourceId) &&
    String(a.externalId || "") !== String(b.externalId || "")
  ) {
    blocks.push("same source, different postings");
  }

  const sa = seniorityBucket(a.title || a.normalizedTitle);
  const sb = seniorityBucket(b.title || b.normalizedTitle);
  if (sa && sb && sa !== sb) blocks.push(`seniority ${sa} vs ${sb}`);

  const fa = roleFamily(a.title || a.normalizedTitle);
  const fb = roleFamily(b.title || b.normalizedTitle);
  if (fa && fb && fa !== fb) blocks.push(`role ${fa} vs ${fb}`);

  const ra = a.remoteType || "unknown";
  const rb = b.remoteType || "unknown";
  if (REMOTE_KNOWN.has(ra) && REMOTE_KNOWN.has(rb) && ra !== rb) {
    blocks.push(`workplace ${ra} vs ${rb}`);
  }

  const ea = String(a.jobType || "").toLowerCase();
  const eb = String(b.jobType || "").toLowerCase();
  if (ea && eb && ea !== eb) blocks.push(`employment ${ea} vs ${eb}`);

  // city mismatch: both have a concrete (non-remote) location and share no token
  const la = a.normalizedLocation && a.normalizedLocation !== "remote" ? locationTokens(a.normalizedLocation) : null;
  const lb = b.normalizedLocation && b.normalizedLocation !== "remote" ? locationTokens(b.normalizedLocation) : null;
  if (la && lb && la.size && lb.size) {
    let shared = 0;
    for (const t of la) if (lb.has(t)) shared += 1;
    if (shared === 0) blocks.push("different location");
  }

  return blocks;
}

/** Apply-URL / canonical-URL host of a job, "" when none. */
function applyHost(job = {}) {
  return (
    extractDomain(job.canonicalUrl) ||
    extractDomain(job.applyUrl) ||
    extractDomain(job.originalUrl) ||
    ""
  );
}

/**
 * Score how similar two jobs are and classify the confidence.
 * @returns {{ confidence: "high"|"medium"|"low"|"blocked", score: number, signals: object }}
 */
export function scoreSimilarity(a = {}, b = {}) {
  const blocks = mergeGuard(a, b);
  const titleSim = jaccard(titleTokenSet(a.normalizedTitle), titleTokenSet(b.normalizedTitle));
  const descSim = jaccard(shingleSet(a.description), shingleSet(b.description));

  const hostA = applyHost(a);
  const hostB = applyHost(b);
  const sameCanonical =
    !!a.canonicalUrl && !!b.canonicalUrl && a.canonicalUrl === b.canonicalUrl;
  const sameApplyHost = !!hostA && hostA === hostB;
  const conflictingUrls = !!hostA && !!hostB && hostA !== hostB;

  const signals = { titleSim, descSim, sameCanonical, sameApplyHost, conflictingUrls, blocks };

  if (blocks.length) return { confidence: "blocked", score: 0, signals };

  let score =
    0.55 * titleSim +
    0.35 * descSim +
    (sameApplyHost ? 0.1 : 0);
  if (sameCanonical) score = 1;
  // conflicting apply hosts are a warning, not a veto — they lower confidence
  if (conflictingUrls && !sameCanonical) score -= 0.1;

  // Conflicting apply hosts are a warning (they cost 0.1 of score above) but not
  // a veto: the same vacancy is routinely syndicated to two ATS/job-board hosts
  // with the identical description the employer wrote once. A HIGH match still
  // needs a very strong title AND description agreement.
  let confidence = "low";
  const highByText = titleSim >= 0.8 && descSim >= 0.55;
  if (sameCanonical || highByText) confidence = "high";
  else if (titleSim >= 0.6 && descSim >= 0.3) confidence = "medium";

  return { confidence, score: Math.max(0, Math.min(1, score)), signals };
}

/** @returns {boolean} true when this pair was explicitly split by an admin. */
export async function isPairBlocked(keyA, keyB) {
  const [x, y] = orderedPair(keyA, keyB);
  if (!x || !y || x === y) return false;
  const hit = await MergeBlock.exists({ keyA: x, keyB: y });
  return !!hit;
}

/**
 * Find an existing group this job should join via similarity assist.
 * Returns the target group key, or "" when the job stays on its own hash.
 *
 * @param {object} job     a saved Job document (or lean row) with normalized
 *                          fields, description, sourceId/externalId, URLs.
 * @param {object} [deps]  { JobModel } — injectable for tests.
 */
export async function findAutoMergeKey(job, { JobModel } = {}) {
  const Job = JobModel || (await import("../../models/job.model.js")).Job;

  const ownHash = job.dedupeHash;
  const ownKey = job.groupKey || ownHash;
  if (!ownHash || !job.normalizedCompany) return "";

  const candidates = await Job.find({
    normalizedCompany: job.normalizedCompany,
    status: "active",
    isActive: { $ne: false },
    _id: { $ne: job._id },
    dedupeHash: { $ne: ownHash },
  })
    .select(
      "title normalizedTitle normalizedLocation remoteType jobType sourceId externalId " +
        "dedupeHash groupKey canonicalUrl applyUrl originalUrl description"
    )
    .limit(CANDIDATE_LIMIT)
    .lean();

  const matches = [];
  for (const cand of candidates) {
    const { confidence, score } = scoreSimilarity(job, cand);
    if (confidence !== "high") continue;
    const candKey = cand.groupKey || cand.dedupeHash;
    if (!candKey || candKey === ownKey) continue;
    if (await isPairBlocked(ownKey, candKey)) continue;
    matches.push({ key: candKey, score, tieBreak: cand.dedupeHash });
  }

  if (!matches.length) return "";
  // deterministic: best score, then lowest dedupeHash, then lowest key
  matches.sort(
    (m, n) =>
      n.score - m.score ||
      (m.tieBreak < n.tieBreak ? -1 : m.tieBreak > n.tieBreak ? 1 : 0) ||
      (m.key < n.key ? -1 : m.key > n.key ? 1 : 0)
  );
  return matches[0].key;
}
