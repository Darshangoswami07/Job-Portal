/**
 * Central ingestion boundary (PLAN.md §8.2). Everything that adds or refreshes
 * a job in the catalogue goes through here so behaviour stays consistent:
 *
 *   RawJob → normalize → dedupe fields → locate existing → upsert Job → JobGroup
 *
 * Idempotent: the same RawJob ingested twice makes zero further changes.
 * Never fabricates data and never overwrites a valid URL with an empty one.
 */
import { Job } from "../../models/job.model.js";
import { JobGroup } from "../../models_new/JobGroup.js";
import { rawJobToJobFields } from "../sources/base.js";
import { pickBestJob, seniorityBucket } from "./dedupe.js";
import { htmlToText } from "./normalize.js";
import { findAutoMergeKey } from "./similarity.js";

const CLOSED_STATUSES = ["expired", "filled", "removed", "error"];

const setIfDefined = (target, key, value) => {
  if (value !== undefined) target[key] = value;
};

// Assign an array only when its contents actually changed, so idempotent
// re-ingestion of an unchanged external job reports "unchanged" (no write).
const setArrayIfChanged = (doc, key, next) => {
  if (!Array.isArray(next)) return;
  const current = doc[key];
  const same =
    Array.isArray(current) &&
    current.length === next.length &&
    current.every((v, i) => v === next[i]);
  if (!same) doc[key] = next;
};

/** Fields the internal adapter is allowed to manage — never recruiter content. */
function applyInternalManagedFields(job, mapped, rawJob) {
  job.sourceId = mapped.sourceId;
  job.sourceType = "internal";
  job.sourceName = mapped.sourceName || "Job-Pilot";
  job.externalId = String(rawJob.internal.jobId);
  job.applyType = "internal";

  // Preserve an existing valid recruiter URL; never fabricate, never blank.
  if (mapped.originalUrl) {
    job.originalUrl = mapped.originalUrl;
    if (mapped.canonicalUrl) job.canonicalUrl = mapped.canonicalUrl;
  }

  if (!job.companyName) job.companyName = mapped.companyName || "";
  if (!job.companyDomain) job.companyDomain = mapped.companyDomain || "";

  // Heal a legacy out-of-enum jobType (e.g. "FullTime") so `job.save()` — which
  // re-validates the whole document — does not reject an otherwise valid row.
  const VALID_JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
  if (job.jobType && !VALID_JOB_TYPES.includes(job.jobType)) {
    job.jobType = mapped.jobType && VALID_JOB_TYPES.includes(mapped.jobType) ? mapped.jobType : undefined;
  }

  job.normalizedTitle = mapped.normalizedTitle;
  job.normalizedCompany = mapped.normalizedCompany;
  job.normalizedLocation = mapped.normalizedLocation;
  if (!job.remoteType || job.remoteType === "unknown") job.remoteType = mapped.remoteType;
  job.dedupeHash = mapped.dedupeHash;
  if (mapped.postedAt && !job.postedAt) job.postedAt = mapped.postedAt;
  if (mapped.sourceUpdatedAt) job.sourceUpdatedAt = mapped.sourceUpdatedAt;
}

/** Full field sync for an externally sourced job we own the row for. */
function applyExternalFields(job, mapped) {
  job.title = mapped.title;
  job.description = mapped.description;
  setArrayIfChanged(job, "skills", mapped.skills);
  setArrayIfChanged(job, "tags", mapped.tags);
  job.location = mapped.location;
  setIfDefined(job, "city", mapped.city || undefined);
  setIfDefined(job, "country", mapped.country);
  setIfDefined(job, "jobType", mapped.jobType);
  setIfDefined(job, "department", mapped.department);
  setIfDefined(job, "salaryMin", mapped.salaryMin);
  setIfDefined(job, "salaryMax", mapped.salaryMax);
  setIfDefined(job, "salaryCurrency", mapped.salaryCurrency);
  setIfDefined(job, "experienceMin", mapped.experienceMin);
  setIfDefined(job, "experienceMax", mapped.experienceMax);

  job.companyName = mapped.companyName || job.companyName;
  job.companyDomain = mapped.companyDomain || job.companyDomain;
  job.sourceName = mapped.sourceName;
  job.sourceType = mapped.sourceType;
  if (mapped.source) job.source = mapped.source;
  job.normalizedTitle = mapped.normalizedTitle;
  job.normalizedCompany = mapped.normalizedCompany;
  job.normalizedLocation = mapped.normalizedLocation;
  job.remoteType = mapped.remoteType;
  job.dedupeHash = mapped.dedupeHash;
  job.applyType = mapped.applyType;

  // URL preservation — only write when the incoming value is a real URL.
  if (mapped.originalUrl) job.originalUrl = mapped.originalUrl;
  if (mapped.applyUrl) job.applyUrl = mapped.applyUrl;
  if (mapped.canonicalUrl) job.canonicalUrl = mapped.canonicalUrl;

  if (mapped.postedAt) job.postedAt = mapped.postedAt;
  if (mapped.sourceUpdatedAt) job.sourceUpdatedAt = mapped.sourceUpdatedAt;
  if (mapped.expiresAt) job.expiresAt = mapped.expiresAt;
}

