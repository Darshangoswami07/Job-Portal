/**
 * USAJOBS adapter — the official U.S. federal government jobs API
 * (https://developer.usajobs.gov/api-reference/get-api-search).
 *
 *   GET https://data.usajobs.gov/api/search?Keyword=<kw>&ResultsPerPage=<n>&Page=<p>
 *   Headers: Host, User-Agent: <registered email>, Authorization-Key: <API key>
 *
 * Credentials (env-var NAMES only — never values, never committed):
 *   config.apiKeyRef      default "USAJOBS_API_KEY"      (the Authorization-Key)
 *   config.userAgentRef   default "USAJOBS_USER_AGENT"   (the registered email)
 * Both are required — the API rejects requests without them.
 *
 * `PositionURI` is the canonical USAJOBS posting URL — preserved as originalUrl
 * + applyUrl. `applyType` = external. Results are page-based.
 */
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeGet, throttleHost, SourceHttpError } from "./httpClient.js";
import { SEARCH_KEYWORDS, stripHtml, resolveEnvRefs } from "./aggregatorShared.js";
import { isHttpUrl } from "../jobs/normalize.js";

export const USAJOBS_ADAPTER = "usajobs";
const HOST = "data.usajobs.gov";
const MAX_PAGES = 3;
const MAX_RPP = 100;

const SCHEDULE_MAP = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  intermittent: "Contract",
  "job sharing": "Part-time",
  "multiple schedules": "",
};

function firstRemuneration(list) {
  if (!Array.isArray(list) || !list.length) return {};
  const r = list[0] || {};
  const min = Number(r.MinimumRange);
  const max = Number(r.MaximumRange);
  const perYear = /year|annum|pa/i.test(r.RateIntervalCode || r.Description || "");
  return {
    salaryMin: Number.isFinite(min) && min > 0 && perYear ? Math.round(min) : undefined,
    salaryMax: Number.isFinite(max) && max > 0 && perYear ? Math.round(max) : undefined,
    salaryCurrency: "USD",
  };
}

export function mapUsaJob(item) {
  const d = item && item.MatchedObjectDescriptor;
  if (!d) return null;
  const id = item.MatchedObjectId || d.PositionID;
  if (!id) return null;
  const title = typeof d.PositionTitle === "string" ? d.PositionTitle.trim() : "";
  if (!title) return null;

  const locations = Array.isArray(d.PositionLocation)
    ? d.PositionLocation.map((l) => (l && typeof l.LocationName === "string" ? l.LocationName.trim() : "")).filter(Boolean)
    : [];
  const url = isHttpUrl(d.PositionURI) ? d.PositionURI.trim() : "";
  const summary =
    (d.UserArea && d.UserArea.Details && typeof d.UserArea.Details.JobSummary === "string"
      ? d.UserArea.Details.JobSummary
      : d.QualificationSummary) || "";
  const scheduleName =
    Array.isArray(d.PositionSchedule) && d.PositionSchedule[0] && typeof d.PositionSchedule[0].Name === "string"
      ? d.PositionSchedule[0].Name.toLowerCase().trim()
      : "";
  const { salaryMin, salaryMax, salaryCurrency } = firstRemuneration(d.PositionRemuneration);

  return {
    externalId: `usajobs-${id}`,
    title,
    description: stripHtml(summary).slice(0, 8000),
    companyName: d.OrganizationName || d.DepartmentName || "",
    location: [...new Set(locations)].join("; "),
    country: "US",
    jobType: SCHEDULE_MAP[scheduleName] || "",
    department: d.DepartmentName || "",
    salaryMin,
    salaryMax,
    salaryCurrency,
    originalUrl: url,
    applyUrl: url,
    postedAt: d.PublicationStartDate || d.PositionStartDate || undefined,
    sourceUpdatedAt: d.PositionStartDate || undefined,
    expiresAt: d.ApplicationCloseDate || d.PositionEndDate || undefined,
  };
}

export class UsaJobsAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: USAJOBS_ADAPTER, type: "feed" });
  }

  async fetch(source) {
    const cfg = source.config || {};
    const { apiKey, userAgent } = resolveEnvRefs({
      apiKey: cfg.apiKeyRef || "USAJOBS_API_KEY",
      userAgent: cfg.userAgentRef || "USAJOBS_USER_AGENT",
    });
    if (!apiKey || !userAgent) {
      throw new SourceHttpError(
        "usajobs: credentials not configured (USAJOBS_API_KEY / USAJOBS_USER_AGENT)",
        "config"
      );
    }

    const queries = Array.isArray(cfg.queries) && cfg.queries.length ? cfg.queries : SEARCH_KEYWORDS.slice(0, 4);
    const rpp = Math.min(Number(cfg.resultsPerPage) || 50, MAX_RPP);
    const pages = Math.min(Math.max(Number(cfg.pages) || 1, 1), MAX_PAGES);
    const location = cfg.locationName ? `&LocationName=${encodeURIComponent(cfg.locationName)}` : "";

    const raw = [];
    const seen = new Set();
    for (const keyword of queries) {
      for (let page = 1; page <= pages; page += 1) {
        await throttleHost(HOST, source.rateLimitPerMin);
        const url =
          `https://${HOST}/api/search?Keyword=${encodeURIComponent(keyword)}` +
          `&ResultsPerPage=${rpp}&Page=${page}${location}`;

        let payload;
        try {
          const res = await safeGet(url, {
            timeoutMs: cfg.timeoutMs || 15000,
            allowedHosts: [HOST],
            userAgent,
            headers: { Host: HOST, "User-Agent": userAgent, "Authorization-Key": apiKey },
          });
          payload = JSON.parse(res.body);
        } catch (err) {
          throw err instanceof SourceHttpError ? err : new SourceHttpError(err.message, "network");
        }

        const items = payload && payload.SearchResult && Array.isArray(payload.SearchResult.SearchResultItems)
          ? payload.SearchResult.SearchResultItems
          : null;
        if (!items || !items.length) break;
        for (const item of items) {
          const mapped = mapUsaJob(item);
          if (mapped && !seen.has(mapped.externalId)) {
            seen.add(mapped.externalId);
            raw.push(mapped);
          }
        }
        if (items.length < rpp) break;
      }
    }
    return raw;
  }
}

export const usaJobsAdapter = new UsaJobsAdapter();
registerAdapter(usaJobsAdapter);
