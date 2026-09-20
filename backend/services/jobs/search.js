/**
 * Server-side job search (PLAN.md §15). Phase 2: MongoDB only — `$text` for
 * the keyword, plain indexed fields for filters, `skip`/`limit` paging.
 *
 * `parseSearchParams` is pure and validates/coerces the raw query string.
 * `buildSearchFilter` is pure and turns parsed params into a Mongo filter +
 * sort. The controller layers the (DB-dependent) company lookup on top.
 */
import { normalizeSearchQuery } from "./queryNormalize.js";

export const DEFAULT_LIMIT = 20;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Phase 11: a freshness label backed ONLY by real stored timestamps. Returns
 * `""` when nothing can be claimed — never implies "new" just because a job was
 * re-ingested.
 * @returns {{ label: string, postedAt: Date|null }}
 */
export function computeFreshness(g = {}) {
  const now = Date.now();
  const posted = g.postedAt ? new Date(g.postedAt) : null;
  const updated = g.sourceUpdatedAt ? new Date(g.sourceUpdatedAt) : null;
  const verified = g.lastVerifiedAt ? new Date(g.lastVerifiedAt) : null;

  if (posted && now - posted.getTime() <= 3 * DAY) return { label: "Just posted", postedAt: posted };
  if (posted && now - posted.getTime() <= 7 * DAY) return { label: "Recently posted", postedAt: posted };
  if (updated && now - updated.getTime() <= 7 * DAY) return { label: "Updated recently", postedAt: posted };
  if (verified && now - verified.getTime() <= 14 * DAY) return { label: "Link verified recently", postedAt: posted };
  return { label: "", postedAt: posted };
}
export const MAX_LIMIT = 50;

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const REMOTE_TYPES = ["remote", "hybrid", "onsite"];
const SORTS = ["relevance", "recommended", "newest", "oldest", "salary", "salary_desc", "salary_asc", "experience_asc"];

const STR_MAX = 200;

const escapeRegex = (v) => String(v || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rx = (v) => new RegExp(escapeRegex(String(v).trim()), "i");

const csv = (value) =>
  String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function positiveInt(value, { field, min = 1, max = Infinity }) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    return { error: `${field} must be an integer between ${min} and ${max === Infinity ? "∞" : max}` };
  }
  return { value: n };
}

function nonNegativeNumber(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return { error: `${field} must be a non-negative number` };
  return { value: n };
}

/**
 * @returns {{ error: string } | { params: object }}
 */
export function parseSearchParams(query = {}) {
  const p = {
    q: "",
    page: 1,
    limit: DEFAULT_LIMIT,
    sort: "relevance",
  };

  // strings
  for (const field of ["q", "location", "company", "industry", "department", "skills", "source", "remoteType", "jobType"]) {
    const raw = query[field];
    if (raw === undefined || raw === null || raw === "") continue;
    const str = String(raw).trim();
    if (str.length > STR_MAX) return { error: `${field} is too long` };
    p[field] = str;
  }

  if (query.page !== undefined && query.page !== "") {
    const r = positiveInt(query.page, { field: "page", max: 100000 });
    if (r.error) return { error: r.error };
    p.page = r.value;
  }

  if (query.limit !== undefined && query.limit !== "") {
    // A positive integer is accepted and silently clamped to MAX_LIMIT; only
    // garbage (non-integer / < 1) is a validation error.
    const r = positiveInt(query.limit, { field: "limit", max: 1_000_000 });
    if (r.error) return { error: r.error };
    p.limit = Math.min(r.value, MAX_LIMIT);
  }

  if (query.sort !== undefined && query.sort !== "") {
    if (!SORTS.includes(String(query.sort))) return { error: `sort must be one of: ${SORTS.join(", ")}` };
    p.sort = String(query.sort);
  }

  if (p.remoteType) {
    const invalid = csv(p.remoteType).filter((v) => !REMOTE_TYPES.includes(v.toLowerCase()));
    if (invalid.length) return { error: `remoteType must be one of: ${REMOTE_TYPES.join(", ")}` };
    p.remoteType = csv(p.remoteType).map((v) => v.toLowerCase());
  }

  if (p.jobType) {
    const wanted = csv(p.jobType);
    const invalid = wanted.filter((v) => !JOB_TYPES.includes(v));
    if (invalid.length) return { error: `jobType must be one of: ${JOB_TYPES.join(", ")}` };
    p.jobType = wanted;
  }

  for (const field of ["salaryMin", "salaryMax", "experienceMin", "experienceMax"]) {
    if (query[field] === undefined || query[field] === "") continue;
    const r = nonNegativeNumber(query[field], field);
    if (r.error) return { error: r.error };
    p[field] = r.value;
  }

  if (query.postedWithinDays !== undefined && query.postedWithinDays !== "") {
    const r = positiveInt(query.postedWithinDays, { field: "postedWithinDays", max: 3650 });
    if (r.error) return { error: r.error };
    p.postedWithinDays = r.value;
  }

  return { params: p };
}

