/**
 * JSearch adapter — JSearch job API on RapidAPI (https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch).
 *
 *   GET https://jsearch.p.rapidapi.com/search-v2?query=<keyword>&page=1&num_pages=1
 *   Headers: X-RapidAPI-Key, X-RapidAPI-Host
 *
 * Credential (env-var NAME only): config.apiKeyRef  default "RAPIDAPI_KEY".
 * Config: queries[], numPages (≤2), country suffix appended to the query.
 *
 * `job_apply_link` is preserved as originalUrl + applyUrl. `applyType` = external.
 * NOTE: JSearch itself aggregates — cross-source dedupe still applies downstream.
 */
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeGet, throttleHost, SourceHttpError } from "./httpClient.js";
import { SEARCH_KEYWORDS, stripHtml, resolveEnvRefs } from "./aggregatorShared.js";
import { isHttpUrl } from "../jobs/normalize.js";

export const JSEARCH_ADAPTER = "jsearch";
const HOST = "jsearch.p.rapidapi.com";
const MAX_NUM_PAGES = 2;

const EMPLOYMENT_MAP = {
  FULLTIME: "Full-time",
  PARTTIME: "Part-time",
  CONTRACTOR: "Contract",
  INTERN: "Internship",
};

export function mapJSearchJob(job) {
  if (!job || !job.job_id) return null;
  const title = typeof job.job_title === "string" ? job.job_title.trim() : "";
  if (!title) return null;
  const url = isHttpUrl(job.job_apply_link) ? job.job_apply_link.trim() : "";
  const salaryMin = Number.isFinite(job.job_min_salary) ? job.job_min_salary : undefined;
  const salaryMax = Number.isFinite(job.job_max_salary) ? job.job_max_salary : undefined;
  return {
    externalId: `jsearch-${job.job_id}`,
    title,
    description: stripHtml(job.job_description).slice(0, 8000),
    companyName: typeof job.employer_name === "string" ? job.employer_name : "",
    companyDomain: typeof job.employer_website === "string" ? job.employer_website : "",
    location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", "),
    country: typeof job.job_country === "string" ? job.job_country : "",
    jobType: EMPLOYMENT_MAP[job.job_employment_type] || "",
    salaryMin,
    salaryMax,
    salaryCurrency: typeof job.job_salary_currency === "string" ? job.job_salary_currency : undefined,
    workType: job.job_is_remote === true ? "Remote" : "",
    originalUrl: url,
    applyUrl: url,
    postedAt: job.job_posted_at_datetime_utc || undefined,
  };
}

export class JSearchAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: JSEARCH_ADAPTER, type: "aggregator", coverage: "partial" });
  }

  async fetch(source) {
    const cfg = source.config || {};
    const { apiKey } = resolveEnvRefs({ apiKey: cfg.apiKeyRef || "RAPIDAPI_KEY" });
    if (!apiKey) {
      throw new SourceHttpError("jsearch: credential not configured (RAPIDAPI_KEY)", "config");
    }

    const queries = Array.isArray(cfg.queries) && cfg.queries.length ? cfg.queries : SEARCH_KEYWORDS.slice(0, 3);
    const numPages = Math.min(Number(cfg.numPages) || 1, MAX_NUM_PAGES);
    const suffix = cfg.country ? ` in ${cfg.country}` : "";

    const raw = [];
    for (const keyword of queries) {
      await throttleHost(HOST, source.rateLimitPerMin);
      const url = `https://${HOST}/search-v2?query=${encodeURIComponent(keyword + suffix)}&page=1&num_pages=${numPages}`;

      let payload;
      try {
        const res = await safeGet(url, {
          timeoutMs: cfg.timeoutMs || 15000,
          allowedHosts: [HOST],
          userAgent: "JobPilot-JobSync/1.0 (+jsearch)",
          headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": HOST },
        });
        payload = JSON.parse(res.body);
      } catch (err) {
        throw err instanceof SourceHttpError ? err : new SourceHttpError(err.message, "network");
      }

      const jobs = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.jobs)
          ? payload.data.jobs
          : [];
      for (const job of jobs) {
        const mapped = mapJSearchJob(job);
        if (mapped) raw.push(mapped);
      }
    }
    return raw;
  }
}

export const jsearchAdapter = new JSearchAdapter();
registerAdapter(jsearchAdapter);
