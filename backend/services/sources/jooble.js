/**
 * Jooble adapter — official Jooble API (https://jooble.org/api/about).
 *
 *   POST https://jooble.org/api/{API_KEY}
 *   body: { keywords: "<keyword>", location: "<location>" }
 *
 * The API key is a path segment (that is how Jooble's API is designed). It is
 * read from an env-var NAME only (config.apiKeyRef, default "JOOBLE_API_KEY"),
 * sent only to jooble.org over HTTPS, and never logged.
 *
 * `link` is preserved as originalUrl + applyUrl. `applyType` = external.
 */
import crypto from "crypto";

import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { safeRequest, throttleHost, SourceHttpError } from "./httpClient.js";
import { SEARCH_KEYWORDS, stripHtml, extractSalary, resolveEnvRefs } from "./aggregatorShared.js";
import { isHttpUrl } from "../jobs/normalize.js";

export const JOOBLE_ADAPTER = "jooble";
const HOST = "in.jooble.org";

export function mapJoobleJob(job) {
  if (!job) return null;
  const title = typeof job.title === "string" ? stripHtml(job.title) : "";
  if (!title) return null;
  const link = isHttpUrl(job.link) ? job.link.trim() : "";
  const stableId =
    job.id != null
      ? String(job.id)
      : crypto.createHash("sha1").update(`${title}|${job.company || ""}|${link}`).digest("hex").slice(0, 16);
  const { salaryMin, salaryMax } = extractSalary(job.salary || "");
  return {
    externalId: `jooble-${stableId}`,
    title,
    description: stripHtml(job.snippet).slice(0, 8000),
    companyName: typeof job.company === "string" ? job.company : "",
    location: typeof job.location === "string" ? job.location : "",
    jobType: typeof job.type === "string" ? job.type : "",
    salaryMin,
    salaryMax,
    originalUrl: link,
    applyUrl: link,
    postedAt: job.updated || undefined,
  };
}

export class JoobleAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: JOOBLE_ADAPTER, type: "aggregator", coverage: "partial" });
  }

  async fetch(source) {
    const cfg = source.config || {};
    const { apiKey } = resolveEnvRefs({ apiKey: cfg.apiKeyRef || "JOOBLE_API_KEY" });
    if (!apiKey) {
      throw new SourceHttpError("jooble: credential not configured (JOOBLE_API_KEY)", "config");
    }
    const queries = Array.isArray(cfg.queries) && cfg.queries.length ? cfg.queries : SEARCH_KEYWORDS.slice(0, 3);
    const location = cfg.location || "";

    const raw = [];
    for (const keyword of queries) {
      await throttleHost(HOST, source.rateLimitPerMin);
      let payload;
      try {
        const res = await safeRequest(`https://${HOST}/api/${encodeURIComponent(apiKey)}`, {
          method: "POST",
          body: { keywords: keyword, location },
          timeoutMs: cfg.timeoutMs || 15000,
          allowedHosts: [HOST],
          userAgent: "JobPilot-JobSync/1.0 (+jooble)",
        });
        payload = JSON.parse(res.body);
      } catch (err) {
        // scrub any accidental key leakage from the message
        const msg = String(err.message || "").replace(encodeURIComponent(apiKey), "***").replace(apiKey, "***");
        throw new SourceHttpError(`jooble: ${msg}`, err.kind || "network");
      }

      if (!payload || !Array.isArray(payload.jobs)) continue;
      for (const job of payload.jobs) {
        const mapped = mapJoobleJob(job);
        if (mapped) raw.push(mapped);
      }
    }
    return raw;
  }
}

export const joobleAdapter = new JoobleAdapter();
registerAdapter(joobleAdapter);