/**
 * @returns {{ filter: object, sort: object, useTextScore: boolean }}
 */
export function buildSearchFilter(params = {}) {
  const and = [];
  const filter = {
    isActive: { $ne: false },
    status: { $nin: ["expired", "filled", "removed", "error"] },
  };
  let useTextScore = false;

  if (params.q) {
    filter.$text = { $search: params.q };
    useTextScore = true;
  }

  if (params.location) {
    const terms = csv(params.location);
    and.push({
      $or: terms.flatMap((t) => [
        { location: rx(t) },
        { city: rx(t) },
        { normalizedLocation: rx(t) },
      ]),
    });
  }

  if (Array.isArray(params.remoteType) && params.remoteType.length) {
    const map = {
      remote: [{ remoteType: "remote" }, { workType: "Remote" }, { remoteFriendly: true }],
      hybrid: [{ remoteType: "hybrid" }, { workType: "Hybrid" }],
      onsite: [{ remoteType: "onsite" }, { workType: "On-site" }],
    };
    and.push({ $or: params.remoteType.flatMap((t) => map[t] || []) });
  }

  if (Array.isArray(params.jobType) && params.jobType.length) {
    and.push({ jobType: { $in: params.jobType } });
  }

  if (params.industry) {
    and.push({ $or: csv(params.industry).map((t) => ({ industry: rx(t) })) });
  }
  if (params.department) {
    and.push({ $or: csv(params.department).map((t) => ({ department: rx(t) })) });
  }
  if (params.skills) {
    and.push({ skills: { $in: csv(params.skills).map((s) => rx(s)) } });
  }
  if (params.source) {
    const terms = csv(params.source);
    and.push({ $or: terms.flatMap((t) => [{ sourceName: t }, { source: t }]) });
  }

  if (params.salaryMin !== undefined || params.salaryMax !== undefined) {
    const range = {};
    if (params.salaryMin !== undefined) range.$gte = params.salaryMin;
    if (params.salaryMax !== undefined) range.$lte = params.salaryMax;
    and.push({ salary: range });
  }

  if (params.experienceMin !== undefined || params.experienceMax !== undefined) {
    const range = {};
    if (params.experienceMin !== undefined) range.$gte = params.experienceMin;
    if (params.experienceMax !== undefined) range.$lte = params.experienceMax;
    and.push({ experienceLevel: range });
  }

  if (params.postedWithinDays !== undefined) {
    const cutoff = new Date(Date.now() - params.postedWithinDays * 24 * 60 * 60 * 1000);
    and.push({
      $or: [
        { postedAt: { $gte: cutoff } },
        { publishedAt: { $gte: cutoff } },
        { createdAt: { $gte: cutoff } },
      ],
    });
  }

  if (and.length) filter.$and = and;

  const sort = buildSort(params.sort, useTextScore);
  return { filter, sort, useTextScore };
}

/**
 * Phase 4: build a filter + sort for the JobGroup collection (one row per
 * deduped vacancy). Pure. `params` comes from `parseSearchParams`.
 * @returns {{ filter: object, sort: object }}
 */
export function buildGroupSearchFilter(params = {}) {
  const and = [];
  const filter = { status: "active" };

  // Phase 11: normalize the keyword for `$text` only (controlled spacing/spelling
  // variants — never cross-technology). The raw `params.q` is kept for analytics.
  if (params.q) {
    const { normalized } = normalizeSearchQuery(params.q);
    filter.$text = { $search: normalized || params.q };
  }

  if (params.location) {
    and.push({
      $or: csv(params.location).flatMap((t) => [
        { location: rx(t) },
        { normalizedLocation: rx(t) },
      ]),
    });
  }
  if (Array.isArray(params.remoteType) && params.remoteType.length) {
    and.push({ remoteType: { $in: params.remoteType } });
  }
  if (Array.isArray(params.jobType) && params.jobType.length) {
    and.push({ jobType: { $in: params.jobType } });
  }
  if (params.industry) and.push({ $or: csv(params.industry).map((t) => ({ industry: rx(t) })) });
  if (params.department) and.push({ $or: csv(params.department).map((t) => ({ department: rx(t) })) });
  if (params.skills) and.push({ skills: { $in: csv(params.skills).map((s) => rx(s)) } });
  if (params.company) and.push({ companyName: rx(params.company) });
  if (params.source) and.push({ sourceNames: { $in: csv(params.source) } });

  if (params.salaryMin !== undefined || params.salaryMax !== undefined) {
    const range = {};
    if (params.salaryMin !== undefined) range.$gte = params.salaryMin;
    if (params.salaryMax !== undefined) range.$lte = params.salaryMax;
    and.push({ $or: [{ salaryMin: range }, { salaryMax: range }] });
  }
  if (params.experienceMin !== undefined || params.experienceMax !== undefined) {
    const range = {};
    if (params.experienceMin !== undefined) range.$gte = params.experienceMin;
    if (params.experienceMax !== undefined) range.$lte = params.experienceMax;
    and.push({ experienceLevel: range });
  }
  if (params.postedWithinDays !== undefined) {
    const cutoff = new Date(Date.now() - params.postedWithinDays * 24 * 60 * 60 * 1000);
    and.push({ postedAt: { $gte: cutoff } });
  }

  if (and.length) filter.$and = and;

  // Phase 7: when there is a keyword and the user wants "relevance" (or the
  // Phase 8 "recommended" mode, which starts from relevance), rank by the
  // MongoDB `$text` score. Otherwise fall back to recency.
  // Phase 8: "recommended" asks the controller to personalize AFTER retrieval —
  // the DB sort stays relevance/recency so explicit keyword intent is preserved.
  const relevanceLike = params.sort === "relevance" || params.sort === "recommended" || !params.sort;
  const textScore = !!params.q && relevanceLike;
  const sort = textScore
    ? { score: { $meta: "textScore" }, postedAt: -1 }
    : groupSort(params.sort === "recommended" ? "relevance" : params.sort);
  return { filter, sort, textScore, personalize: params.sort === "recommended" };
}