function buildNewExternalJob(mapped) {
  const doc = { isActive: true, publishedAt: mapped.postedAt || new Date() };
  for (const [k, v] of Object.entries(mapped)) if (v !== undefined) doc[k] = v;
  return doc;
}

/**
 * Ingest one RawJob for a resolved source.
 * @returns {Promise<{action:string, jobId?:any, groupId?:any, dedupeHash?:string, reason?:string}>}
 */
export async function ingestRawJob(rawJob, source) {
  const mapped = rawJobToJobFields(rawJob, source);
  const isInternal = (source?.type || "") === "internal";

  let job;
  if (isInternal && rawJob.internal?.jobId) {
    job = await Job.findById(rawJob.internal.jobId);
    if (!job) return { action: "skipped", reason: "internal job no longer exists" };
  } else if (source?._id && mapped.externalId) {
    job = await Job.findOne({ sourceId: source._id, externalId: mapped.externalId });
  }

  const oldHash = job && !job.isNew ? job.dedupeHash : "";
  const oldGroupKey = job && !job.isNew ? job.groupKey || job.dedupeHash : "";

  if (isInternal && rawJob.internal?.jobId) {
    applyInternalManagedFields(job, mapped, rawJob);
  } else if (job) {
    applyExternalFields(job, mapped);
  } else {
    job = new Job(buildNewExternalJob(mapped));
  }

  const now = new Date();
  const wasNew = job.isNew;
  job.lastSeenAt = now;
  if (!job.firstSeenAt) job.firstSeenAt = now;

  // Reversibility (Phase 6 §29): re-seeing a job in a valid sync reactivates it.
  // Exception: a job flagged "error" by link verification stays hidden until
  // it is re-verified — re-appearing in the feed does not fix a dead link.
  let reactivated = false;
  if (!wasNew && ["expired", "removed", "filled"].includes(job.status)) {
    job.status = "active";
    job.isActive = true;
    reactivated = true;
  }

  if (job.status === "error") {
    // keep hidden
  } else if (job.isActive === false) {
    job.status = "expired";
  } else if (!CLOSED_STATUSES.includes(job.status)) {
    job.status = "active";
  }

  const isNew = job.isNew;
  const changed = isNew || job.modifiedPaths().some((p) => p !== "lastSeenAt");
  await job.save();

  // ── Level 3: similarity assist (PLAN.md §7) ────────────────────────────────
  // Effective group key. Default: the deterministic Level-2 hash. For an
  // external job seen for the first time or whose hash just changed, look for
  // an existing near-identical group to fold into — HIGH confidence only, with
  // merge guards and admin splits (MergeBlock) respected. Internal jobs and
  // unchanged re-ingests keep the grouping they already have.
  let groupKey = mapped.dedupeHash || job.groupKey || "";
  if (!isInternal && mapped.dedupeHash && (isNew || oldHash !== mapped.dedupeHash)) {
    try {
      const mergeKey = await findAutoMergeKey(job);
      if (mergeKey) groupKey = mergeKey;
    } catch {
      // the similarity assist must never break ingestion
    }
  } else if (!isNew && job.groupKey && mapped.dedupeHash === oldHash) {
    groupKey = job.groupKey;
  }
  if (groupKey && job.groupKey !== groupKey) {
    job.groupKey = groupKey;
    await job.save();
  }

  // Rebuild the target group, plus any group the job just left.
  const group = groupKey ? await rebuildGroup(groupKey) : null;
  for (const stale of [oldGroupKey, oldHash]) {
    if (stale && stale !== groupKey) await rebuildGroup(stale).catch(() => {});
  }

  return {
    action: isNew ? "inserted" : changed ? "updated" : "unchanged",
    reactivated,
    jobId: job._id,
    groupId: group?._id,
    dedupeHash: mapped.dedupeHash,
    groupKey,
    previousDedupeHash: oldHash && oldHash !== mapped.dedupeHash ? oldHash : undefined,
  };
}

/**
 * Rebuild the JobGroup for a group key from its member Job rows.
 *
 * The key is a `Job.groupKey`, which defaults to the deterministic Level-2
 * `dedupeHash` but may have been pointed elsewhere by the Level-3 similarity
 * assist. Rows that predate `groupKey` (empty value) are self-healed to their
 * own hash so the query stays a single indexed lookup. The `JobGroup` document
 * is still stored under `dedupeHash: <groupKey>` (the field name is unchanged
 * for compatibility). Deterministic: same member rows → same output.
 */
