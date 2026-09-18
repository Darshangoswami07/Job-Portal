/**
 * Reusable, bounded query orchestration for keyword-search job providers
 * (Adzuna, Jooble, JSearch, …). One place for the query families so adapters
 * don't each carry a sprawling hardcoded array.
 *
 * Nothing here talks to a provider — it only decides WHICH bounded set of
 * (keyword × country × page) requests a sync should make.
 */

export const QUERY_FAMILIES = {
  software: [
    "software engineer",
    "frontend developer",
    "backend developer",
    "full stack developer",
    "mobile developer",
    "qa engineer",
    "devops engineer",
    "cloud engineer",
    "data engineer",
    "data scientist",
    "machine learning engineer",
    "ai engineer",
    "cybersecurity engineer",
    "systems engineer",
  ],
  business: [
    "product manager",
    "project manager",
    "business analyst",
    "sales",
    "marketing",
    "finance",
    "operations",
    "human resources",
    "customer success",
    "account manager",
  ],
  design: ["ui designer", "ux designer", "product designer", "graphic designer"],
  general: ["engineering", "technology", "data", "management", "remote"],
};

const ALL_KEYWORDS = [
  ...QUERY_FAMILIES.software,
  ...QUERY_FAMILIES.business,
  ...QUERY_FAMILIES.design,
  ...QUERY_FAMILIES.general,
];

// Conservative per-mode limits. `incremental` = frequent + small (recent jobs);
// `backfill` = larger, operator-initiated, still bounded well under provider
// daily quotas (Adzuna free ≈ 250 calls/day).
export const MODE_LIMITS = {
  incremental: { maxKeywords: 8, maxPagesPerQuery: 2, maxRequests: 40 },
  backfill: { maxKeywords: 18, maxPagesPerQuery: 3, maxRequests: 120 },
};

/** clamp a positive number into [lo, hi]; an unset/invalid value defaults to `hi` (use the max the mode allows). */
const clamp = (n, lo, hi) => {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? Math.max(lo, Math.min(hi, Math.floor(v))) : hi;
};

/**
 * Build the bounded request plan for a keyword-search provider.
 *
 * @param {{
 *   mode?: "incremental"|"backfill",
 *   keywords?: string[],          // explicit override
 *   families?: string[],          // e.g. ["software","business"]
 *   countries?: string[],         // provider markets ("in","us",…) — [""] for single-market
 *   maxKeywords?: number, maxPagesPerQuery?: number, maxRequests?: number,
 *   resultsPerPage?: number,
 * }} cfg
 * @returns {{ keywords:string[], countries:string[], pagesPerQuery:number,
 *   resultsPerPage:number, maxRequests:number, requests:Array<{keyword,country,page}> }}
 */
export function planKeywordQueries(cfg = {}) {
  const mode = cfg.mode === "backfill" ? "backfill" : "incremental";
  const lim = MODE_LIMITS[mode];

  let keywords;
  if (Array.isArray(cfg.keywords) && cfg.keywords.length) {
    keywords = cfg.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean);
  } else if (Array.isArray(cfg.families) && cfg.families.length) {
    keywords = cfg.families.flatMap((f) => QUERY_FAMILIES[f] || []);
  } else {
    keywords = ALL_KEYWORDS;
  }
  // de-dupe, then cap
  keywords = [...new Set(keywords)].slice(0, clamp(cfg.maxKeywords, 1, lim.maxKeywords));

  const countries =
    Array.isArray(cfg.countries) && cfg.countries.length
      ? [...new Set(cfg.countries.map((c) => String(c).trim().toLowerCase()).filter((c) => c.length))]
      : [""];

  const pagesPerQuery = clamp(cfg.maxPagesPerQuery, 1, lim.maxPagesPerQuery);
  const resultsPerPage = clamp(cfg.resultsPerPage, 1, 50);
  const maxRequests = clamp(cfg.maxRequests, 1, lim.maxRequests);

  const requests = [];
  outer: for (const country of countries) {
    for (const keyword of keywords) {
      for (let page = 1; page <= pagesPerQuery; page += 1) {
        if (requests.length >= maxRequests) break outer;
        requests.push({ keyword, country, page });
      }
    }
  }

  return { keywords, countries, pagesPerQuery, resultsPerPage, maxRequests, requests };
}
