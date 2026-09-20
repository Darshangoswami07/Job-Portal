/**
 * The Muse adapter — official public Jobs API (https://www.themuse.com/developers/api/v2).
 *
 *   GET https://www.themuse.com/api/public/jobs?page=<n>&api_key=<KEY?>
 *       [&category=<c>][&location=<l>][&level=<lvl>]
 *
 * The API key is OPTIONAL (anonymous: 500 req/h; registered: 3600 req/h). When
 * `config.apiKeyRef` names a set env var it is sent as the `api_key` query
 * param; otherwise the adapter still works anonymously.
 *
 * `refs.landing_page` is The Muse's canonical posting URL — preserved as
 * originalUrl + applyUrl. `applyType` = external. Response is page-based:
 * `{ page, page_count, results: [...] }`.
 */
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeGet, throttleHost, SourceHttpError } from "./httpClient.js";
import { stripHtml, resolveEnvRefs } from "./aggregatorShared.js";
import { isHttpUrl } from "../jobs/normalize.js";

export const THEMUSE_ADAPTER = "themuse";
const HOST = "www.themuse.com";
const MAX_PAGES = 25;               // ~20 results/page → up to ~500 listings
const DEFAULT_PAGES = { incremental: 6, backfill: 20 };

const LEVEL_MAP = {
  "entry level": "entry",
  internship: "internship",
  "mid level": "mid",
  "senior level": "senior",
  management: "senior",
};

const TYPE_MAP = {
  "full time": "Full-time",
  "part time": "Part-time",
  internship: "Internship",
  contract: "Contract",
  freelance: "Freelance",
  temporary: "Contract",
};

export function mapTheMuseJob(job) {
  if (!job || job.id === undefined || job.id === null) return null;
  const title = typeof job.name === "string" ? job.name.trim() : "";
  if (!title) return null;

  const locations = Array.isArray(job.locations)
    ? job.locations.map((l) => (l && typeof l.name === "string" ? l.name.trim() : "")).filter(Boolean)
    : [];
  const isRemote = locations.some((l) => /\bremote\b|\bflexible\b/i.test(l));
  const levels = Array.isArray(job.levels)
    ? job.levels.map((l) => (l && typeof l.name === "string" ? l.name.toLowerCase() : "")).filter(Boolean)
    : [];
  const category =
    Array.isArray(job.categories) && job.categories[0] && typeof job.categories[0].name === "string"
      ? job.categories[0].name
      : "";
  const url = isHttpUrl(job.refs?.landing_page) ? job.refs.landing_page.trim() : "";
  const typeName = typeof job.type === "string" ? job.type.toLowerCase().trim() : "";

  return {
    externalId: `themuse-${job.id}`,
    title,
    description: stripHtml(job.contents).slice(0, 8000),
    companyName: job.company && typeof job.company.name === "string" ? job.company.name : "",
    location: locations.join("; "),
    workType: isRemote ? "Remote" : "",
    jobType: TYPE_MAP[typeName] || "",
    department: category,
    seniorityHint: levels.map((l) => LEVEL_MAP[l]).find(Boolean) || undefined,
    originalUrl: url,
    applyUrl: url,
    postedAt: job.publication_date || undefined,
    tags: category ? [category] : undefined,
  };
}

export class TheMuseAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: THEMUSE_ADAPTER, type: "aggregator", coverage: "partial" });
  }

  async fetch(source, { mode = "incremental" } = {}) {
    const cfg = source.config || {};
    // Optional — anonymous access is permitted by the API.
    const { apiKey } = resolveEnvRefs({ apiKey: cfg.apiKeyRef || "THE_MUSE_API_KEY" });

    const wanted = Number(cfg.pages) || (mode === "backfill" ? cfg.backfillPages : cfg.incrementalPages) || DEFAULT_PAGES[mode] || DEFAULT_PAGES.incremental;
    const pages = Math.min(Math.max(wanted, 1), MAX_PAGES);
    const categories = Array.isArray(cfg.categories) ? cfg.categories.filter(Boolean) : [];
    const locations = Array.isArray(cfg.locations) ? cfg.locations.filter(Boolean) : [];

    const raw = [];
    const seen = new Set();
    const metrics = { pagesRequested: 0, providerResults: 0 };
    for (let page = 1; page <= pages; page += 1) {
      await throttleHost(HOST, source.rateLimitPerMin);
      let url = `https://${HOST}/api/public/jobs?page=${page}`;
      for (const c of categories) url += `&category=${encodeURIComponent(c)}`;
      for (const l of locations) url += `&location=${encodeURIComponent(l)}`;
      if (apiKey) url += `&api_key=${encodeURIComponent(apiKey)}`;

      let payload;
      try {
        const res = await safeGet(url, {
          timeoutMs: cfg.timeoutMs || 15000,
          allowedHosts: [HOST],
          userAgent: "JobPilot-JobSync/1.0 (+themuse)",
        });
        payload = JSON.parse(res.body);
      } catch (err) {
        throw err instanceof SourceHttpError ? err : new SourceHttpError(err.message, "network");
      }

      if (!payload || !Array.isArray(payload.results) || !payload.results.length) break;
      metrics.pagesRequested += 1;
      metrics.providerResults += payload.results.length;
      for (const job of payload.results) {
        const mapped = mapTheMuseJob(job);
        if (mapped && !seen.has(mapped.externalId)) {
          seen.add(mapped.externalId);
          raw.push(mapped);
        }
      }
      if (payload.page_count && page >= payload.page_count) break;
    }
    return { jobs: raw, metrics };
  }
}

export const theMuseAdapter = new TheMuseAdapter();
registerAdapter(theMuseAdapter);