export async function rebuildGroup(groupKey) {
  if (!groupKey) return null;

  // Self-heal legacy rows that share this hash but have no groupKey yet.
  const legacy = await Job.find({
    dedupeHash: groupKey,
    $or: [{ groupKey: { $exists: false } }, { groupKey: "" }, { groupKey: null }],
  })
    .select("_id")
    .lean();
  if (legacy.length) {
    await Job.updateMany({ _id: { $in: legacy.map((j) => j._id) } }, { $set: { groupKey } });
  }

  const dedupeHash = groupKey;
  const jobs = await Job.find({ groupKey }).lean();
  if (!jobs.length) {
    await JobGroup.updateOne(
      { dedupeHash },
      {
        $set: {
          sources: [],
          sourceNames: [],
          memberHashes: [],
          autoMerged: false,
          activeSourceCount: 0,
          status: "inactive",
        },
      }
    );
    return JobGroup.findOne({ dedupeHash });
  }

  const isVisible = (j) =>
    j.isActive !== false && !CLOSED_STATUSES.includes(j.status);
  const visible = jobs.filter(isVisible);
  const best = pickBestJob(visible.length ? visible : jobs);

  const times = jobs
    .flatMap((j) => [j.postedAt, j.lastSeenAt, j.createdAt])
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((n) => !Number.isNaN(n));

  // One entry per member job; per-source Apply URL is NEVER cross-contaminated.
  const sources = jobs.map((j) => ({
    jobId: j._id,
    sourceId: j.sourceId,
    sourceName: j.sourceName || j.source || "",
    sourceType: j.sourceType || "internal",
    applyUrl: j.applyType === "internal" ? "" : j.applyUrl || j.originalUrl || "",
    applyType: j.applyType || "internal",
    status: j.status || "active",
    postedAt: j.postedAt,
    lastSeenAt: j.lastSeenAt,
    lastVerifiedAt: j.lastVerifiedAt,
  }));

  const memberHashes = [...new Set(jobs.map((j) => j.dedupeHash).filter(Boolean))].sort();

  const doc = {
    dedupeHash,
    memberHashes,
    autoMerged: memberHashes.length > 1,
    displayTitle: best.title || "",
    normalizedTitle: best.normalizedTitle || "",
    companyName: best.companyName || "",
    normalizedCompany: best.normalizedCompany || "",
    companyDomain: best.companyDomain || "",
    company: best.company || undefined,
    location: best.location || "",
    normalizedLocation: best.normalizedLocation || "",
    remoteType: best.remoteType || "unknown",
    seniority: best.seniority || seniorityBucket(best.title),
    jobType: best.jobType || "",
    industry: best.industry || "",
    department: best.department || "",
    experienceLevel: Number.isFinite(best.experienceLevel) ? best.experienceLevel : undefined,
    salaryMin: best.salaryMin,
    salaryMax: best.salaryMax,
    salaryCurrency: best.salaryCurrency || "",
    skills: Array.isArray(best.skills) ? best.skills : [],
    descriptionPreview: htmlToText(best.description, 320),
    sources,
    sourceNames: [...new Set(sources.filter((s) => s.status === "active").map((s) => s.sourceName).filter(Boolean))],
    bestJobId: best._id,
    activeSourceCount: visible.length,
    postedAt: best.postedAt || best.publishedAt || best.createdAt,
    firstSeenAt: times.length ? new Date(Math.min(...times)) : undefined,
    lastSeenAt: times.length ? new Date(Math.max(...times)) : undefined,
    status: visible.length ? "active" : "inactive",
  };

  await JobGroup.updateOne({ dedupeHash }, { $set: doc }, { upsert: true });
  const group = await JobGroup.findOne({ dedupeHash });
  if (group) {
    await Job.updateMany(
      { _id: { $in: jobs.map((j) => j._id) }, groupId: { $ne: group._id } },
      { $set: { groupId: group._id } }
    );
  }
  return group;
}

/**
 * Convenience for event-driven ingestion (recruiter posts/updates a job).
 * Fire-and-forget friendly; swallows nothing — caller decides.
 */
export async function ingestInternalJobById(jobId) {
  const { ensureInternalSource, internalJobToRaw } = await import("../sources/internal.js");
  const { Job: JobModel } = await import("../../models/job.model.js");

  const source = await ensureInternalSource();
  const job = await JobModel.findById(jobId)
    .populate("company", "name website email logo location industry")
    .lean();
  if (!job) return { action: "skipped", reason: "job not found" };

  return ingestRawJob(internalJobToRaw(job), source);
}

/** After a recruiter hard-deletes a job, refresh its group. */
export async function handleJobRemoved({ dedupeHash }) {
  if (!dedupeHash) return null;
  return rebuildGroup(dedupeHash);
}
