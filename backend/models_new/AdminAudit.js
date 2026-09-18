import mongoose from "mongoose";

/**
 * Narrowly-scoped audit trail for admin operations on job sources
 * (Phase 5 §33). No generic framework — just who did what, when. Meta is a
 * small, sanitized object; secrets are never stored. Auto-expires after 1 year.
 */
const adminAuditSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g. "job-source.enable"
    targetType: { type: String, default: "JobSource" },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetKey: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

adminAuditSchema.index({ createdAt: -1 });
adminAuditSchema.index({ targetId: 1, createdAt: -1 });
adminAuditSchema.index({ targetKey: 1, createdAt: -1 });
adminAuditSchema.index({ action: 1, createdAt: -1 });
adminAuditSchema.index({ userId: 1, createdAt: -1 });
adminAuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export const AdminAudit =
  mongoose.models.AdminAudit || mongoose.model("AdminAudit", adminAuditSchema);
