/**
 * Pure transform used by scripts/backfill-job-fields.js (PLAN.md §10 / §13).
 *
 * Given an existing Job (plain object, optionally with `company` populated),
 * compute ONLY the Phase 1 fields that are currently missing/empty. Never
 * fabricates data, never overwrites a valid existing value, and returns an
 * empty `set` when there is nothing to do (so the migration is idempotent).
 */
import {
  normalizeTitle,
  normalizeCompany,
  normalizeLocation,
  detectRemoteType,
  stripTrackingParams,
  isHttpUrl,
  extractDomain,
  collapseWhitespace,
} from "./normalize.js";
import { generateDedupeHash } from "./dedupe.js";

const INTERNAL_SOURCE_MARKERS = new Set(["", "jobpilot ai", "jobpilot", "internal"]);

const isEmpty = (v) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (Array.isArray(v) && v.length === 0);

/** Best-effort employer name from whatever the legacy row carries. */
function resolveCompanyName(job) {
  if (!isEmpty(job.companyName)) return collapseWhitespace(job.companyName);
  if (job.company && typeof job.company === "object" && job.company.name) {
    return collapseWhitespace(job.company.name);
  }
  return "";
}

function resolveCompanyDomain(job) {
  if (!isEmpty(job.companyDomain)) return job.companyDomain;
  if (job.company && typeof job.company === "object") {
    const fromSite = extractDomain(job.company.website);
    if (fromSite) return fromSite;
    const fromEmail = extractDomain(job.company.email);
    if (fromEmail) return fromEmail;
  }
  return "";
}

/**
 * @param {object} job  A lean Job document (may have `company` populated).
 * @returns {{ _id: any, set: object, dedupeHash: string,
 *            groupCandidate: object|null }}
 */
export function computeBackfillFields(job) {
  const set = {};

  const legacySource = String(job.source || "").trim().toLowerCase();
  const hasExternalUrl = isHttpUrl(job.sourceUrl);
  const looksInternal =
    !hasExternalUrl && INTERNAL_SOURCE_MARKERS.has(legacySource) && !isEmpty(job.created_by);

  // ── source identity ──────────────────────────────────────────────────
  // Write when the field is missing, or when a legacy external row still
  // carries the schema default ("internal").
  const sourceType = looksInternal ? "internal" : "aggregator";
  if (isEmpty(job.sourceType) || (job.sourceType === "internal" && sourceType !== "internal")) {
    set.sourceType = sourceType;
  }

  const sourceName = looksInternal ? "Internal" : job.source || "Unknown";
  if (isEmpty(job.sourceName)) set.sourceName = sourceName;

  // ── original / apply URL preservation (never fabricate) ───────────────
  const originalUrl = hasExternalUrl ? collapseWhitespace(job.sourceUrl) : "";
  if (isEmpty(job.originalUrl) && originalUrl) set.originalUrl = originalUrl;

  const existingApply = !isEmpty(job.applyUrl) ? job.applyUrl : "";
  const applyUrl = existingApply || originalUrl;
  if (isEmpty(job.applyUrl) && applyUrl) set.applyUrl = applyUrl;

  const canonicalUrl = stripTrackingParams(job.canonicalUrl || originalUrl || applyUrl);
  if (isEmpty(job.canonicalUrl) && canonicalUrl) set.canonicalUrl = canonicalUrl;

  const applyType = looksInternal || !applyUrl ? "internal" : "external";
  if (isEmpty(job.applyType) || (job.applyType === "internal" && applyType === "external")) {
    set.applyType = applyType;
  }

  // ── normalization ────────────────────────────────────────────────────
  const companyName = resolveCompanyName(job);
  if (isEmpty(job.companyName) && companyName) set.companyName = companyName;

  const companyDomain = resolveCompanyDomain(job);
  if (isEmpty(job.companyDomain) && companyDomain) set.companyDomain = companyDomain;

  const remoteType = detectRemoteType(job);
  if ((isEmpty(job.remoteType) || job.remoteType === "unknown") && remoteType !== "unknown") {
    set.remoteType = remoteType;
  }
  const effectiveRemoteType =
    set.remoteType || (job.remoteType && job.remoteType !== "unknown" ? job.remoteType : remoteType);

  const normalizedTitle = normalizeTitle(job.title);
  if (isEmpty(job.normalizedTitle) && normalizedTitle) set.normalizedTitle = normalizedTitle;

  const normalizedCompany = normalizeCompany(companyName);
  if (isEmpty(job.normalizedCompany) && normalizedCompany) {
    set.normalizedCompany = normalizedCompany;
  }

  const normalizedLocation = normalizeLocation(job.location, {
    remoteType: effectiveRemoteType,
  });
  if (isEmpty(job.normalizedLocation) && normalizedLocation) {
    set.normalizedLocation = normalizedLocation;
  }

  // ── dedupe hash ──────────────────────────────────────────────────────
  const dedupeHash =
    !isEmpty(job.dedupeHash)
      ? job.dedupeHash
      : generateDedupeHash({
          normalizedCompany: set.normalizedCompany || job.normalizedCompany || normalizedCompany,
          normalizedTitle: set.normalizedTitle || job.normalizedTitle || normalizedTitle,
          normalizedLocation:
            set.normalizedLocation || job.normalizedLocation || normalizedLocation,
          remoteType: effectiveRemoteType,
        });
  if (isEmpty(job.dedupeHash) && dedupeHash) set.dedupeHash = dedupeHash;

  // ── lifecycle / freshness ────────────────────────────────────────────
  if (isEmpty(job.status)) set.status = job.isActive === false ? "expired" : "active";
  if (isEmpty(job.firstSeenAt) && job.createdAt) set.firstSeenAt = job.createdAt;
  if (isEmpty(job.lastSeenAt) && (job.updatedAt || job.createdAt)) {
    set.lastSeenAt = job.updatedAt || job.createdAt;
  }
  if (isEmpty(job.postedAt) && (job.publishedAt || job.createdAt)) {
    set.postedAt = job.publishedAt || job.createdAt;
  }

  const groupCandidate = dedupeHash
    ? {
        jobId: job._id,
        sourceName: set.sourceName || job.sourceName || sourceName,
        sourceType: set.sourceType || job.sourceType || sourceType,
        applyUrl: set.applyUrl || job.applyUrl || applyUrl,
        applyType: set.applyType || job.applyType || applyType,
        postedAt: set.postedAt || job.postedAt || job.publishedAt || job.createdAt,
        lastSeenAt: set.lastSeenAt || job.lastSeenAt || job.updatedAt || job.createdAt,
        status: set.status || job.status || (job.isActive === false ? "expired" : "active"),
        // fields used by pickBestJob
        description: job.description,
        salary: job.salary,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        skills: job.skills,
        companyDomain: set.companyDomain || job.companyDomain || companyDomain,
        companyName: set.companyName || job.companyName || companyName,
        normalizedCompany: set.normalizedCompany || job.normalizedCompany || normalizedCompany,
        normalizedTitle: set.normalizedTitle || job.normalizedTitle || normalizedTitle,
        normalizedLocation:
          set.normalizedLocation || job.normalizedLocation || normalizedLocation,
        remoteType: effectiveRemoteType,
        location: job.location,
        createdAt: job.createdAt,
        title: job.title,
      }
    : null;

  return { _id: job._id, set, dedupeHash, groupCandidate };
}

export const __test__ = { isEmpty, resolveCompanyName, resolveCompanyDomain };