/**
 * Phase 7: facet counts for the grouped search. ONE aggregation, `$match` on the
 * same filter the result page uses, then `$facet` fans out the buckets — no N+1,
 * no second round-trip per facet. `$text` (when present) stays the first stage.
 * @returns {object[]} aggregation pipeline for JobGroup
 */
export function buildFacetPipeline(filter = {}) {
  const nonEmpty = (field) => ({ $match: { [field]: { $nin: ["", null] } } });
  const bucketByCount = (field) => [
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ];
  return [
    { $match: filter },
    {
      $facet: {
        remoteType: bucketByCount("remoteType"),
        jobType: [nonEmpty("jobType"), ...bucketByCount("jobType")],
        seniority: [nonEmpty("seniority"), ...bucketByCount("seniority")],
        source: [
          { $unwind: "$sourceNames" },
          ...bucketByCount("sourceNames"),
        ],
        location: [nonEmpty("normalizedLocation"), ...bucketByCount("normalizedLocation"), { $limit: 15 }],
        experienceLevel: [
          { $match: { experienceLevel: { $type: "number" } } },
          {
            $bucket: {
              groupBy: "$experienceLevel",
              boundaries: [0, 2, 5, 8, 100],
              default: "8+",
              output: { count: { $sum: 1 } },
            },
          },
        ],
      },
    },
  ];
}

const EXPERIENCE_LABELS = { 0: "0-1 yrs", 2: "2-4 yrs", 5: "5-7 yrs", 8: "8+ yrs", "8+": "8+ yrs" };

/** Shape the raw `$facet` output into `{ facet: [{ value, label?, count }] }`. */
export function shapeFacets(raw = {}) {
  const clean = (rows) =>
    (rows || [])
      .filter((r) => r && r._id !== null && r._id !== "")
      .map((r) => ({ value: String(r._id), count: r.count }));
  return {
    remoteType: clean(raw.remoteType),
    jobType: clean(raw.jobType),
    seniority: clean(raw.seniority),
    source: clean(raw.source),
    location: clean(raw.location),
    experienceLevel: (raw.experienceLevel || []).map((r) => ({
      value: String(r._id),
      label: EXPERIENCE_LABELS[r._id] || String(r._id),
      count: r.count,
    })),
  };
}

function groupSort(sort) {
  switch (sort) {
    case "oldest":
      return { postedAt: 1, createdAt: 1 };
    case "salary":
    case "salary_desc":
      // groups with no salary sort last (Mongo puts missing values first on -1,
      // so pair with postedAt as the stable tiebreak)
      return { salaryMax: -1, salaryMin: -1, postedAt: -1 };
    case "salary_asc":
      return { salaryMin: 1, postedAt: -1 };
    case "experience_asc":
      return { experienceLevel: 1, postedAt: -1 };
    case "newest":
    case "relevance":
    default:
      return { postedAt: -1, lastSeenAt: -1 };
  }
}

/**
 * Phase 2 keeps sorting to what MongoDB does reliably without a $meta
 * projection: `$text` already restricts to keyword matches, and we order those
 * by recency. Genuine relevance ranking (textScore / Atlas Search) is a later
 * phase — we do not fake it here.
 */
function buildSort(sort, useTextScore) {
  switch (sort) {
    case "newest":
      return { publishedAt: -1, createdAt: -1 };
    case "oldest":
      return { publishedAt: 1, createdAt: 1 };
    case "salary_desc":
      return { salary: -1, createdAt: -1 };
    case "salary_asc":
      return { salary: 1, createdAt: -1 };
    case "experience_asc":
      return { experienceLevel: 1, createdAt: -1 };
    case "relevance":
    default:
      return useTextScore
        ? { publishedAt: -1, createdAt: -1 }
        : { featured: -1, trending: -1, publishedAt: -1, createdAt: -1 };
  }
}
