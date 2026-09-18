/**
 * Greenhouse source adapter.
 *
 * MECHANISM (verified against Greenhouse's public Job Board API):
 *   GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 *
 * This is the public, unauthenticated, documented Job Board API that powers
 * employer career pages. It is intended for consumption — no login, no CAPTCHA,
 * no scraping. One request returns every posting for the board (with HTML
 * description content), plus `meta.total`. It is NOT paginated.
 *
 * Configuration (JobSource.config, never secrets):
 *   boardToken   (required)  the board slug, e.g. "airbnb"
 *   companyName  (optional)  display name if the payload omits company_name
 *   baseUrl      (optional)  override for tests / self-hosted proxies
 *   timeoutMs    (optional)
 *
 * `applyType` becomes "external" (type !== "internal") and `absolute_url` — the
 * Greenhouse-hosted posting that contains the application form — is preserved
 * as both originalUrl and applyUrl. We never guess URLs.
 */
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeGet, throttleHost, SourceHttpError } from "./httpClient.js";
import { isHttpUrl } from "../jobs/normalize.js";

export const GREENHOUSE_ADAPTER = "greenhouse";
const DEFAULT_BASE_URL = "https://boards-api.greenhouse.io";
const MAX_JOBS = 5000; // hard safety cap

/** Decode the HTML-entity-encoded `content` field into real HTML. */
export function decodeHtmlEntities(input) {
  if (!input) return "";
  return String(input)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&(?:#39|apos);/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
function safeCodePoint(cp) {
  try {
    return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
  } catch {
    return "";
  }
}

/**
 * Map one Greenhouse job object to the project's RawJob contract.
 * Only fields actually present are mapped — nothing is invented.
 * @returns {object|null} null when the posting has no usable identity/title
 */
export function mapGreenhouseJob(job, ctx = {}) {
  if (!job || job.id === undefined || job.id === null) return null;
  const title = typeof job.title === "string" ? job.title.trim() : "";
  if (!title) return null;

  const absoluteUrl = isHttpUrl(job.absolute_url) ? job.absolute_url.trim() : "";
  const departments = Array.isArray(job.departments)
    ? job.departments.map((d) => d?.name).filter(Boolean)
    : [];
  const offices = Array.isArray(job.offices)
    ? job.offices.map((o) => o?.name || o?.location).filter(Boolean)
    : [];
  const location =
    (job.location && typeof job.location.name === "string" && job.location.name.trim()) ||
    offices[0] ||
    "";

  const metadata = Array.isArray(job.metadata) ? job.metadata : [];
  const metaByName = (name) =>
    metadata.find((m) => m?.name && String(m.name).toLowerCase() === name)?.value;

  return {
    externalId: String(job.id),
    title,
    description: decodeHtmlEntities(job.content || ""),
    companyName: (typeof job.company_name === "string" && job.company_name.trim()) || ctx.companyName || "",
    companyDomain: "", // not provided by Greenhouse
    location,
    city: "", // Greenhouse does not split city out
    country: "", // not reliably provided — leave empty, do not guess
    workType: "", // let normalize.detectRemoteType infer from location/title/content
    jobType:
      typeof metaByName("employment type") === "string" ? metaByName("employment type").trim() : "",
    department: departments[0] || "",
    tags: departments,
    skills: [], // not structured in the Job Board API
    // Both the canonical posting URL and the application destination are the
    // same Greenhouse-hosted page (it contains the form).
    originalUrl: absoluteUrl,
    applyUrl: absoluteUrl,
    postedAt: job.first_published || job.updated_at || undefined,
    sourceUpdatedAt: job.updated_at || undefined,
  };
}

export class GreenhouseAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: GREENHOUSE_ADAPTER, type: "ats" });
  }

  buildUrl(source) {
    const cfg = source.config || {};
    const boardToken = cfg.boardToken || cfg.boardSlug;
    if (!boardToken || typeof boardToken !== "string") {
      throw new SourceHttpError("greenhouse: config.boardToken is required", "config");
    }
    if (!/^[a-z0-9][a-z0-9-]{0,80}$/i.test(boardToken)) {
      throw new SourceHttpError(`greenhouse: invalid board token "${boardToken}"`, "config");
    }
    const base = String(cfg.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    return `${base}/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
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
      userAgent: "JobPilot-JobSync/1.0 (+greenhouse)",
    });

    let payload;
    try {
      payload = JSON.parse(res.body);
    } catch {
      throw new SourceHttpError("greenhouse: response was not valid JSON", "response");
    }
    if (!payload || !Array.isArray(payload.jobs)) {
      throw new SourceHttpError("greenhouse: unexpected response shape (missing jobs[])", "response");
    }

    const companyName =
      cfg.companyName || payload.jobs.find((j) => j?.company_name)?.company_name || "";

    const raw = [];
    for (const job of payload.jobs.slice(0, MAX_JOBS)) {
      const mapped = mapGreenhouseJob(job, { companyName });
      if (mapped) raw.push(mapped);
    }
    return raw;
  }
}

export const greenhouseAdapter = new GreenhouseAdapter();
registerAdapter(greenhouseAdapter);
