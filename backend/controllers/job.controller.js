import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";
import { JobGroup } from "../models_new/JobGroup.js";
import { ApplyClick } from "../models_new/ApplyClick.js";
import { syncCompanyOnJobCreate } from "../services/companyAggregator.js";
import {
  parseSearchParams,
  buildGroupSearchFilter,
  buildFacetPipeline,
  shapeFacets,
  computeFreshness,
} from "../services/jobs/search.js";
import { JobSource } from "../models_new/JobSource.js";
import { knownAdapters, validateSourceConfig } from "../services/sources/configValidation.js";
import { ingestInternalJobById, handleJobRemoved } from "../services/jobs/ingest.js";
import { isSafeRedirectUrl } from "../services/sources/httpClient.js";
import { recordEvent } from "../services/analytics/events.js";

const CLOSED_STATUSES = ["expired", "filled", "removed", "error"];

/** Shape one JobGroup document into a stable, card-friendly search DTO. */
function toGroupCardDTO(g, match) {
  const activeSources = (g.sources || []).filter((s) => s.status === "active");
  const bestSource =
    activeSources.find((s) => String(s.jobId) === String(g.bestJobId)) || activeSources[0] || {};
  return {
    ...(match
      ? {
          matchScore: match.score,
          matchPercent: Math.round(match.score * 100),
          matchConfidence: match.confidence,
          matchLabel: match.label,
        }
      : {}),
    _id: g.bestJobId, // real Job id → routing, saved jobs, apply all keep working
    id: g.bestJobId,
    groupId: g._id,
    title: g.displayTitle,
    company: {
      name: g.companyName || g.company?.name || "",
      logo: g.company?.logo || "",
      domain: g.companyDomain || "",
    },
    companyName: g.companyName,
    location: g.location,
    remoteType: g.remoteType,
    jobType: g.jobType || "",
    seniority: g.seniority || "",
    salary: Number.isFinite(g.salaryMin) ? g.salaryMin : undefined,
    salaryMin: g.salaryMin,
    salaryMax: g.salaryMax,
    salaryCurrency: g.salaryCurrency || "",
    description: g.descriptionPreview || "",
    skills: g.skills || [],
    postedAt: g.postedAt,
    createdAt: g.postedAt,
    freshness: computeFreshness(g).label,
    sourceName: bestSource.sourceName || (g.sourceNames || [])[0] || "",
    applyType: bestSource.applyType || "internal",
    sourceCount: activeSources.length,
    sources: activeSources.map((s) => ({
      jobId: s.jobId,
      sourceName: s.sourceName,
      sourceType: s.sourceType,
      applyType: s.applyType,
      applyUrl: s.applyType === "internal" ? null : s.applyUrl || null,
    })),
  };
}

