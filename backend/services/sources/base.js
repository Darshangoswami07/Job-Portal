/**
 * Source-adapter foundation (PLAN.md §9 / §11).
 *
 * Phase 1 provides ONLY the contract, a registry, credential resolution and
 * SyncRun bookkeeping helpers. No concrete adapters (Greenhouse, Lever, Adzuna,
 * …), no HTTP client, no scheduler, no sync pipeline — those are later phases.
 */
import { SyncRun } from "../../models_new/SyncRun.js";
import {
  normalizeTitle,
  normalizeCompany,
  normalizeLocation,
  detectRemoteType,
  stripTrackingParams,
  isHttpUrl,
  extractDomain,
} from "../jobs/normalize.js";
import { generateDedupeHash, seniorityBucket } from "../jobs/dedupe.js";

/**
 * @typedef {Object} RawJob
 * A source's job payload after the adapter's own shallow mapping, before
 * normalization. Adapters must populate at least `externalId`, `title` and
 * one of `applyUrl` / `originalUrl`.
 * @property {string}  externalId        Stable id within the source.
 * @property {string}  title
 * @property {string} [description]
 * @property {string} [companyName]
 * @property {string} [companyDomain]
 * @property {string} [location]
 * @property {string} [country]
 * @property {string} [workType]         "Remote" | "Hybrid" | "On-site"
 * @property {number} [salaryMin]
 * @property {number} [salaryMax]
 * @property {string} [salaryCurrency]
 * @property {number} [experienceMin]
 * @property {number} [experienceMax]
 * @property {string} [jobType]
 * @property {string[]} [skills]
 * @property {string} [originalUrl]      Canonical posting URL at the source.
 * @property {string} [applyUrl]         Where "Apply" should send the user.
 * @property {Date|string} [postedAt]
 * @property {Date|string} [sourceUpdatedAt]
 * @property {Date|string} [expiresAt]
 * @property {*}       [raw]             Untouched source payload (debug only).
 */

/**
 * @typedef {Object} SourceAdapter
 * @property {string} name                 Matches JobSource.adapter.
 * @property {("internal"|"ats"|"aggregator"|"feed"|"partner")} type
 * @property {(source: import("mongoose").Document) => Promise<RawJob[]>} fetch
 *           Return the source's current listings as RawJob[]. Must respect the
 *           source's published terms and rate limits. (Implemented per adapter
 *           in a later phase.)
 */

/** Base class adapters may extend. `fetch` must be overridden. */
export class BaseSourceAdapter {
  /**
   * @param {{ name:string, type:string, coverage?:"complete"|"partial" }} opts
   *   `coverage` = "complete" (default): every fetch returns the source's whole
   *   current listing, so jobs absent from a clean run can be expired.
   *   "partial": the fetch is a bounded/rotating query window (aggregators with
   *   keyword search) — the sync must NOT expire "unseen" jobs, only rely on the
   *   source's `staleAfterDays` sweep.
   */
  constructor({ name, type, coverage = "complete" }) {
    this.name = name;
    this.type = type;
    this.coverage = coverage;
  }

  // eslint-disable-next-line no-unused-vars
  async fetch(source, opts) {
    throw new Error(`Adapter "${this.name}" has not implemented fetch()`);
  }
}

// ── Adapter registry ─────────────────────────────────────────────────────
const registry = new Map();

export function registerAdapter(adapter) {
  if (!adapter || !adapter.name) throw new Error("Adapter must have a name");
  registry.set(adapter.name, adapter);
  return adapter;
}

export function getAdapter(name) {
  return registry.get(name) || null;
}

export function listAdapters() {
  return [...registry.keys()];
}

// ── Credential resolution ────────────────────────────────────────────────
/**
 * Resolve a source's credential from the environment by name only.
 * `source.credentialRef` is an env-var NAME; the value never touches the DB.
 */
export function resolveSourceCredential(source, env = process.env) {
  if (!source || !source.credentialRef) return "";
  return env[source.credentialRef] || "";
}

