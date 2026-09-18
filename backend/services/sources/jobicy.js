/**
 * Jobicy adapter — official public remote-jobs API (https://jobicy.com/jobs-rss-feed).
 *
 *   GET https://jobicy.com/api/v2/remote-jobs?count=<n>[&geo=<slug>][&industry=<slug>][&tag=<kw>]
 *
 * No authentication. Jobicy's fair-use policy explicitly permits integrations
 * without a separate agreement, on the conditions that we:
 *   - keep Jobicy as the original source (source badge "Jobicy"),
 *   - preserve the canonical Jobicy job URL (mapped to originalUrl + applyUrl),
 *   - cache / avoid excessive requests (bounded: one request per configured
 *     filter, count <= 200, 6-hourly schedule).
 * Every listing is remote.
 *
 * Response: { apiVersion, jobCount, jobs: [ { id, url, jobTitle, companyName,
 *   jobIndustry[], jobType[], jobGeo, jobLevel, jobExcerpt, jobDescription,
 *   pubDate, salaryMin, salaryMax, salaryCurrency, salaryPeriod } ], success }
 */
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeGet, throttleHost, SourceHttpError } from "./httpClient.js";
import { stripHtml } from "./aggregatorShared.js";
import { isHttpUrl } from "../jobs/normalize.js";

export const JOBICY_ADAPTER = "jobicy";
const HOST = "jobicy.com";
const MAX_COUNT = 200;                 // provider hard cap per request
const MAX_FILTERS = 8;
// Distinct slices for backfill — Jobicy returns the newest N per filter, so a
// few industry filters surface jobs beyond the single unfiltered top-200.
// Verified Jobicy industry slugs (a 400 = unknown slug; the fetch skips it).
const BACKFILL_FILTERS = [
  {},
  { industry: "engineering" },
  { industry: "business" },
  { industry: "marketing" },
  { industry: "data-science" },
  { industry: "hr" },
  { industry: "management" },
  { industry: "copywriting" },
];

const TYPE_MAP = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Contract",
  freelance: "Freelance",
};

export function mapJobicyJob(job) {
  if (!job || job.id === undefined || job.id === null) return null;
  const title = typeof job.jobTitle === "string" ? job.jobTitle.trim() : "";
  if (!title) return null;

  const url = isHttpUrl(job.url) ? job.url.trim() : "";
  const typeName =
    Array.isArray(job.jobType) && typeof job.jobType[0] === "string"
      ? job.jobType[0].toLowerCase().trim()
      : "";
  const industry =
    Array.isArray(job.jobIndustry) && typeof job.jobIndustry[0] === "string" ? job.jobIndustry[0] : "";
  const annual = String(job.salaryPeriod || "").toLowerCase() === "yearly" || String(job.salaryPeriod || "").toLowerCase() === "annually";
  const sMin = Number(job.salaryMin);
  const sMax = Number(job.salaryMax);

  return {
    externalId: `jobicy-${job.id}`,
    title,
    description: stripHtml(job.jobDescription || job.jobExcerpt).slice(0, 8000),
    companyName: typeof job.companyName === "string" ? job.companyName : "",
    location: typeof job.jobGeo === "string" ? job.jobGeo : "",
    workType: "Remote", // Jobicy is a remote-only board
    jobType: TYPE_MAP[typeName] || "",
    department: industry,
    salaryMin: annual && Number.isFinite(sMin) && sMin > 0 ? Math.round(sMin) : undefined,
    salaryMax: annual && Number.isFinite(sMax) && sMax > 0 ? Math.round(sMax) : undefined,
    salaryCurrency: annual && (sMin > 0 || sMax > 0) ? job.salaryCurrency || undefined : undefined,
    originalUrl: url,
    applyUrl: url,
    postedAt: job.pubDate || undefined,
    tags: industry ? [industry] : undefined,
  };
}

export class JobicyAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: JOBICY_ADAPTER, type: "aggregator", coverage: "partial" });
  }

  async fetch(source, { mode = "incremental" } = {}) {
    const cfg = source.config || {};
    const count = Math.min(Math.max(Number(cfg.count) || 200, 1), MAX_COUNT);
    // Optional narrowing filters — each is one bounded request.
    const filters = (
      Array.isArray(cfg.filters) && cfg.filters.length
        ? cfg.filters
        : mode === "backfill"
          ? BACKFILL_FILTERS
          : [{}]
    ).slice(0, MAX_FILTERS);

    const raw = [];
    const seen = new Set();
    const metrics = { queriesRequested: filters.length, pagesRequested: 0, providerResults: 0, deduped: 0 };
    for (const f of filters) {
      await throttleHost(HOST, source.rateLimitPerMin);
      let url = `https://${HOST}/api/v2/remote-jobs?count=${count}`;
      if (f && typeof f === "object") {
        if (f.geo) url += `&geo=${encodeURIComponent(f.geo)}`;
        if (f.industry) url += `&industry=${encodeURIComponent(f.industry)}`;
        if (f.tag) url += `&tag=${encodeURIComponent(f.tag)}`;
      }

      let payload;
      try {
        const res = await safeGet(url, {
          timeoutMs: cfg.timeoutMs || 15000,
          allowedHosts: [HOST],
          userAgent: "JobPilot-JobSync/1.0 (+jobicy)",
        });
        payload = JSON.parse(res.body);
      } catch (err) {
        // an unknown filter slug → HTTP 400: skip that slice, keep the rest.
        if (err instanceof SourceHttpError && err.kind === "http" && /400/.test(err.message) && raw.length) continue;
        if (err instanceof SourceHttpError && err.kind === "http" && /429/.test(err.message)) {
          metrics.rateLimited += 1;
          if (raw.length) break;
        }
        throw err instanceof SourceHttpError ? err : new SourceHttpError(err.message, "network");
      }

      if (!payload || !Array.isArray(payload.jobs) || !payload.jobs.length) continue;
      metrics.pagesRequested += 1;
      metrics.providerResults += payload.jobs.length;
      for (const job of payload.jobs) {
        const mapped = mapJobicyJob(job);
        if (!mapped) continue;
        if (seen.has(mapped.externalId)) { metrics.deduped += 1; continue; }
        seen.add(mapped.externalId);
        raw.push(mapped);
      }
    }
    return { jobs: raw, metrics };
  }
}

export const jobicyAdapter = new JobicyAdapter();
registerAdapter(jobicyAdapter);
