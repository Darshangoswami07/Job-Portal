/**
 * Deterministic job-matching baseline (PLAN.md Phase 8 §5–13).
 *
 * `matchUserToJob(profileVector, jobGroup)` scores how well one JobGroup fits a
 * user, using ONLY real profile fields + real job fields. No LLM, no embeddings.
 * Pure and inspectable: same inputs → same output. The optional AI layer
 * (aiMatcher.js) refines these scores; it never replaces this baseline, which
 * must stand on its own (a mandatory acceptance criterion).
 */
import { seniorityBucket } from "./dedupe.js";
import { roleFamily, titleTokenSet, jaccard } from "./similarity.js";
import { normalizeLocation, collapseWhitespace } from "./normalize.js";
import { cleanSkillList } from "./userProfile.js";

export const MATCHING_VERSION = "m1";

// Signal weights. Skills + role/title + experience dominate; the "fit" filters
// (location/remote/type/industry) are lower-weighted but carry hard penalties.
export const WEIGHTS = {
  skills: 0.34,
  roleFamily: 0.16,
  title: 0.12,
  experience: 0.14,
  seniority: 0.08,
  location: 0.06,
  remoteType: 0.06,
  jobType: 0.02,
  industry: 0.02,
};

// Controlled skill synonyms ONLY. Never map across distinct technologies
// (React≠Angular, Node≠Java). Keys and values are lower-case.
const SKILL_SYNONYMS = new Map(Object.entries({
  js: "javascript",
  "js/ts": "javascript",
  ecmascript: "javascript",
  ts: "typescript",
  node: "node.js",
  nodejs: "node.js",
  "node js": "node.js",
  "react.js": "react",
  reactjs: "react",
  "react native": "react-native",
  "next": "next.js",
  nextjs: "next.js",
  "vue.js": "vue",
  vuejs: "vue",
  py: "python",
  golang: "go",
  postgres: "postgresql",
  psql: "postgresql",
  mongo: "mongodb",
  k8s: "kubernetes",
  gcp: "google cloud",
  "amazon web services": "aws",
  "c sharp": "c#",
  "dot net": ".net",
  dotnet: ".net",
  ml: "machine learning",
  "ai/ml": "machine learning",
  nlp: "natural language processing",
  ci: "ci/cd",
  cd: "ci/cd",
  tf: "tensorflow",
}));

export function canonicalSkill(skill) {
  const s = collapseWhitespace(String(skill || "")).toLowerCase();
  return SKILL_SYNONYMS.get(s) || s;
}

/** Overlap of two skill lists after synonym folding. */
export function skillOverlap(userSkills, jobSkills) {
  const u = new Set(cleanSkillList(userSkills).map(canonicalSkill));
  const j = new Set(cleanSkillList(jobSkills).map(canonicalSkill));
  if (!j.size) return { score: null, matched: [], missing: [] }; // job listed no skills → unknown, not zero
  if (!u.size) return { score: 0, matched: [], missing: [...j] };
  const matched = [...j].filter((s) => u.has(s));
  const missing = [...j].filter((s) => !u.has(s));
  // recall against the job's requirements, lightly rewarded for breadth of user skills
  const recall = matched.length / j.size;
  return { score: Math.min(1, recall + (matched.length >= 3 ? 0.1 : 0)), matched, missing };
}

const SENIORITY_ORDER = ["intern", "junior", "", "senior", "lead", "principal"];
const sIdx = (b) => {
  const i = SENIORITY_ORDER.indexOf(b || "");
  return i === -1 ? 2 : i;
};

/** 1 = same band, tapering with distance; hard floor for intern↔principal. */
export function seniorityCompat(userSeniority, jobTitleOrSeniority) {
  const a = sIdx(userSeniority || "");
  const b = sIdx(seniorityBucket(jobTitleOrSeniority) || "");
  if (a === 2 || b === 2) return 0.75; // one side unknown → mildly neutral
  const d = Math.abs(a - b);
  if (d === 0) return 1;
  if (d === 1) return 0.7;
  if (d === 2) return 0.35;
  return 0.1;
}

/** Years vs the job's numeric experienceLevel (best-effort; unknown → neutral). */
export function experienceCompat(userYears, jobExperienceLevel) {
  const y = Number(userYears);
  const need = Number(jobExperienceLevel);
  if (!Number.isFinite(need) || need < 0) return 0.75;
  if (!Number.isFinite(y)) return 0.6;
  if (y >= need) return y - need > 8 ? 0.8 : 1; // very over-qualified → slight taper
  const gap = need - y;
  if (gap <= 1) return 0.8;
  if (gap <= 3) return 0.5;
  return 0.2;
}

export function roleFamilyMatch(userFamilies, jobTitle) {
  const jf = roleFamily(jobTitle);
  if (!jf) return { score: 0.6, jobFamily: "" }; // job family unclear → neutral
  if (!userFamilies?.length) return { score: 0.4, jobFamily: jf };
  return { score: userFamilies.includes(jf) ? 1 : 0.15, jobFamily: jf };
}

export function titleMatch(userRoles, jobTitle) {
  const jt = titleTokenSet(String(jobTitle || "").toLowerCase());
  if (!jt.size || !userRoles?.length) return 0.5;
  let best = 0;
  for (const r of userRoles) {
    best = Math.max(best, jaccard(titleTokenSet(String(r).toLowerCase()), jt));
  }
  return best;
}

/**
 * Location + remote compatibility. Strong penalty for a concrete on-site city
 * mismatch; strong positive for remote↔remote.
 */
