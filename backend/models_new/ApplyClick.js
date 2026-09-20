import mongoose from "mongoose";

/**
 * Minimal record of an external "Apply" click (PLAN.md §10.5 / §19).
 *
 * Stores only what is needed for source-health / abuse signals — NO resume,
 * NO application contents, NO credentials. Auto-expires after 180 days.
 */
const applyClickSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "JobGroup" },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "JobSource" },
    sourceName: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null for anonymous
    applyType: { type: String, default: "external" },
  },
  { timestamps: true }
);

applyClickSchema.index({ jobId: 1, createdAt: -1 });
applyClickSchema.index({ sourceId: 1, createdAt: -1 });
applyClickSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export const ApplyClick =
  mongoose.models.ApplyClick || mongoose.model("ApplyClick", applyClickSchema);
