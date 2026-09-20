/**
 * Personalized job recommendations (PLAN.md Phase 8 §20–21 + Phase 9 §17–37).
 *
 *   GET    /api/v1/recommendations/jobs                    → ranked JobGroups
 *   GET    /api/v1/recommendations/jobs/:groupId           → match explanation
 *   POST   /api/v1/recommendations/jobs/:groupId/dismiss   → "not interested"
 *   DELETE /api/v1/recommendations/jobs/:groupId/dismiss   → undo
 *
 * All require authentication and use ONLY the current logged-in user's data.
 * Recommendations operate on JobGroup. The deterministic matcher always runs;
 * the AI layer is an optional refinement that fails safe. A user with no useful
 * profile signal gets a general fallback list — never an empty page. Results are
 * cached per user for a short TTL (cache failure is never fatal).
 */
import mongoose from "mongoose";

import { JobGroup } from "../models_new/JobGroup.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js";
import SavedJob from "../models/savedJob.model.js";
import { RecommendationDismissal } from "../models_new/RecommendationDismissal.js";
import { buildUserProfileVector } from "../services/jobs/userProfile.js";
import { matchUserToJob, matchLabel, MATCHING_VERSION } from "../services/jobs/matching.js";
import { computeFreshness } from "../services/jobs/search.js";
import { refineMatches, blendMatch, isAiEnabled, AI_MATCH_VERSION } from "../services/jobs/aiMatcher.js";
import { AI_PROMPT_VERSION, classifyProviderError } from "../services/jobs/aiProvider.js";
import { recoCacheKey, cacheGet, cacheSet, invalidateUser, RECO_CACHE_TTL_MS } from "../services/jobs/recoCache.js";
import { recoMetrics } from "../services/jobs/recoMetrics.js";
import { recordEvent } from "../services/analytics/events.js";

const CANDIDATE_LIMIT = 80;
const RERANK_KEEP = 40;
const MAX_PAGE = 24;

