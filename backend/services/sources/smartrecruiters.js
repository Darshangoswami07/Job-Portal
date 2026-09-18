/**
 * SmartRecruiters source adapter.
 *
 * MECHANISM (verified — SmartRecruiters Posting API, public & documented):
 *   GET https://api.smartrecruiters.com/v1/companies/{companyId}/postings?limit=100&offset=0
 *   GET https://api.smartrecruiters.com/v1/companies/{companyId}/postings/{id}   (per posting)
 *
 * Unauthenticated. It is the API behind `careers.smartrecruiters.com/{companyId}`
 * and `jobs.smartrecruiters.com`. No login, no scraping. The list gives identity
 * + structured fields; a bounded per-posting detail fetch supplies the HTML
 * description and the real `postingUrl` (the SmartRecruiters-hosted apply page).
 * Docs: https://developers.smartrecruiters.com/reference/postingapisearch
 *
 * Config (JobSource.config — never secrets):
 *   companyId   (required)  the SmartRecruiters company identifier
 *   companyName (optional)  display fallback
 *   maxDetail   (optional)  cap on detail fetches per sync (default 100, max 300)
 *   baseUrl     (optional)  tests only
 *
 * `postingUrl` is preserved as originalUrl + applyUrl. `applyType` = external.
 * Salary is not part of the public Posting API — never fabricated.
 */
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeGet, throttleHost, SourceHttpError } from "./httpClient.js";
import { cleanStr, pickUrl, toDate, mapEmploymentType } from "./atsShared.js";

export const SMARTRECRUITERS_ADAPTER = "smartrecruiters";
const DEFAULT_BASE_URL = "https://api.smartrecruiters.com";
const PAGE_SIZE = 100;
const MAX_PAGES = 3;
const DEFAULT_MAX_DETAIL = 100;
const HARD_MAX_DETAIL = 300;
const COMPANY_RE = /^[a-z0-9][a-z0-9 _.-]{0,80}$/i;

const sectionText = (jobAd) => {
  const s = jobAd?.sections || {};
  return [s.jobDescription?.text, s.qualifications?.text, s.additionalInformation?.text]
    .map(cleanStr)
    .filter(Boolean)
    .join("\n");
};

export function mapSmartRecruitersPosting(posting, ctx = {}) {
  if (!posting || !posting.id) return null;
  const title = cleanStr(posting.name);
  if (!title) return null;

  const loc = posting.location || {};
  const location = [cleanStr(loc.city), cleanStr(loc.region), cleanStr(loc.country)].filter(Boolean).join(", ");
  const url = pickUrl(posting.postingUrl, posting.applyUrl);

  return {
    externalId: String(posting.id),
    title,
    description: sectionText(posting.jobAd) || cleanStr(posting.jobAd?.sections?.jobDescription?.text),
    companyName: cleanStr(posting.company?.name) || ctx.companyName || "",
    companyDomain: "",
    location,
    country: cleanStr(loc.country),
    workType: loc.remote === true ? "Remote" : "",
    jobType: mapEmploymentType(posting.typeOfEmployment?.label),
    department: cleanStr(posting.department?.label) || cleanStr(posting.function?.label),
    tags: [cleanStr(posting.function?.label), cleanStr(posting.industry?.label)].filter(Boolean),
    skills: [],
    originalUrl: url,
    applyUrl: url,
    postedAt: toDate(posting.releasedDate),
    sourceUpdatedAt: toDate(posting.releasedDate),
  };
}

export class SmartRecruitersAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: SMARTRECRUITERS_ADAPTER, type: "ats" });
  }

  baseUrlFor(source) {
    const cfg = source.config || {};
    const companyId = cfg.companyId || cfg.company;
    if (!companyId || typeof companyId !== "string") {
      throw new SourceHttpError("smartrecruiters: config.companyId is required", "config");
    }
    if (!COMPANY_RE.test(companyId)) {
      throw new SourceHttpError(`smartrecruiters: invalid companyId "${companyId}"`, "config");
    }
    const base = String(cfg.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    return { base, companyId };
  }

  async fetch(source) {
    const cfg = source.config || {};
    const { base, companyId } = this.baseUrlFor(source);
    const host = new URL(base).hostname;
    const allowedHosts = cfg.baseUrl ? undefined : [host];
    const maxDetail = Math.min(Number(cfg.maxDetail) || DEFAULT_MAX_DETAIL, HARD_MAX_DETAIL);
    const companyName = cfg.companyName || companyId;

    // 1. paginated list
    const summaries = [];
    for (let page = 0; page < MAX_PAGES; page += 1) {
      await throttleHost(host, source.rateLimitPerMin);
      const listUrl = `${base}/v1/companies/${encodeURIComponent(companyId)}/postings?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`;
      const res = await safeGet(listUrl, {
        timeoutMs: cfg.timeoutMs || 15000,
        allowedHosts,
        userAgent: "JobPilot-JobSync/1.0 (+smartrecruiters)",
      });
      let payload;
      try {
        payload = JSON.parse(res.body);
      } catch {
        throw new SourceHttpError("smartrecruiters: list response was not valid JSON", "response");
      }
      if (!payload || !Array.isArray(payload.content)) {
        if (page === 0) throw new SourceHttpError("smartrecruiters: unexpected list shape", "response");
        break;
      }
      summaries.push(...payload.content);
      if (payload.content.length < PAGE_SIZE) break;
    }

    // 2. bounded per-posting detail (for description + postingUrl)
    const raw = [];
    for (const summary of summaries.slice(0, maxDetail)) {
      if (!summary?.id) continue;
      try {
        await throttleHost(host, source.rateLimitPerMin);
        const detUrl = `${base}/v1/companies/${encodeURIComponent(companyId)}/postings/${encodeURIComponent(summary.id)}`;
        const res = await safeGet(detUrl, { timeoutMs: cfg.timeoutMs || 15000, allowedHosts, userAgent: "JobPilot-JobSync/1.0 (+smartrecruiters)" });
        const detail = JSON.parse(res.body);
        const mapped = mapSmartRecruitersPosting({ ...summary, ...detail }, { companyName });
        if (mapped && mapped.description) raw.push(mapped);
      } catch {
        // skip a single bad posting; the sync layer records nothing fatal
      }
    }
    return raw;
  }
}

export const smartRecruitersAdapter = new SmartRecruitersAdapter();
registerAdapter(smartRecruitersAdapter);
