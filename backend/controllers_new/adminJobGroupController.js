/**
 * Admin JobGroup inspection + "Split Group" (PLAN.md §7).
 *
 * This is deliberately small — NOT a data-management suite. It exists so an
 * admin can undo a Level-3 similarity FALSE POSITIVE: two distinct vacancies
 * the assist merged into one card. Splitting:
 *   - never deletes or edits a source Job
 *   - preserves every source's original / apply URL
 *   - records a MergeBlock so the pair never auto-merges again
 *   - rebuilds the affected groups deterministically
 *   - writes an AdminAudit row
 */
import mongoose from "mongoose";

import { Job } from "../models/job.model.js";
import { JobGroup } from "../models_new/JobGroup.js";
import { AdminAudit } from "../models_new/AdminAudit.js";
import { MergeBlock, orderedPair } from "../models_new/MergeBlock.js";
import { rebuildGroup } from "../services/jobs/ingest.js";

const MAX_LIMIT = 50;

const audit = (req, action, meta = {}) =>
  AdminAudit.create({
    userId: req.id,
    action,
    targetType: "JobGroup",
    targetKey: meta.groupKey || "",
    meta,
  }).catch((e) => console.error("AdminAudit write failed:", e.message));

function toGroupSummary(g) {
  return {
    id: g._id,
    groupKey: g.dedupeHash,
    title: g.displayTitle || "",
    company: g.companyName || "",
    location: g.location || "",
    remoteType: g.remoteType || "unknown",
    status: g.status,
    autoMerged: !!g.autoMerged,
    memberHashes: g.memberHashes || [],
    sourceNames: g.sourceNames || [],
    sourceCount: (g.sources || []).length,
    activeSourceCount: g.activeSourceCount || 0,
    updatedAt: g.updatedAt,
  };
}

/** Source-job rows behind a group — enough for the admin to choose a split. */
async function membersOf(groupKey) {
  const jobs = await Job.find({ groupKey })
    .select(
      "title companyName location remoteType status isActive dedupeHash sourceName sourceType " +
        "sourceId externalId originalUrl applyUrl canonicalUrl applyType postedAt lastSeenAt"
    )
    .lean();
  return jobs.map((j) => ({
    jobId: j._id,
    title: j.title,
    company: j.companyName || "",
    location: j.location || "",
    remoteType: j.remoteType || "unknown",
    status: j.status,
    isActive: j.isActive !== false,
    dedupeHash: j.dedupeHash,
    sourceName: j.sourceName || "",
    sourceType: j.sourceType || "",
    sourceId: j.sourceId || null,
    externalId: j.externalId || "",
    originalUrl: j.originalUrl || "",
    applyUrl: j.applyUrl || "",
    applyType: j.applyType || "internal",
    postedAt: j.postedAt || null,
    lastSeenAt: j.lastSeenAt || null,
  }));
}

// ── GET /api/v1/admin/job-groups ─────────────────────────────────────────
export const listJobGroups = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), MAX_LIMIT);

    const filter = {};
    if (req.query.autoMerged === "true") filter.autoMerged = true;
    if (req.query.status) filter.status = String(req.query.status).slice(0, 20);
    if (req.query.q) {
      const rx = new RegExp(String(req.query.q).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ displayTitle: rx }, { companyName: rx }];
    }

    const [rows, total] = await Promise.all([
      JobGroup.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      JobGroup.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        groups: rows.map(toGroupSummary),
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  } catch (error) {
    console.error("listJobGroups error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load job groups" });
  }
};

// ── GET /api/v1/admin/job-groups/:id ─────────────────────────────────────
export const getJobGroup = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid group id" });
    }
    const group = await JobGroup.findById(req.params.id).lean();
    if (!group) return res.status(404).json({ success: false, message: "Job group not found" });

    return res.status(200).json({
      success: true,
      data: { ...toGroupSummary(group), members: await membersOf(group.dedupeHash) },
    });
  } catch (error) {
    console.error("getJobGroup error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load job group" });
  }
};

// ── POST /api/v1/admin/job-groups/:id/split ──────────────────────────────
export const splitJobGroup = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid group id" });
    }
    const { jobId } = req.body || {};
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: "jobId (the source posting to separate) is required" });
    }

    const group = await JobGroup.findById(req.params.id).lean();
    if (!group) return res.status(404).json({ success: false, message: "Job group not found" });

    const groupKey = group.dedupeHash;
    const job = await Job.findById(jobId).select("dedupeHash groupKey").lean();
    if (!job || job.groupKey !== groupKey) {
      return res.status(400).json({ success: false, message: "That posting is not part of this group" });
    }

    const separatedHash = job.dedupeHash;
    const memberHashes = group.memberHashes || [];
    const remainingHashes = memberHashes.filter((h) => h && h !== separatedHash);
    if (!remainingHashes.length) {
      return res.status(400).json({
        success: false,
        message: "This group has only one underlying posting — there is nothing to split off",
      });
    }

    // Move the picked posting (and its exact hash-siblings) onto their own key.
    await Job.updateMany(
      { groupKey, dedupeHash: separatedHash },
      { $set: { groupKey: separatedHash } }
    );

    // If we just moved the group's anchor away, re-anchor the remaining jobs.
    let remainingKey = groupKey;
    if (separatedHash === groupKey) {
      remainingKey = [...remainingHashes].sort()[0];
      await Job.updateMany(
        { groupKey, dedupeHash: { $in: remainingHashes } },
        { $set: { groupKey: remainingKey } }
      );
    }

    // Permanent "never auto-merge again" for the split pair.
    const [x, y] = orderedPair(remainingKey, separatedHash);
    await MergeBlock.updateOne(
      { keyA: x, keyB: y },
      { $set: { keyA: x, keyB: y, reason: String(req.body?.reason || "admin split").slice(0, 200), createdByEmail: req.user?.email || "" } },
      { upsert: true }
    );

    const [separated, remaining] = await Promise.all([
      rebuildGroup(separatedHash),
      rebuildGroup(remainingKey),
    ]);
    if (groupKey !== remainingKey) await rebuildGroup(groupKey).catch(() => {});

    await audit(req, "job-group.split", {
      groupKey,
      separatedHash,
      remainingKey,
      jobId: String(jobId),
    });

    return res.status(200).json({
      success: true,
      data: {
        separated: separated ? toGroupSummary(separated.toObject ? separated.toObject() : separated) : null,
        remaining: remaining ? toGroupSummary(remaining.toObject ? remaining.toObject() : remaining) : null,
      },
    });
  } catch (error) {
    console.error("splitJobGroup error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to split job group" });
  }
};