export function locationCompat(profile, group) {
  const jobRemote = group.remoteType || "unknown";
  const wantsRemote = profile.remotePref === "remote";

  if (jobRemote === "remote") return { location: 1, remoteType: wantsRemote ? 1 : 0.85 };

  const remoteType = (() => {
    if (!profile.remotePref || jobRemote === "unknown") return 0.7;
    if (profile.remotePref === jobRemote) return 1;
    if (profile.remotePref === "hybrid" || jobRemote === "hybrid") return 0.6;
    return 0.2; // remote-wanted vs onsite, or onsite-wanted vs (already handled)
  })();

  // location text
  const jobLoc = group.normalizedLocation || normalizeLocation(group.location || "");
  if (!jobLoc || jobLoc === "remote") return { location: 0.7, remoteType };
  if (!profile.locations?.length) return { location: 0.55, remoteType };
  const jobTokens = new Set(jobLoc.split(/[\s,/-]+/).filter(Boolean));
  let shared = 0;
  for (const pl of profile.locations) {
    for (const t of pl.split(/[\s,/-]+/)) if (t && jobTokens.has(t)) shared += 1;
  }
  return { location: shared > 0 ? 1 : 0.15, remoteType };
}

function jobTypeCompat(pref, jobType) {
  if (!pref || !jobType) return 0.7;
  return pref === jobType ? 1 : 0.3;
}

function industryCompat(userIndustries, jobIndustry) {
  const j = collapseWhitespace(String(jobIndustry || "")).toLowerCase();
  if (!j || !userIndustries?.length) return 0.6;
  return userIndustries.some((u) => u && (u === j || j.includes(u) || u.includes(j))) ? 1 : 0.4;
}

const confidenceFor = (score) => (score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low");

/**
 * @param {object} profile   from buildUserProfileVector
 * @param {object} group     a JobGroup (lean object)
 * @returns {{score:number, confidence:string, signals:object, reasons:string[], gaps:string[], version:string}}
 */
export function matchUserToJob(profile, group) {
  const g = group || {};
  const sk = skillOverlap(profile.skills, g.skills);
  const rf = roleFamilyMatch(
    [...new Set([...(profile.roleFamilies || []), ...(profile.behaviour?.savedRoleFamilies || [])])],
    g.displayTitle || g.normalizedTitle
  );
  const tt = titleMatch(profile.roles, g.displayTitle || g.normalizedTitle);
  const loc = locationCompat(profile, g);

  const signals = {
    skills: sk.score === null ? 0.6 : sk.score,
    roleFamily: rf.score,
    title: tt,
    experience: experienceCompat(profile.years, g.experienceLevel),
    seniority: seniorityCompat(profile.seniority, g.displayTitle || g.normalizedTitle),
    location: loc.location,
    remoteType: loc.remoteType,
    jobType: jobTypeCompat(profile.jobTypePref, g.jobType),
    industry: industryCompat(profile.industries, g.industry),
  };

  let score = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) score += w * (signals[k] ?? 0.5);

  // ── hard guards (cap the score, never silently merge a bad fit) ────────────
  const guards = [];
  if (signals.roleFamily <= 0.15 && rf.jobFamily) {
    score = Math.min(score, 0.45);
    guards.push(`different role area (${rf.jobFamily})`);
  }
  if (signals.seniority <= 0.1) {
    score = Math.min(score, 0.4);
    guards.push("seniority mismatch");
  }
  if (signals.location <= 0.15) {
    score = Math.min(score, 0.5);
    guards.push("location mismatch");
  }
  if (signals.remoteType <= 0.2) {
    score = Math.min(score, 0.55);
    guards.push("workplace preference mismatch");
  }

  // ── behavioural nudges (aggregate, bounded) ───────────────────────────────
  const bh = profile.behaviour || {};
  if (rf.jobFamily && bh.appliedRoleFamilies?.includes(rf.jobFamily)) score += 0.03;
  if (sk.matched.length && bh.savedSkills?.some((s) => sk.matched.includes(canonicalSkill(s)))) score += 0.02;
  if (profile.rejectedGroupKeys?.has?.(g.dedupeHash)) score -= 0.15;

  score = Math.max(0, Math.min(1, score));

  // ── explanations (real signals only) ─────────────────────────────────────
  const reasons = [];
  const gaps = [];
  if (sk.matched.length) reasons.push(`Skill match: ${sk.matched.slice(0, 4).join(", ")}`);
  if (signals.experience >= 0.8) reasons.push("Experience level fits the role");
  if (rf.score === 1) reasons.push(`Matches your ${rf.jobFamily} focus`);
  else if (tt >= 0.5) reasons.push("Job title is close to your background");
  if (g.remoteType === "remote" && profile.remotePref === "remote") reasons.push("Remote — matches your preference");
  if (signals.location === 1) reasons.push("Location matches your preference");
  if (signals.jobType === 1 && profile.jobTypePref) reasons.push(`${g.jobType} — matches your preference`);

  if (sk.missing.length) gaps.push(`Not in your profile: ${sk.missing.slice(0, 4).join(", ")}`);
  for (const guard of guards) gaps.push(guard);

  return {
    score: Math.round(score * 100) / 100,
    confidence: confidenceFor(score),
    signals,
    reasons: reasons.slice(0, 5),
    gaps: gaps.slice(0, 4),
    version: MATCHING_VERSION,
  };
}

/** Short label for a card badge. */
export function matchLabel(score) {
  if (score >= 0.8) return "Strong match";
  if (score >= 0.6) return "Good match";
  if (score >= 0.4) return "Potential match";
  return "";
}
