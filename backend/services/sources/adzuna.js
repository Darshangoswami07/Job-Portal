/**
 * Adzuna adapter — official Adzuna Jobs API (https://developer.adzuna.com/).
 *
 *   GET https://api.adzuna.com/v1/api/jobs/{country}/search/{page}
 *       ?app_id=<APP_ID>&app_key=<APP_KEY>&results_per_page=N&what=<keyword>
 *
 * Credentials (env-var NAMES only — never values, never committed):
 *   config.appIdRef   default "ADZUNA_APP_ID"
 *   config.appKeyRef  default "ADZUNA_APP_KEY"
 * Config: country (default "in"), queries[], resultsPerPage (≤50), pages (≤3).
 *
 * `redirect_url` is Adzuna's tracked redirect to the employer's original
 * posting — preserved as originalUrl + applyUrl. `applyType` = external.
 */
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeGet, throttleHost, SourceHttpError } from "./httpClient.js";
import { stripHtml, extractSalary, resolveEnvRefs } from "./aggregatorShared.js";
import { planKeywordQueries } from "./queryProfiles.js";
import { isHttpUrl } from "../jobs/normalize.js";

export const ADZUNA_ADAPTER = "adzuna";
const HOST = "api.adzuna.com";
// Markets Adzuna's public API serves. `config.countries` (or ADZUNA_COUNTRIES)
// narrows this — nothing is assumed beyond what the account is allowed to query.
const SUPPORTED_COUNTRIES = ["gb", "us", "at", "au", "be", "br", "ca", "ch", "de", "es", "fr", "in", "it", "mx", "nl", "nz", "pl", "sg", "za"];

export function mapAdzunaJob(job, ctx = {}) {
  if (!job || job.id === undefined || job.id === null) return null;
  const title = typeof job.title === "string" ? stripHtml(job.title) : "";
  if (!title) return null;
  const { salaryMin, salaryMax, salaryCurrency } = extractSalary(
    job.salary_min || job.salary_max
      ? `${job.salary_min || ""} ${job.salary_max || ""}`
      : "",
    "" // Adzuna salary currency depends on the country feed; leave unset
  );
  const url = isHttpUrl(job.redirect_url) ? job.redirect_url.trim() : "";
  return {
    externalId: `adzuna-${job.id}`,
    title,
    description: stripHtml(job.description).slice(0, 8000),
    companyName: (job.company && job.company.display_name) || "",
    location:
      (job.location && job.location.display_name) ||
      (Array.isArray(job.location?.area) ? job.location.area.join(", ") : "") ||
      "",
    country: ctx.country ? ctx.country.toUpperCase() : "",
    jobType: job.contract_time === "part_time" ? "Part-time" : job.contract_type === "contract" ? "Contract" : "",
    department: typeof job.category?.label === "string" ? job.category.label : "",
    salaryMin,
    salaryMax,
    salaryCurrency,
    originalUrl: url,
    applyUrl: url,
    postedAt: job.created || undefined,
  };
}

function resolveCountries(cfg, env) {
  const raw =
    (Array.isArray(cfg.countries) && cfg.countries) ||
    (typeof cfg.countries === "string" && cfg.countries.split(",")) ||
    (env.ADZUNA_COUNTRIES && env.ADZUNA_COUNTRIES.split(",")) ||
    [cfg.country || "in"];
  const wanted = raw.map((c) => String(c).trim().toLowerCase()).filter(Boolean);
  const ok = wanted.filter((c) => SUPPORTED_COUNTRIES.includes(c));
  return ok.length ? [...new Set(ok)] : ["in"];
}

export class AdzunaAdapter extends BaseSourceAdapter {
  constructor() {
    // keyword-search over rotating query families → a single sync never sees
    // the whole inventory; the sync must NOT expire "unseen" jobs.
    super({ name: ADZUNA_ADAPTER, type: "aggregator", coverage: "partial" });
  }

  async fetch(source, { mode = "incremental" } = {}) {
    const cfg = source.config || {};
    const env = process.env;
    const { appId, appKey } = resolveEnvRefs({
      appId: cfg.appIdRef || "ADZUNA_APP_ID",
      appKey: cfg.appKeyRef || "ADZUNA_APP_KEY",
    });
    if (!appId || !appKey) {
      throw new SourceHttpError("adzuna: credentials not configured (ADZUNA_APP_ID / ADZUNA_APP_KEY)", "config");
    }

    const countries = resolveCountries(cfg, env);
    const plan = planKeywordQueries({
      mode,
      keywords: cfg.queries ?? cfg.keywords,
      families: cfg.families,
      countries,
      maxKeywords: cfg.maxQueries,
      maxPagesPerQuery: cfg.maxPagesPerQuery ?? cfg.pages,
      maxRequests: cfg.maxRequests,
      resultsPerPage: cfg.resultsPerPage ?? 50,
    });

    const metrics = {
      queriesRequested: plan.keywords.length * plan.countries.length,
      pagesRequested: 0,
      providerResults: 0,
      rateLimited: 0,
      countries: plan.countries,
    };
    const raw = [];
    const emptyKeyCountry = new Set(); // stop paging a keyword/country once it runs dry
    const timeoutMs = cfg.timeoutMs || 15000;
    // recurring syncs prioritise freshly-posted jobs; a backfill takes relevance.
    const sortBy = mode === "backfill" ? "relevance" : "date";
    const maxDays = mode === "backfill" ? "" : "&max_days_old=30";

    for (const { keyword, country, page } of plan.requests) {
      const kc = `${country}:${keyword}`;
      if (emptyKeyCountry.has(kc)) continue;
      await throttleHost(HOST, source.rateLimitPerMin);
      const url =
        `https://${HOST}/v1/api/jobs/${encodeURIComponent(country)}/search/${page}` +
        `?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}` +
        `&results_per_page=${plan.resultsPerPage}&what=${encodeURIComponent(keyword)}` +
        `&sort_by=${sortBy}${maxDays}&content-type=application/json`;

      let payload;
      try {
        const res = await safeGet(url, { timeoutMs, allowedHosts: [HOST], userAgent: "JobPilot-JobSync/1.0 (+adzuna)" });
        payload = JSON.parse(res.body);
        metrics.pagesRequested += 1;
      } catch (err) {
        if (err instanceof SourceHttpError && err.kind === "http" && /429/.test(err.message)) {
          metrics.rateLimited += 1;
          if (raw.length === 0) throw err; // rate-limited before any results → real failure
          break; // partway through → keep what we have, stop hammering the quota
        }
        // a single keyword/page failing must not abort the whole source
        throw err instanceof SourceHttpError ? err : new SourceHttpError(err.message, "network");
      }

      const results = Array.isArray(payload?.results) ? payload.results : [];
      if (!results.length) { emptyKeyCountry.add(kc); continue; }
      metrics.providerResults += results.length;
      for (const job of results) {
        const mapped = mapAdzunaJob(job, { country });
        if (mapped) raw.push(mapped);
      }
    }

    return { jobs: raw, metrics };
  }
}

export const adzunaAdapter = new AdzunaAdapter();
registerAdapter(adzunaAdapter);
