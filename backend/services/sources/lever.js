/**
 * Lever source adapter.
 *
 * MECHANISM (verified — Lever Postings API, public & documented):
 *   GET https://api.lever.co/v0/postings/{site}?mode=json
 *
 * Unauthenticated. It is the same API that renders a company's Lever-hosted job
 * board — intended for public consumption. No login, no CAPTCHA, no scraping.
 * Returns a JSON array of all live postings (not paginated). Docs:
 * https://github.com/lever/postings-api
 *
 * Config (JobSource.config — never secrets):
 *   site         (required)  the Lever account slug, e.g. "leverdemo"
 *   companyName  (optional)  display fallback
 *   baseUrl      (optional)  tests only
 *
 * `applyUrl` (direct apply link) and `hostedUrl` (the Lever posting page) are
 * both preserved. `applyType` = external. Salary is mapped ONLY when Lever
 * returns a structured `salaryRange` — never fabricated.
 */
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeGet, throttleHost, SourceHttpError } from "./httpClient.js";
import { cleanStr, pickUrl, toDate, mapEmploymentType, mapWorkType, salaryFromRange } from "./atsShared.js";

export const LEVER_ADAPTER = "lever";
const DEFAULT_BASE_URL = "https://api.lever.co";
const MAX_JOBS = 5000;
const SITE_RE = /^[a-z0-9][a-z0-9-]{0,60}$/i;

export function mapLeverPosting(job, ctx = {}) {
  if (!job || !job.id) return null;
  const title = cleanStr(job.text);
  if (!title) return null;

  const cats = job.categories || {};
  const location =
    cleanStr(cats.location) ||
    (Array.isArray(cats.allLocations) && cats.allLocations.length ? cleanStr(cats.allLocations[0]) : "");

  return {
    externalId: String(job.id),
    title,
    // Lever gives HTML in `description` (opening) + `descriptionBody`; combine.
    description: [cleanStr(job.description), cleanStr(job.descriptionBody)].filter(Boolean).join("\n") || cleanStr(job.descriptionPlain),
    companyName: ctx.companyName || "",
    companyDomain: "",
    location,
    country: cleanStr(job.country),
    workType: mapWorkType(job.workplaceType),
    jobType: mapEmploymentType(cats.commitment),
    department: cleanStr(cats.department) || cleanStr(cats.team),
    tags: [cleanStr(cats.team), cleanStr(cats.department)].filter(Boolean),
    skills: [],
    ...salaryFromRange(job.salaryRange),
    originalUrl: pickUrl(job.hostedUrl, job.applyUrl),
    applyUrl: pickUrl(job.applyUrl, job.hostedUrl),
    postedAt: toDate(job.createdAt),
    sourceUpdatedAt: toDate(job.updatedAt),
  };
}

export class LeverAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: LEVER_ADAPTER, type: "ats" });
  }

  buildUrl(source) {
    const cfg = source.config || {};
    const site = cfg.site || cfg.company;
    if (!site || typeof site !== "string") {
      throw new SourceHttpError("lever: config.site is required", "config");
    }
    if (!SITE_RE.test(site)) {
      throw new SourceHttpError(`lever: invalid site "${site}"`, "config");
    }
    const base = String(cfg.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    return `${base}/v0/postings/${encodeURIComponent(site)}?mode=json`;
  }

  async fetch(source) {
    const cfg = source.config || {};
    const url = this.buildUrl(source);
    const host = new URL(url).hostname;
    await throttleHost(host, source.rateLimitPerMin);

    const res = await safeGet(url, {
      timeoutMs: cfg.timeoutMs || 15000,
      maxBytes: 12 * 1024 * 1024,
      allowedHosts: cfg.baseUrl ? undefined : [host],
      userAgent: "JobPilot-JobSync/1.0 (+lever)",
    });

    let payload;
    try {
      payload = JSON.parse(res.body);
    } catch {
      throw new SourceHttpError("lever: response was not valid JSON", "response");
    }
    if (!Array.isArray(payload)) {
      throw new SourceHttpError("lever: unexpected response shape (expected an array)", "response");
    }

    const companyName = cfg.companyName || cfg.site || "";
    const raw = [];
    for (const job of payload.slice(0, MAX_JOBS)) {
      const mapped = mapLeverPosting(job, { companyName });
      if (mapped) raw.push(mapped);
    }
    return raw;
  }
}

export const leverAdapter = new LeverAdapter();
registerAdapter(leverAdapter);