const escapeRegex = (v) => String(v || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function loadBehaviourGroups(userId) {
  const [saved, apps] = await Promise.all([
    SavedJob.find({ userId }).sort({ createdAt: -1 }).limit(60).select("jobId").lean(),
    Application.find({ applicant: userId }).sort({ createdAt: -1 }).limit(60).select("job status").lean(),
  ]);
  const jobIds = [...new Set([...saved.map((s) => s.jobId), ...apps.map((a) => a.job)].filter(Boolean).map(String))];
  if (!jobIds.length) return { savedGroups: [], applications: [] };

  const jobs = await Job.find({ _id: { $in: jobIds } }).select("_id groupId groupKey dedupeHash").lean();
  const jobToGroupId = new Map(jobs.map((j) => [String(j._id), j.groupId ? String(j.groupId) : ""]));
  const groupIds = [...new Set([...jobToGroupId.values()].filter(Boolean))];
  const groups = groupIds.length
    ? await JobGroup.find({ _id: { $in: groupIds } })
        .select("displayTitle normalizedTitle skills normalizedLocation dedupeHash")
        .lean()
    : [];
  const byId = new Map(groups.map((g) => [String(g._id), g]));

  const savedGroups = [];
  for (const s of saved) {
    const g = byId.get(jobToGroupId.get(String(s.jobId)) || "");
    if (g) savedGroups.push(g);
  }
  const applications = [];
  for (const a of apps) {
    const g = byId.get(jobToGroupId.get(String(a.job)) || "");
    if (g) applications.push({ group: g, status: a.status });
  }
  return { savedGroups, applications };
}

async function fetchCandidates(profile, dismissedKeys) {
  const terms = [...(profile.roles || []), ...(profile.skills || []).slice(0, 12), ...(profile.roleFamilies || [])]
    .map((t) => String(t || "").trim())
    .filter((t) => t.length > 1);

  const base = { status: "active" };
  if (dismissedKeys.size) base.dedupeHash = { $nin: [...dismissedKeys] };
  let groups = [];

  if (terms.length) {
    try {
      groups = await JobGroup.find({ ...base, $text: { $search: terms.slice(0, 25).join(" ") } }, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .limit(CANDIDATE_LIMIT)
        .lean();
    } catch {
      groups = [];
    }
  }
  if (groups.length < CANDIDATE_LIMIT) {
    const have = new Set(groups.map((g) => String(g._id)));
    const or = [];
    if (profile.skills?.length) {
      or.push({ skills: { $in: profile.skills.slice(0, 15).map((s) => new RegExp(`^${escapeRegex(s)}$`, "i")) } });
    }
    if (profile.locations?.length) or.push({ normalizedLocation: { $in: profile.locations } });
    const topUp = await JobGroup.find(or.length ? { ...base, $or: or } : base)
      .sort({ postedAt: -1, lastSeenAt: -1 })
      .limit(CANDIDATE_LIMIT)
      .lean();
    for (const g of topUp) {
      if (!have.has(String(g._id))) {
        groups.push(g);
        have.add(String(g._id));
      }
      if (groups.length >= CANDIDATE_LIMIT) break;
    }
  }
  return groups;
}

function toRecoDTO(group, match) {
  const activeSources = (group.sources || []).filter((s) => s.status === "active");
  return {
    _id: group.bestJobId,
    id: group.bestJobId,
    groupId: group._id,
    title: group.displayTitle,
    company: { name: group.companyName || "", logo: group.company?.logo || "", domain: group.companyDomain || "" },
    companyName: group.companyName,
    location: group.location,
    remoteType: group.remoteType,
    jobType: group.jobType || "",
    seniority: group.seniority || "",
    salary: Number.isFinite(group.salaryMin) ? group.salaryMin : undefined,
    salaryMin: group.salaryMin,
    salaryMax: group.salaryMax,
    description: group.descriptionPreview || "",
    skills: group.skills || [],
    postedAt: group.postedAt,
    createdAt: group.postedAt,
    freshness: computeFreshness(group).label,
    sourceCount: activeSources.length,
    sourceName: activeSources[0]?.sourceName || (group.sourceNames || [])[0] || "",
    applyType: activeSources[0]?.applyType || "internal",
    sources: activeSources.map((s) => ({
      jobId: s.jobId,
      sourceName: s.sourceName,
      sourceType: s.sourceType,
      applyType: s.applyType,
      applyUrl: s.applyType === "internal" ? null : s.applyUrl || null,
    })),
    matchScore: match ? match.score : undefined,
    matchPercent: match ? Math.round(match.score * 100) : undefined,
    matchConfidence: match ? match.confidence : null,
    matchLabel: match ? matchLabel(match.score) : "",
    matchReasons: match ? match.reasons : [],
    matchGaps: match ? match.gaps : [],
  };
}

/** Which profile fields the user could add to unlock personalization. */
function missingProfileFields(p = {}) {
  const missing = [];
  if (!Array.isArray(p.skills) || !p.skills.length) missing.push("skills");
  if (!p.headline && !p.preferredJobRole) missing.push("preferredRole");
  if (!p.location) missing.push("location");
  if (!p.workPreference) missing.push("remotePreference");
  if (!Array.isArray(p.experience) || !p.experience.length) missing.push("experience");
  return missing;
}

async function fallbackList(dismissedKeys) {
  const filter = { status: "active" };
  if (dismissedKeys.size) filter.dedupeHash = { $nin: [...dismissedKeys] };
  const groups = await JobGroup.find(filter)
    .sort({ postedAt: -1, lastSeenAt: -1 })
    .limit(RERANK_KEEP)
    .populate("company", "name logo")
    .lean();
  return groups.map((g) => ({ dto: toRecoDTO(g, null) }));
}

/**
 * Build the FULL ranked recommendation list for a user (used by the endpoint
 * AND the precompute worker). Returns `{ items:[{dto}], meta }`. Uses the cache
 * unless `force`. Never throws for AI/cache reasons.
 */
export async function buildRecommendations(userId, { force = false } = {}) {
  const startedAt = Date.now();
  const user = await User.findById(userId).select("profile").lean();
  if (!user) return null;

  const [behaviour, dismissed] = await Promise.all([
    loadBehaviourGroups(userId),
    RecommendationDismissal.find({ userId }).select("groupKey").limit(500).lean(),
  ]);
  const dismissedKeys = new Set(dismissed.map((d) => d.groupKey).filter(Boolean));
  const profile = buildUserProfileVector(user, behaviour);

  const baseMeta = {
    generatedAt: new Date().toISOString(),
    matchingVersion: MATCHING_VERSION,
    aiEnabled: isAiEnabled(),
    promptVersion: AI_PROMPT_VERSION,
  };

  // ── fallback (no profile signal) ─────────────────────────────────────────
  if (!profile.hasSignal) {
    recoMetrics.recordRequest({ strategy: "fallback", totalMs: Date.now() - startedAt });
    return {
      items: await fallbackList(dismissedKeys),
      meta: {
        ...baseMeta,
        strategy: "fallback",
        personalized: false,
        aiVersion: null,
        candidateCount: 0,
        missing: missingProfileFields(user.profile),
        hint: "Add your skills, experience and preferences to get personalized recommendations.",
      },
    };
  }

  // ── cache ───────────────────────────────────────────────────────────────
  const key = recoCacheKey(userId, {
    matchingVersion: MATCHING_VERSION,
    aiVersion: isAiEnabled() ? AI_MATCH_VERSION : "-",
    promptVersion: AI_PROMPT_VERSION,
    profile,
    extra: { dismissedCount: dismissedKeys.size },
  });
  if (!force) {
    const cached = cacheGet(key);
    if (cached) {
      recoMetrics.recordCache("hit");
      recoMetrics.recordRequest({ strategy: cached.meta.strategy, candidateCount: cached.meta.candidateCount, totalMs: Date.now() - startedAt });
      return { ...cached, meta: { ...cached.meta, cached: true } };
    }
    recoMetrics.recordCache("miss");
  }

  // ── compute ─────────────────────────────────────────────────────────────
  const candidates = await fetchCandidates(profile, dismissedKeys);
  let scored = candidates
    .map((group) => ({ group, baseline: matchUserToJob(profile, group) }))
    .sort((a, b) => b.baseline.score - a.baseline.score)
    .slice(0, RERANK_KEEP);

  const aiStart = Date.now();
  const aiMap = await refineMatches(profile, scored, { classifyError: classifyProviderError }).catch(() => null);
  const aiMs = aiMap ? Date.now() - aiStart : undefined;

  scored = scored
    .map(({ group, baseline }) => ({ group, match: blendMatch(baseline, aiMap?.get(String(group._id))) }))
    .sort((a, b) => b.match.score - a.match.score);

  const strategy = aiMap ? "deterministic+ai" : "deterministic";
  const result = {
    items: scored.map(({ group, match }) => ({ dto: toRecoDTO(group, match) })),
    meta: {
      ...baseMeta,
      strategy,
      personalized: true,
      candidateCount: candidates.length,
      aiCandidateCount: aiMap ? Math.min(scored.length, 12) : 0,
      aiVersion: aiMap ? AI_MATCH_VERSION : null,
    },
  };

  try {
    cacheSet(key, result, RECO_CACHE_TTL_MS);
    recoMetrics.recordCache("store");
  } catch {
    recoMetrics.recordCache("error");
  }
  recoMetrics.recordRequest({ strategy, candidateCount: candidates.length, aiCandidateCount: result.meta.aiCandidateCount, totalMs: Date.now() - startedAt, aiMs });
  return result;
}

// ── GET /api/v1/recommendations/jobs ─────────────────────────────────────────
export const getJobRecommendations = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 12), MAX_PAGE);

    const built = await buildRecommendations(req.id).catch((e) => {
      console.error("buildRecommendations error:", e.message);
      return null;
    });
    if (!built) return res.status(500).json({ success: false, message: "Failed to build recommendations" });

    const total = built.items.length;
    const pageItems = built.items.slice((page - 1) * limit, (page - 1) * limit + limit);
    return res.status(200).json({
      success: true,
      jobs: pageItems.map((i) => i.dto),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      meta: built.meta,
    });
  } catch (error) {
    console.error("getJobRecommendations error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to build recommendations" });
  }
};