const runInternalIngest = (jobId, label) => {
  ingestInternalJobById(jobId).catch((err) =>
    console.error(`internal ingest after ${label} failed:`, err.message)
  );
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeKeyword = (value) =>
  String(value || "").trim().replace(/\s+/g, " ");

const toKeywordRegex = (value) => new RegExp(escapeRegex(value), "i");

export const postJob = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    if (!user) {
      return res.status(401).json({
        message: "User not found, please login again",
        success: false,
      });
    }
    if (!user.roles?.recruiter) {
      return res.status(403).json({
        message: "Enable recruiter mode in profile settings to post jobs",
        success: false,
      });
    }
    if (user.profile?.verificationStatus === "rejected") {
      return res.status(403).json({
        message: "Recruiter profile was not approved. Please contact support to post jobs.",
        success: false,
      });
    }

    const {
      title, description, requirements, responsibilities, niceToHave,
      skills, benefits, location, city, country, jobType, workType,
      salary, salaryMin, salaryMax, salaryCurrency,
      experience, experienceMin, experienceMax,
      position, companyId, industry, department,
      tags, deadline, easyApply, remoteFriendly, visaSponsorship,
      workAuthorization, interviewDifficulty,
    } = req.body;

    const userId = req.id;

    if (!title || !description || !location || !jobType || !salary || !position || !companyId) {
      return res.status(400).json({
        message: "Title, description, location, job type, salary, position, and company are required",
        success: false,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company selected",
        success: false,
      });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

    const job = await Job.create({
      title, slug, description,
      requirements: requirements ? (Array.isArray(requirements) ? requirements : requirements.split(",")) : [],
      responsibilities: responsibilities || [],
      niceToHave: niceToHave || [],
      skills: skills || [],
      benefits: benefits || [],
      location, city, country: country || "India",
      jobType, workType: workType || "On-site",
      salary: toNumber(salary) ?? 0,
      salaryMin: toNumber(salaryMin),
      salaryMax: toNumber(salaryMax),
      salaryCurrency: salaryCurrency || "INR",
      experienceLevel: toNumber(experience) ?? 0,
      experienceMin: toNumber(experienceMin),
      experienceMax: toNumber(experienceMax),
      position: toNumber(position) ?? 0,
      company: companyId,
      created_by: userId,
      industry: industry || "",
      department: department || "",
      tags: tags || [],
      deadline: deadline || undefined,
      easyApply: easyApply || false,
      remoteFriendly: remoteFriendly || false,
      visaSponsorship: visaSponsorship || false,
      workAuthorization: workAuthorization || "Any",
      interviewDifficulty: interviewDifficulty || "medium",
      publishedAt: new Date(),
    });

    syncCompanyOnJobCreate(job);
    runInternalIngest(job._id, "postJob");

    return res.status(201).json({
      message: "Job created successfully",
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error in postJob:", error);
    return res.status(500).json({
      message: "Server error while creating job",
      success: false,
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const {
      keyword, location, city, country,
      jobType, workType,
      salary, salaryMin, salaryMax,
      experience, experienceMin, experienceMax,
      industry, department, skills, tags,
      remote, featured, trending, urgent, verified,
      easyApply, visaSponsorship,
      sort, page = 1, limit = 12,
    } = req.query;

    let query = { isActive: true };

    const andClauses = [];

    if (keyword) {
      const normalized = normalizeKeyword(keyword);
      if (normalized) {
        const kw = toKeywordRegex(normalized);
        const conditions = [
          { title: kw },
          { description: kw },
          { location: kw },
          { city: kw },
          { country: kw },
          { jobType: kw },
          { workType: kw },
          { industry: kw },
          { department: kw },
          { skills: { $in: [kw] } },
          { tags: { $in: [kw] } },
        ];

        const companyIds = await Company.find({ name: kw })
          .select("_id")
          .lean();
        if (companyIds.length) {
          conditions.push({ company: { $in: companyIds.map((c) => c._id) } });
        }

        andClauses.push({ $or: conditions });
      }
    }
    if (location) query.location = toKeywordRegex(location);
    if (city) query.city = toKeywordRegex(city);
    if (country) query.country = toKeywordRegex(country);
    if (jobType) query.jobType = toKeywordRegex(jobType);
    if (workType) query.workType = toKeywordRegex(workType);
    if (industry) query.industry = toKeywordRegex(industry);
    if (department) query.department = toKeywordRegex(department);
    if (skills) {
      const skillArr = skills.split(",");
      query.skills = { $in: skillArr.map((s) => toKeywordRegex(s.trim())) };
    }
    if (tags) {
      const tagArr = tags.split(",");
      query.tags = { $in: tagArr.map((t) => toKeywordRegex(t.trim())) };
    }
    if (remote === "true") {
      andClauses.push({ $or: [{ workType: "Remote" }, { remoteFriendly: true }] });
    }
    if (featured === "true") query.featured = true;
    if (trending === "true") query.trending = true;
    if (urgent === "true") query.urgent = true;
    if (verified === "true") query.verified = true;
    if (easyApply === "true") query.easyApply = true;
    if (visaSponsorship === "true") query.visaSponsorship = true;

    if (salary) query.salary = { $gte: Number(salary) };
    if (salaryMin || salaryMax) {
      query.salary = {};
      if (salaryMin) query.salary.$gte = Number(salaryMin);
      if (salaryMax) query.salary.$lte = Number(salaryMax);
    }
    if (experience) query.experienceLevel = { $gte: Number(experience) };
    if (experienceMin || experienceMax) {
      query.experienceLevel = {};
      if (experienceMin) query.experienceLevel.$gte = Number(experienceMin);
      if (experienceMax) query.experienceLevel.$lte = Number(experienceMax);
    }

    if (andClauses.length) {
      query.$and = andClauses;
    }

    let sortOption = { featured: -1, trending: -1, publishedAt: -1 };
    if (sort === "salary_asc") sortOption = { salary: 1 };
    else if (sort === "salary_desc") sortOption = { salary: -1 };
    else if (sort === "oldest") sortOption = { publishedAt: 1 };
    else if (sort === "views") sortOption = { views: -1 };
    else if (sort === "applicants") sortOption = { applicantsCount: -1 };
    else if (sort === "ai_match") sortOption = { aiMatch: -1 };
    else if (sort === "experience_asc") sortOption = { experienceLevel: 1 };
    else if (sort === "experience_desc") sortOption = { experienceLevel: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, totalJobs, allIndustries, allDepartments, allWorkTypes, allJobTypes] = await Promise.all([
      Job.find(query)
        .populate({ path: "company" })
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query),
      Job.distinct("industry", { isActive: true, industry: { $ne: "" } }),
      Job.distinct("department", { isActive: true, department: { $ne: "" } }),
      Job.distinct("workType", { isActive: true }),
      Job.distinct("jobType", { isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      jobs,
      totalJobs,
      currentPage: Number(page),
      totalPages: Math.ceil(totalJobs / Number(limit)),
      filters: {
        industries: allIndustries.sort(),
        departments: allDepartments.sort(),
        workTypes: allWorkTypes.sort(),
        jobTypes: allJobTypes.sort(),
      },
    });
  } catch (error) {
    console.error("Error in getAllJobs:", error);
    return res.status(500).json({
      message: "Server error while fetching jobs",
      success: false,
    });
  }
};

/**
 * Names of sources a user may filter by: enabled, backed by a known adapter,
 * and holding a valid config. A disabled source's jobs can still be active
 * (disabling never deletes data) but it must not appear as a filter option.
 */
async function listConfiguredSourceNames() {
  const known = new Set(knownAdapters());
  const rows = await JobSource.find({ enabled: true }).select("name adapter config").lean();
  const names = new Set();
  for (const s of rows) {
    if (!s.name || !known.has(s.adapter)) continue;
    const v = validateSourceConfig(s.adapter, s.config || {});
    if (v && v.error) continue;
    names.add(s.name);
  }
  return [...names];
}

// Phase 11: server-side search suggestions from REAL indexed JobGroup data.
// Bounded (query length, result count). Never fabricates a suggestion.
export const getSearchSuggestions = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 50);
    if (q.length < 2) return res.status(200).json({ success: true, suggestions: [] });

    const rx = new RegExp("\\b" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const rows = await JobGroup.find(
      {
        status: "active",
        $or: [{ displayTitle: rx }, { companyName: rx }, { normalizedLocation: rx }, { skills: rx }],
      },
      { displayTitle: 1, companyName: 1, location: 1, skills: 1 }
    )
      .limit(40)
      .lean();

    const seen = new Set();
    const out = [];
    const add = (type, value) => {
      const v = String(value || "").trim();
      const key = `${type}:${v.toLowerCase()}`;
      if (!v || seen.has(key) || !rx.test(v)) return;
      seen.add(key);
      out.push({ type, value: v });
    };
    for (const g of rows) {
      add("title", g.displayTitle);
      add("company", g.companyName);
      add("location", g.location);
      for (const s of g.skills || []) add("skill", s);
      if (out.length >= 8) break;
    }
    return res.status(200).json({ success: true, suggestions: out.slice(0, 8) });
  } catch (error) {
    console.error("getSearchSuggestions error:", error.message);
    return res.status(200).json({ success: true, suggestions: [] });
  }
};

// Phase 4: JobGroup-first server-side search. One card per deduped vacancy
// (never the same job twice). Filters/sorts/paginates in MongoDB — the client
// never downloads the whole catalogue and never waits on an external source.
// The legacy GET /get endpoint is kept for un-migrated consumers.
export const searchJobs = async (req, res) => {
  try {
    const parsed = parseSearchParams(req.query);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { params } = parsed;
    const { filter, sort, textScore, personalize } = buildGroupSearchFilter(params);

    // Phase 8: "recommended" sort personalizes AFTER retrieval, but only for a
    // logged-in user with real profile signal. Explicit keyword intent stays
    // dominant — re-ranking happens WITHIN the keyword-matched candidate set.
    const doPersonalize = personalize && !!req.id;
    const windowSize = doPersonalize
      ? Math.min(params.limit * 5, 120)
      : params.limit;
    const skip = doPersonalize ? 0 : (params.page - 1) * params.limit;

    const pageQuery = JobGroup.find(filter);
    if (textScore) pageQuery.select({ score: { $meta: "textScore" } });

    const [groups, total, facetRaw, configuredSources] = await Promise.all([
      pageQuery
        .sort(sort)
        .skip(skip)
        .limit(windowSize)
        .populate("company", "name logo") // single batched populate — no N+1
        .lean(),
      JobGroup.countDocuments(filter),
      JobGroup.aggregate(buildFacetPipeline(filter)), // one round-trip, all facets
      listConfiguredSourceNames(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / params.limit));
    const facets = shapeFacets(facetRaw[0] || {});
    // the source filter only offers sources that are actually configured today
    const selectable = new Set(configuredSources);
    facets.source = facets.source.filter((s) => selectable.has(s.value));

    let jobs;
    let personalized = false;
    if (doPersonalize && groups.length) {
      try {
        const { buildUserProfileVector } = await import("../services/jobs/userProfile.js");
        const { matchUserToJob, matchLabel } = await import("../services/jobs/matching.js");
        const user = await User.findById(req.id).select("profile").lean();
        const profile = user ? buildUserProfileVector(user, {}) : { hasSignal: false };
        if (profile.hasSignal) {
          const ranked = groups
            .map((g, i) => {
              const m = matchUserToJob(profile, g);
              // base position weight (keeps relevance/recency meaningful) + match
              const base = 1 - i / groups.length;
              return { g, m: { ...m, label: matchLabel(m.score) }, blended: 0.45 * base + 0.55 * m.score };
            })
            .sort((a, b) => b.blended - a.blended)
            .slice((params.page - 1) * params.limit, (params.page - 1) * params.limit + params.limit);
          jobs = ranked.map(({ g, m }) => toGroupCardDTO(g, m));
          personalized = true;
        }
      } catch (err) {
        console.warn("personalized search fell back:", err.message);
      }
    }
    if (!jobs) {
      jobs = (doPersonalize ? groups.slice((params.page - 1) * params.limit, params.page * params.limit) : groups)
        .map((g) => toGroupCardDTO(g));
    }

    // analytics (best-effort, non-blocking) — only on the first page of a query
    if (params.page === 1) {
      const q = (params.q || "").slice(0, 80);
      recordEvent("search_performed", {
        userId: req.id,
        meta: { q, total, sort: params.sort, hasFilters: Boolean(params.source || params.location || params.remoteType || params.jobType) },
      });
      if (total === 0) recordEvent("search_zero_result", { userId: req.id, meta: { q } });
      if (params.source) recordEvent("source_filtered", { userId: req.id, meta: { source: String(params.source).slice(0, 60) } });
    }

    return res.status(200).json({
      success: true,
      jobs,
      pagination: { page: params.page, limit: params.limit, total, totalPages },
      meta: {
        sources: [...selectable].sort(),
        facets,
        sort: params.sort,
        grouped: true,
        personalized,
      },
    });
  } catch (error) {
    console.error("Error in searchJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while searching jobs",
    });
  }
};

// Phase 4: safe external Apply. The client sends only a job id; the destination
// URL is loaded from MongoDB and validated — a client can never supply a URL.
export const applyRedirect = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid job id" });
    }

    const job = await Job.findById(id).select(
      "status isActive applyType applyUrl originalUrl sourceId sourceName groupId title"
    );
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    if (job.isActive === false || CLOSED_STATUSES.includes(job.status)) {
      return res.status(410).json({ success: false, message: "This listing is no longer available" });
    }
    if (job.applyType === "internal") {
      return res.status(409).json({
        success: false,
        applyType: "internal",
        message: "This job uses the in-platform application flow",
      });
    }

    const url = job.applyUrl || job.originalUrl || "";
    if (!isSafeRedirectUrl(url)) {
      return res
        .status(422)
        .json({ success: false, message: "No valid external application link for this job" });
    }

    // Awaited but non-fatal: a failed click write must not block the redirect.
    await ApplyClick.create({
      jobId: job._id,
      groupId: job.groupId,
      sourceId: job.sourceId,
      sourceName: job.sourceName,
      userId: req.id || undefined,
      applyType: "external",
    }).catch((e) => console.error("ApplyClick write failed:", e.message));
    recordEvent("job_apply_click", { userId: req.id, meta: { source: job.sourceName || "", applyType: "external" } });

    if (req.method === "GET") return res.redirect(302, url);
    return res.status(200).json({ success: true, url, sourceName: job.sourceName });
  } catch (error) {
    console.error("Error in applyRedirect:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findByIdAndUpdate(
      jobId,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate({ path: "company" })
      .populate({ path: "applications" });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    const related = await Job.find({
      _id: { $ne: job._id },
      isActive: true,
      $or: [
        { skills: { $in: job.skills?.slice(0, 3) || [] } },
        { industry: job.industry },
        { department: job.department },
        { jobType: job.jobType },
      ],
    })
      .select("title slug location salary salaryMin salaryMax salaryCurrency company jobType workType experienceLevel skills aiMatch views applicantsCount featured urgent easyApply company")
      .populate("company", "name logo location")
      .limit(6)
      .sort({ aiMatch: -1, views: -1 });

    // Phase 4: attach the deduped group so the detail page can offer every
    // legitimate source's Apply destination (per-source URL, never mixed).
    let group = null;
    if (job.groupId) {
      const g = await JobGroup.findById(job.groupId).lean();
      if (g) {
        const active = (g.sources || []).filter((s) => s.status === "active");
        group = {
          id: g._id,
          sourceCount: active.length,
          sources: active.map((s) => ({
            jobId: s.jobId,
            sourceName: s.sourceName,
            sourceType: s.sourceType,
            applyType: s.applyType,
            applyUrl: s.applyType === "internal" ? null : s.applyUrl || null,
          })),
        };
      }
    }

    recordEvent("job_view", {
      userId: req.id,
      groupKey: group ? undefined : "",
      meta: { source: job.sourceName || job.source || "", remoteType: job.remoteType || "" },
    });

    return res.status(200).json({
      success: true,
      job,
      group,
      related,
      aiInsights: {
        aiMatch: job.aiMatch,
        atsScore: job.atsScore,
        skillMatch: job.skillMatch,
        resumeMatch: job.resumeMatch,
        missingSkills: job.missingSkills,
        interviewDifficulty: job.interviewDifficulty,
        estimatedSalary: job.estimatedSalary,
        careerGrowth: job.careerGrowth,
      },
    });
  } catch (error) {
    console.error("Error in getJobById:", error);
    return res.status(500).json({
      message: "Server error while fetching job",
      success: false,
    });
  }
};

export const getJobBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const job = await Job.findOneAndUpdate(
      { slug, isActive: true },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate({ path: "company" })
      .populate({ path: "applications" });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    const related = await Job.find({
      _id: { $ne: job._id },
      isActive: true,
      $or: [
        { skills: { $in: job.skills?.slice(0, 3) || [] } },
        { industry: job.industry },
        { department: job.department },
      ],
    })
      .select("title slug location salary salaryMin salaryMax salaryCurrency company jobType workType experienceLevel skills aiMatch views applicantsCount featured urgent easyApply company")
      .populate("company", "name logo location")
      .limit(6)
      .sort({ aiMatch: -1, views: -1 });

    return res.status(200).json({
      success: true,
      job,
      related,
      aiInsights: {
        aiMatch: job.aiMatch,
        atsScore: job.atsScore,
        skillMatch: job.skillMatch,
        resumeMatch: job.resumeMatch,
        missingSkills: job.missingSkills,
        interviewDifficulty: job.interviewDifficulty,
        estimatedSalary: job.estimatedSalary,
        careerGrowth: job.careerGrowth,
      },
    });
  } catch (error) {
    console.error("Error in getJobBySlug:", error);
    return res.status(500).json({
      message: "Server error while fetching job",
      success: false,
    });
  }
};

