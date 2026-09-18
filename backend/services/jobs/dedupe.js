import crypto from "crypto";

import {
  normalizeTitle,
  normalizeCompany,
  normalizeLocation,
} from "./normalize.js";

/**
 * Deterministic cross-source grouping key (PLAN.md §13).
 *
 * Same real vacancy from different sources → same hash → one JobGroup.
 * Deliberately conservative — it favours FALSE NEGATIVES over dangerous false
 * positives. The signature includes company, normalized title, location,
 * remote type, seniority bucket and employment type, so none of these merge
 * automatically:
 *   "Senior Software Engineer"  vs  "Software Engineer"
 *   "... Bengaluru"             vs  "... London"
 *   Remote                      vs  Onsite
 *   Full-time                   vs  Contract
 * Unknown values (empty string) still group with each other.
 */

const SENIORITY_RULES = [
  [/\b(intern|internship|trainee|apprentice)\b/, "intern"],
  [/\b(junior|jr|entry[ -]?level|associate|graduate|fresher)\b/, "junior"],
  [/\b(principal|staff|distinguished|fellow)\b/, "principal"],
  [/\b(lead|head|director|vp|chief|manager|architect)\b/, "lead"],
  [/\b(senior|sr|expert)\b/, "senior"],
];

/** Coarse seniority bucket from a (raw or normalized) title. "" when unclear. */
export function seniorityBucket(title) {
  const t = String(title || "").toLowerCase();
  for (const [re, bucket] of SENIORITY_RULES) if (re.test(t)) return bucket;
  return "";
}

export function generateDedupeHash({
  normalizedCompany: nc,
  normalizedTitle: nt,
  normalizedLocation: nl,
  remoteType = "unknown",
  seniority = "",
  employmentType = "",
} = {}) {
  const company = (nc || "").trim();
  const title = (nt || "").trim();
  const location = (nl || (remoteType === "remote" ? "remote" : "")).trim();

  // No stable identity without at least a company and a title.
  if (!company || !title) return "";

  const canonical = [
    company,
    title,
    location,
    remoteType,
    seniority,
    String(employmentType || "").toLowerCase().trim(),
  ].join("|");
  return crypto.createHash("sha1").update(canonical).digest("hex");
}

/**
 * Derive the normalized fields + dedupe signature + hash from a raw-ish job.
 * Pure. `job.jobType` (if present) is used as the employment-type discriminator.
 */
export function computeDedupeFields(job = {}) {
  const remoteType = job.remoteType || "unknown";
  const normalizedTitleValue = job.normalizedTitle || normalizeTitle(job.title);
  const normalizedCompanyValue =
    job.normalizedCompany || normalizeCompany(job.companyName || job.company?.name);
  const normalizedLocationValue =
    job.normalizedLocation || normalizeLocation(job.location, { remoteType });
  const seniority = seniorityBucket(job.title || normalizedTitleValue);
  const employmentType = job.jobType || "";

  const dedupeHash = generateDedupeHash({
    normalizedCompany: normalizedCompanyValue,
    normalizedTitle: normalizedTitleValue,
    normalizedLocation: normalizedLocationValue,
    remoteType,
    seniority,
    employmentType,
  });

  return {
    normalizedTitle: normalizedTitleValue,
    normalizedCompany: normalizedCompanyValue,
    normalizedLocation: normalizedLocationValue,
    remoteType,
    seniority,
    employmentType,
    dedupeHash,
  };
}

// Source-priority ordering for choosing a group's canonical ("best") job.
const SOURCE_TYPE_PRIORITY = {
  internal: 4,
  ats: 3,
  partner: 3,
  aggregator: 2,
  feed: 1,
};

export function sourceTypePriority(sourceType) {
  return SOURCE_TYPE_PRIORITY[sourceType] ?? 0;
}

/**
 * Given the candidate jobs of one group, pick the canonical one:
 * highest source priority → most complete (salary + long description) →
 * most recently posted.
 */
export function pickBestJob(jobs = []) {
  if (!jobs.length) return null;
  return [...jobs].sort((a, b) => {
    const p = sourceTypePriority(b.sourceType) - sourceTypePriority(a.sourceType);
    if (p) return p;

    const completeness = (j) =>
      (j.salaryMin || j.salaryMax || j.salary ? 1 : 0) +
      ((j.description || "").length > 400 ? 1 : 0);
    const c = completeness(b) - completeness(a);
    if (c) return c;

    const at = new Date(a.postedAt || a.createdAt || 0).getTime();
    const bt = new Date(b.postedAt || b.createdAt || 0).getTime();
    return bt - at;
  })[0];
}