// ── SyncRun bookkeeping (model wired here; pipeline is a later phase) ─────
export async function startSyncRun(source) {
  return SyncRun.create({
    sourceId: source._id,
    sourceKey: source.key,
    startedAt: new Date(),
    status: "running",
  });
}

export async function finishSyncRun(run, patch = {}) {
  if (!run) return null;
  const finishedAt = new Date();
  run.set({
    finishedAt,
    durationMs: finishedAt.getTime() - new Date(run.startedAt).getTime(),
    status: patch.status || (patch.errorLog?.length ? "partial" : "ok"),
    ...patch,
  });
  return run.save();
}

// ── RawJob → Job field mapping (pure; no DB) ─────────────────────────────
const toDate = (value) => {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/**
 * Map a normalized RawJob onto the subset of Job fields an adapter owns.
 * Never fabricates: missing salary/country/jobType stay undefined, apply URLs
 * are only kept when they are valid http(s).
 *
 * @param {RawJob} rawJob
 * @param {{ _id?: any, key?: string, name?: string, type?: string }} source
 */
export function rawJobToJobFields(rawJob, source = {}) {
  const remoteType = detectRemoteType({
    workType: rawJob.workType,
    location: rawJob.location,
    title: rawJob.title,
    description: rawJob.description,
    remoteFriendly: rawJob.remoteFriendly,
  });

  const normalizedTitleValue = normalizeTitle(rawJob.title);
  const normalizedCompanyValue = normalizeCompany(rawJob.companyName);
  const normalizedLocationValue = normalizeLocation(rawJob.location, { remoteType });

  const originalUrl = isHttpUrl(rawJob.originalUrl) ? rawJob.originalUrl.trim() : "";
  const applyUrl = isHttpUrl(rawJob.applyUrl)
    ? rawJob.applyUrl.trim()
    : originalUrl;
  const canonicalUrl = stripTrackingParams(originalUrl || applyUrl);

  const applyType = source.type && source.type !== "internal" ? "external" : "internal";
  const seniority = seniorityBucket(rawJob.title || normalizedTitleValue);
  const employmentType = rawJob.jobType || "";

  return {
    sourceId: source._id,
    sourceType: source.type || "aggregator",
    sourceName: source.name || "",
    // Legacy display field kept in sync so old queries/UI still resolve.
    source: source.name || undefined,
    externalId: rawJob.externalId ? String(rawJob.externalId) : "",

    title: rawJob.title,
    description: rawJob.description || "",
    skills: Array.isArray(rawJob.skills) ? rawJob.skills : [],
    department: rawJob.department || undefined,
    tags: Array.isArray(rawJob.tags) ? rawJob.tags : undefined,
    location: rawJob.location || "",
    city: rawJob.city || "",
    country: rawJob.country || undefined,
    jobType: rawJob.jobType || undefined,
    salaryMin: Number.isFinite(rawJob.salaryMin) ? rawJob.salaryMin : undefined,
    salaryMax: Number.isFinite(rawJob.salaryMax) ? rawJob.salaryMax : undefined,
    salaryCurrency: rawJob.salaryCurrency || undefined,
    experienceMin: Number.isFinite(rawJob.experienceMin) ? rawJob.experienceMin : undefined,
    experienceMax: Number.isFinite(rawJob.experienceMax) ? rawJob.experienceMax : undefined,

    companyName: rawJob.companyName || "",
    companyDomain:
      rawJob.companyDomain || extractDomain(rawJob.companyWebsite || originalUrl),

    normalizedTitle: normalizedTitleValue,
    normalizedCompany: normalizedCompanyValue,
    normalizedLocation: normalizedLocationValue,
    remoteType,
    seniority,

    originalUrl,
    applyUrl,
    canonicalUrl,
    applyType,

    dedupeHash: generateDedupeHash({
      normalizedCompany: normalizedCompanyValue,
      normalizedTitle: normalizedTitleValue,
      normalizedLocation: normalizedLocationValue,
      remoteType,
      seniority,
      employmentType,
    }),

    postedAt: toDate(rawJob.postedAt),
    sourceUpdatedAt: toDate(rawJob.sourceUpdatedAt),
    expiresAt: toDate(rawJob.expiresAt),
    status: "active",
  };
}
