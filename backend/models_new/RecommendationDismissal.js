import mongoose from "mongoose";

/**
 * A user's explicit "not interested" on one deduped vacancy (PLAN.md Phase 9
 * §25–31). Keyed by `groupKey` (a JobGroup's `dedupeHash` / a Job's `groupKey`)
 * so the same vacancy stays suppressed no matter which source it also appears
 * on. Idempotent: `{ userId, groupKey }` is unique — dismissing twice updates
 * the existing row.
 *
 * This is separate from `Application.status === "rejected"` — dismissed, applied,
 * rejected and saved are distinct behavioural signals.
 */
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    groupKey: { type: String, required: true },
    reason: { type: String, default: "", maxlength: 200 },
  },
  { timestamps: true }
);

schema.index({ userId: 1, groupKey: 1 }, { unique: true });
schema.index({ userId: 1, createdAt: -1 });

export const RecommendationDismissal =
  mongoose.models.RecommendationDismissal ||
  mongoose.model("RecommendationDismissal", schema);