export const getFeaturedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, featured: true })
      .populate("company", "name logo location")
      .sort({ publishedAt: -1 })
      .limit(12);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrendingJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, trending: true })
      .populate("company", "name logo location")
      .sort({ views: -1, applicantsCount: -1 })
      .limit(12);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRemoteJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, workType: "Remote" })
      .populate("company", "name logo location")
      .sort({ featured: -1, publishedAt: -1 })
      .limit(20);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/v1/job/catalog-stats ────────────────────────────────────────
// Public, read-only. REAL aggregate counts for the marketing homepage — no
// fabricated numbers, no "+" inflation. Bounded aggregates over the active
// catalogue; a short in-process TTL cache keeps it cheap under homepage load.
let _catalogStatsCache = { at: 0, payload: null };
const CATALOG_STATS_TTL_MS = 60_000;

/** Test-only: drop the in-process catalog-stats cache. */
export const __resetCatalogStatsCache = () => {
  _catalogStatsCache = { at: 0, payload: null };
};

export const getCatalogStats = async (_req, res) => {
  try {
    if (_catalogStatsCache.payload && Date.now() - _catalogStatsCache.at < CATALOG_STATS_TTL_MS) {
      return res.status(200).json(_catalogStatsCache.payload);
    }

    const activeGroup = { status: "active" };
    const activeJob = { isActive: { $ne: false }, status: { $nin: CLOSED_STATUSES } };
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const [
      activeJobs,
      activeJobGroups,
      diversity,
      remoteJobs,
      topCategoriesAgg,
      topCompaniesAgg,
      sourceNamesAgg,
      jobsAddedToday,
    ] = await Promise.all([
      Job.countDocuments(activeJob),
      JobGroup.countDocuments(activeGroup),
      JobGroup.aggregate([
        { $match: activeGroup },
        {
          $group: {
            _id: null,
            companies: { $addToSet: "$normalizedCompany" },
            locations: { $addToSet: "$normalizedLocation" },
            departments: { $addToSet: "$department" },
          },
        },
        {
          $project: {
            _id: 0,
            companies: { $size: "$companies" },
            locations: { $size: { $setDifference: ["$locations", [""]] } },
            categories: { $size: { $setDifference: ["$departments", [""]] } },
          },
        },
      ]),
      JobGroup.countDocuments({ ...activeGroup, remoteType: "remote" }),
      JobGroup.aggregate([
        { $match: { ...activeGroup, department: { $nin: ["", null] } } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      JobGroup.aggregate([
        { $match: { ...activeGroup, companyName: { $nin: ["", null] } } },
        { $group: { _id: "$companyName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      JobGroup.aggregate([
        { $match: activeGroup },
        { $unwind: "$sourceNames" },
        { $group: { _id: "$sourceNames", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Job.countDocuments({ ...activeJob, firstSeenAt: { $gte: startOfDay } }),
    ]);

    const div = diversity[0] || { companies: 0, locations: 0, categories: 0 };
    const sourceNames = sourceNamesAgg.map((s) => s._id).filter(Boolean);

    const payload = {
      success: true,
      stats: {
        activeJobs,
        activeJobGroups,
        companies: div.companies,
        locations: div.locations,
        categories: div.categories,
        remoteJobs,
        sources: sourceNames.length,
        jobsAddedToday,
      },
      sourceNames,
      topCategories: topCategoriesAgg.map((c) => ({ name: c._id, count: c.count })),
      topCompanies: topCompaniesAgg.map((c) => ({ name: c._id, count: c.count })),
      generatedAt: new Date().toISOString(),
    };

    _catalogStatsCache = { at: Date.now(), payload };
    return res.status(200).json(payload);
  } catch (error) {
    console.error("getCatalogStats error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load catalog stats" });
  }
};

export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;
    const jobs = await Job.find({ created_by: adminId })
      .populate({ path: "company" })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      jobs: jobs || [],
      success: true,
      message: jobs && jobs.length > 0 ? "Jobs fetched successfully" : "No jobs found for this admin",
    });
  } catch (error) {
    console.error("Error in getAdminJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching admin jobs",
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    const existingJob = await Job.findById(jobId).select("created_by");
    if (!existingJob) {
      return res.status(404).json({ message: "Job not found", success: false });
    }
    if (String(existingJob.created_by) !== String(req.id)) {
      return res.status(403).json({
        message: "You can only modify jobs you posted",
        success: false,
      });
    }

    const updateData = {};
    const fields = [
      "title", "description", "requirements", "responsibilities", "niceToHave",
      "skills", "benefits", "location", "city", "country",
      "jobType", "workType", "salary", "salaryMin", "salaryMax", "salaryCurrency",
      "experienceLevel", "experienceMin", "experienceMax",
      "position", "company", "industry", "department", "tags",
      "isActive", "featured", "trending", "urgent", "verified",
      "easyApply", "sponsored", "remoteFriendly", "visaSponsorship",
      "workAuthorization", "interviewDifficulty",
      "aiMatch", "atsScore", "skillMatch", "resumeMatch", "missingSkills",
      "estimatedSalary", "careerGrowth", "promotionPotential",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const value = req.body[field];
        if (["salary", "salaryMin", "salaryMax", "experienceLevel", "experienceMin", "experienceMax", "position", "aiMatch", "atsScore", "skillMatch", "resumeMatch"].includes(field)) {
          updateData[field] = toNumber(value) ?? 0;
        } else {
          updateData[field] = value;
        }
      }
    }

    if (req.body.experience !== undefined) updateData.experienceLevel = toNumber(req.body.experience) ?? 0;
    if (req.body.companyId !== undefined) updateData.company = req.body.companyId;

    const updated = await Job.findByIdAndUpdate(jobId, { $set: updateData }, { new: true }).populate({ path: "company" });

    if (!updated) {
      return res.status(404).json({ message: "Job not found", success: false });
    }

    syncCompanyOnJobCreate(updated);
    runInternalIngest(updated._id, "updateJob");

    res.status(200).json({ message: "Job updated successfully", success: true, job: updated });
  } catch (error) {
    console.error("Error in updateJob:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).select("created_by dedupeHash groupKey");
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (String(job.created_by) !== String(req.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete jobs you posted",
      });
    }
    const removedHash = job.groupKey || job.dedupeHash;
    await Job.findByIdAndDelete(req.params.id);
    if (removedHash) {
      handleJobRemoved({ dedupeHash: removedHash }).catch((err) =>
        console.error("group rebuild after deleteJob failed:", err.message)
      );
    }
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const incrementJobView = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, views: job.views });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobFilters = async (req, res) => {
  try {
    const [industries, departments, workTypes, jobTypes, cities] = await Promise.all([
      Job.distinct("industry", { isActive: true, industry: { $ne: "" } }),
      Job.distinct("department", { isActive: true, department: { $ne: "" } }),
      Job.distinct("workType", { isActive: true }),
      Job.distinct("jobType", { isActive: true }),
      Job.distinct("city", { isActive: true, city: { $ne: "" } }),
    ]);
    res.json({
      success: true,
      filters: {
        industries: industries.sort(),
        departments: departments.sort(),
        workTypes: workTypes.sort(),
        jobTypes: jobTypes.sort(),
        cities: cities.sort(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRelatedJobs = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    const related = await Job.find({
      _id: { $ne: job._id },
      isActive: true,
      $or: [
        { skills: { $in: job.skills?.slice(0, 3) || [] } },
        { industry: job.industry },
        { department: job.department },
      ],
    })
      .select("title slug location salary salaryMin salaryMax company jobType workType skills aiMatch views")
      .populate("company", "name logo location")
      .limit(8)
      .sort({ aiMatch: -1, views: -1 });

    res.json({ success: true, jobs: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
