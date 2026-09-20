/**
 * Ashby source adapter.
 *
 * MECHANISM (verified — Ashby Job Posting API, public):
 *   POST https://api.ashbyhq.com/posting-api/job-board/{jobBoardName}
 *   body: { "includeCompensation": true }
 *
 * Unauthenticated for a published job board — it is the API that powers
 * `jobs.ashbyhq.com/{org}`. No login, no scraping. Returns { jobs: [...] }.
 * Docs: https://developers.ashbyhq.com/reference/job-posting-api
 *
 * Config (JobSource.config — never secrets):
 *   jobBoardName (required)  the board name, e.g. "Ashby"
 *   companyName  (optional)  display fallback
 *   baseUrl      (optional)  tests only
 *
 * `applyUrl` and `jobUrl` are preserved. `applyType` = external. Compensation is
 * mapped ONLY when Ashby returns it — never fabricated.
 */
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeRequest, throttleHost, SourceHttpError } from "./httpClient.js";
import { cleanStr, pickUrl, toDate, mapEmploymentType, salaryFromRange } from "./atsShared.js";

export const ASHBY_ADAPTER = "ashby";
const DEFAULT_BASE_URL = "https://api.ashbyhq.com";
const MAX_JOBS = 5000;
const BOARD_RE = /^[a-z0-9][a-z0-9 _-]{0,80}$/i;

export function mapAshbyJob(job, ctx = {}) {
  if (!job || !job.id) return null;
  const title = cleanStr(job.title);
  if (!title) return null;
  if (job.isListed === false) return null;

  const addr = job.address?.postalAddress || {};
  const location =
    cleanStr(job.location) ||
    [cleanStr(addr.addressLocality), cleanStr(addr.addressRegion)].filter(Boolean).join(", ");

  let comp = {};
  const compRange = job.compensation?.compensationTierSummary || job.compensationRange || job.salaryRange;
  if (compRange) comp = salaryFromRange(compRange);

  return {
    externalId: String(job.id),
    title,
    description: cleanStr(job.descriptionHtml) || cleanStr(job.descriptionPlain),
    companyName: ctx.companyName || "",
    companyDomain: "",
    location,
    country: cleanStr(addr.addressCountry),
    workType: job.isRemote === true ? "Remote" : "",
    jobType: mapEmploymentType(job.employmentType),
    department: cleanStr(job.department) || cleanStr(job.team),
    tags: [cleanStr(job.team), cleanStr(job.department)].filter(Boolean),
    skills: [],
    ...comp,
    originalUrl: pickUrl(job.jobUrl, job.applyUrl),
    applyUrl: pickUrl(job.applyUrl, job.jobUrl),
    postedAt: toDate(job.publishedAt),
    sourceUpdatedAt: toDate(job.updatedAt),
  };
}

export class AshbyAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: ASHBY_ADAPTER, type: "ats" });
  }

  buildUrl(source) {
    const cfg = source.config || {};
    const board = cfg.jobBoardName || cfg.boardName;
    if (!board || typeof board !== "string") {
      throw new SourceHttpError("ashby: config.jobBoardName is required", "config");
    }
    if (!BOARD_RE.test(board)) {
      throw new SourceHttpError(`ashby: invalid jobBoardName "${board}"`, "config");
    }
    const base = String(cfg.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    return `${base}/posting-api/job-board/${encodeURIComponent(board)}`;
  }

  async fetch(source) {
    const cfg = source.config || {};
    const url = this.buildUrl(source);
    const host = new URL(url).hostname;
    await throttleHost(host, source.rateLimitPerMin);

    const res = await safeRequest(url, {
      method: "POST",
      body: { includeCompensation: true },
      timeoutMs: cfg.timeoutMs || 15000,
      maxBytes: 12 * 1024 * 1024,
      allowedHosts: cfg.baseUrl ? undefined : [host],
      userAgent: "JobPilot-JobSync/1.0 (+ashby)",
    });

    let payload;
    try {
      payload = JSON.parse(res.body);
    } catch {
      throw new SourceHttpError("ashby: response was not valid JSON", "response");
    }
    if (!payload || !Array.isArray(payload.jobs)) {
      throw new SourceHttpError("ashby: unexpected response shape (missing jobs[])", "response");
    }

    const companyName = cfg.companyName || cfg.jobBoardName || "";
    const raw = [];
    for (const job of payload.jobs.slice(0, MAX_JOBS)) {
      const mapped = mapAshbyJob(job, { companyName });
      if (mapped) raw.push(mapped);
    }
    return raw;
  }
}

export const ashbyAdapter = new AshbyAdapter();
registerAdapter(ashbyAdapter);
