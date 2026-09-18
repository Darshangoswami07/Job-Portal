/**
 * Shared helpers for the third-party aggregator adapters (Adzuna / JSearch /
 * Jooble). Ported from the legacy `backend/services/jobAggregator.js` so those
 * providers now flow through the standard adapter → ingest pipeline.
 */

export const SEARCH_KEYWORDS = [
  "software engineer",
  "frontend developer",
  "backend developer",
  "full stack developer",
  "data scientist",
  "product manager",
  "devops engineer",
  "designer",
];

export function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Best-effort structured salary from a free-text or numeric-range string.
 * Returns `{ salaryMin, salaryMax, salaryCurrency }` — values are `undefined`
 * when nothing usable was found (never fabricated 0).
 */
export function extractSalary(input, currency) {
  if (input === undefined || input === null || input === "") {
    return { salaryMin: undefined, salaryMax: undefined, salaryCurrency: currency || undefined };
  }
  const str = String(input);
  const nums = str
    .replace(/[^0-9.\-–—]/g, " ")
    .match(/\d+(?:\.\d+)?/g);
  if (!nums) {
    return { salaryMin: undefined, salaryMax: undefined, salaryCurrency: currency || undefined };
  }
  const parsed = nums.map(Number).filter((n) => n > 0).sort((a, b) => a - b);
  if (!parsed.length) {
    return { salaryMin: undefined, salaryMax: undefined, salaryCurrency: currency || undefined };
  }
  return {
    salaryMin: Math.round(parsed[0]),
    salaryMax: Math.round(parsed[parsed.length - 1]),
    salaryCurrency: currency || undefined,
  };
}

/** Resolve one or more env-var NAMES to their values; never logs the value. */
export function resolveEnvRefs(refNames, env = process.env) {
  const out = {};
  for (const [key, name] of Object.entries(refNames)) {
    out[key] = name ? env[name] || "" : "";
  }
  return out;
}