// ── GET /api/v1/recommendations/jobs/:groupId ───────────────────────────────
export const getJobMatchExplanation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.groupId)) {
      return res.status(400).json({ success: false, message: "Invalid group id" });
    }
    const [user, group] = await Promise.all([
      User.findById(req.id).select("profile").lean(),
      JobGroup.findById(req.params.groupId).lean(),
    ]);
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
    if (!group) return res.status(404).json({ success: false, message: "Job group not found" });

    const behaviour = await loadBehaviourGroups(req.id);
    const profile = buildUserProfileVector(user, behaviour);
    const dismissed = await RecommendationDismissal.exists({ userId: req.id, groupKey: group.dedupeHash });

    if (!profile.hasSignal) {
      return res.status(200).json({
        success: true,
        data: { personalized: false, dismissed: !!dismissed, hint: "Complete your profile to see why a job matches you." },
      });
    }

    const match = matchUserToJob(profile, group);
    return res.status(200).json({
      success: true,
      data: {
        personalized: true,
        dismissed: !!dismissed,
        score: match.score,
        percent: Math.round(match.score * 100),
        confidence: match.confidence,
        label: matchLabel(match.score),
        reasons: match.reasons,
        gaps: match.gaps,
        signals: match.signals,
        matchingVersion: match.version,
      },
    });
  } catch (error) {
    console.error("getJobMatchExplanation error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to explain match" });
  }
};

