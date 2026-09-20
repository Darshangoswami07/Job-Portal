/**
 * Internal source adapter (PLAN.md §11 "Internal jobs").
 *
 * Exposes the existing recruiter-created `Job` documents to the sync pipeline
 * WITHOUT copying them. The stable per-source identity of an internal job is
 * its own `_id`, so re-syncing never creates a second row.
 */
import { Job } from "../../models/job.model.js";
import "../../models/company.model.js"; // ensure the Company model is registered for populate()
import { JobSource } from "../../models_new/JobSource.js";
import { BaseSourceAdapter, registerAdapter } from "./base.js";
import { isHttpUrl, extractDomain } from "../jobs/normalize.js";

export const INTERNAL_SOURCE_KEY = "internal";
export const INTERNAL_SOURCE_NAME = "Job-Pilot";

const firstFinite = (...vals) => {
  for (const v of vals) if (Number.isFinite(v)) return v;
  return undefined;
};

/**
 * Mongo filter identifying recruiter-created internal jobs — i.e. not produced
 * by an external source / aggregator.
 *
 * A job is "internal" when it has a creator and carries NO external-origin
 * signal: no `sourceId` (not owned by a JobSource row), no external
 * `sourceType`, and no external URL / apply URL. The free-text `source` string
 * is a legacy display label only and is NOT used to decide origin — recruiter
 * jobs in the wild carry all sorts of values there.
 */
export function internalJobFilter() {
  const emptyish = (field) => ({ $or: [{ [field]: { $exists: false } }, { [field]: { $in: [null, ""] } }] });
  return {
    created_by: { $exists: true, $ne: null },
    $and: [
      { $or: [{ sourceId: { $exists: false } }, { sourceId: null }] },
      {
        $or: [
          { sourceType: { $exists: false } },
          { sourceType: { $in: [null, "", "internal"] } },
        ],
      },
      emptyish("sourceUrl"),
      emptyish("applyUrl"),
    ],
  };
}

const JOB_TYPE_ALIASES = {
  fulltime: "Full-time",
  "full time": "Full-time",
  "full-time": "Full-time",
  permanent: "Full-time",
  parttime: "Part-time",
  "part time": "Part-time",
  "part-time": "Part-time",
  contract: "Contract",
  contractor: "Contract",
  temporary: "Contract",
  internship: "Internship",
  intern: "Internship",
  freelance: "Freelance",
};

/** Coerce a legacy / free-text job type onto the Job enum. "" when unknown. */
export function normalizeInternalJobType(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const valid = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
  if (valid.includes(raw)) return raw;
  return JOB_TYPE_ALIASES[raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")] || "";
}

/** Convert one lean internal Job document to the adapter RawJob shape. */
export function internalJobToRaw(job) {
  return {
    externalId: String(job._id),
    title: job.title,
    description: job.description || "",
    companyName: job.company?.name || job.companyName || "",
    companyDomain: extractDomain(job.company?.website || job.company?.email || ""),
    location: job.location || "",
    city: job.city || "",
    country: job.country || "",
    workType: job.workType || "",
    jobType: normalizeInternalJobType(job.jobType),
    skills: Array.isArray(job.skills) ? job.skills : [],
    salaryMin: firstFinite(job.salaryMin, job.salary),
    salaryMax: firstFinite(job.salaryMax, job.salary),
    salaryCurrency: job.salaryCurrency || "",
    experienceMin: firstFinite(job.experienceMin, job.experienceLevel),
    experienceMax: firstFinite(job.experienceMax, job.experienceLevel),
    // Preserve a valid recruiter-supplied URL; never fabricate one.
    originalUrl: isHttpUrl(job.sourceUrl) ? job.sourceUrl : "",
    applyUrl: "", // internal jobs apply in-platform → applyType "internal"
    postedAt: job.publishedAt || job.createdAt,
    sourceUpdatedAt: job.updatedAt,
    internal: {
      jobId: job._id,
      company: job.company?._id || job.company || null,
      created_by: job.created_by,
      slug: job.slug || "",
      isActive: job.isActive !== false,
    },
  };
}

export class InternalSourceAdapter extends BaseSourceAdapter {
  constructor() {
    super({ name: "internal", type: "internal" });
  }

  // eslint-disable-next-line no-unused-vars
  async fetch(source) {
    const jobs = await Job.find({ ...internalJobFilter(), isActive: { $ne: false } })
      .populate("company", "name website email logo location industry")
      .lean();
    return jobs.map(internalJobToRaw);
  }
}

export const internalAdapter = new InternalSourceAdapter();
registerAdapter(internalAdapter);

/**
 * Ensure a JobSource row exists for the internal source. Idempotent; needs no
 * credentials. Safe to call on every boot / sync.
 */
export async function ensureInternalSource() {
  return JobSource.findOneAndUpdate(
    { key: INTERNAL_SOURCE_KEY },
    {
      $setOnInsert: {
        key: INTERNAL_SOURCE_KEY,
        name: INTERNAL_SOURCE_NAME,
        type: "internal",
        adapter: "internal",
        enabled: true,
        schedule: "",
        rateLimitPerMin: 0,
        credentialRef: "",
        config: {},
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
