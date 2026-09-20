import mongoose from "mongoose";

import { AdminAudit } from "../models_new/AdminAudit.js";

const MAX_LIMIT = 50;
const SECRET_META_KEY = /(ref|key|secret|token|password|credential|auth)/i;

/** Defensive: strip any value that looks secret-ish from an audit meta object. */
function safeMeta(meta) {
  if (!meta || typeof meta !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SECRET_META_KEY.test(k)) out[k] = "***";
    else if (v && typeof v === "object") out[k] = "[object]";
    else out[k] = v;
  }
  return out;
}

function toAuditDTO(row) {
  return {
    id: row._id,
    at: row.createdAt,
    action: row.action,
    targetType: row.targetType,
    targetKey: row.targetKey || "",
    targetId: row.targetId || null,
    actor: row.userId
      ? { id: row.userId._id || row.userId, name: row.userId.fullname || "", email: row.userId.email || "" }
      : null,
    meta: safeMeta(row.meta),
  };
}

// ── GET /api/v1/admin/audit ──────────────────────────────────────────────
export const listAuditLog = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = String(req.query.action).slice(0, 60);
    if (req.query.targetKey) filter.targetKey = String(req.query.targetKey).slice(0, 120);
    if (req.query.sourceId && mongoose.isValidObjectId(req.query.sourceId)) {
      filter.targetId = new mongoose.Types.ObjectId(req.query.sourceId);
    }
    if (req.query.userId && mongoose.isValidObjectId(req.query.userId)) {
      filter.userId = new mongoose.Types.ObjectId(req.query.userId);
    }
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      return res.status(400).json({ success: false, message: "Invalid from/to date" });
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    const [rows, total] = await Promise.all([
      AdminAudit.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullname email")
        .lean(),
      AdminAudit.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        entries: rows.map(toAuditDTO),
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  } catch (error) {
    console.error("listAuditLog error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load audit log" });
  }
};