// ── POST /api/v1/recommendations/jobs/:groupId/dismiss ──────────────────────
export const dismissJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.groupId)) {
      return res.status(400).json({ success: false, message: "Invalid group id" });
    }
    const group = await JobGroup.findById(req.params.groupId).select("dedupeHash displayTitle").lean();
    if (!group || !group.dedupeHash) {
      return res.status(404).json({ success: false, message: "Job group not found" });
    }
    const reason = String(req.body?.reason || "").slice(0, 200);
    await RecommendationDismissal.updateOne(
      { userId: req.id, groupKey: group.dedupeHash },
      { $set: { userId: req.id, groupKey: group.dedupeHash, reason } },
      { upsert: true }
    );
    invalidateUser(req.id);
    recoMetrics.recordDismissal();
    recordEvent("job_dismissed", { userId: req.id, groupKey: group.dedupeHash });
    return res.status(200).json({ success: true, message: "Removed from your recommendations" });
  } catch (error) {
    console.error("dismissJob error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to dismiss" });
  }
};

// ── DELETE /api/v1/recommendations/jobs/:groupId/dismiss ────────────────────
export const undismissJob = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.groupId)) {
      return res.status(400).json({ success: false, message: "Invalid group id" });
    }
    const group = await JobGroup.findById(req.params.groupId).select("dedupeHash").lean();
    if (!group?.dedupeHash) return res.status(404).json({ success: false, message: "Job group not found" });
    await RecommendationDismissal.deleteOne({ userId: req.id, groupKey: group.dedupeHash });
    invalidateUser(req.id);
    return res.status(200).json({ success: true, message: "Restored" });
  } catch (error) {
    console.error("undismissJob error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to restore" });
  }
};
