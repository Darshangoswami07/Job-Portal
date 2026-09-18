import mongoose from "mongoose";

/**
 * A permanent "never auto-merge these two group keys again" record, created when
 * an admin splits a JobGroup that the Level-3 similarity assist merged by
 * mistake (PLAN.md §7 — group split). The deterministic Level-1/2 hash is not
 * affected; this only suppresses the similarity assist for the specific pair.
 *
 * `keyA` / `keyB` are group keys (a Job.groupKey, which defaults to its
 * dedupeHash). Stored in sorted order so the pair is unique regardless of the
 * order the two jobs were seen in.
 */
const mergeBlockSchema = new mongoose.Schema(
  {
    keyA: { type: String, required: true },
    keyB: { type: String, required: true },
    reason: { type: String, default: "" },
    createdByEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

mergeBlockSchema.index({ keyA: 1, keyB: 1 }, { unique: true });

/** Normalize a pair into sorted [low, high] order. */
export function orderedPair(a, b) {
  const x = String(a || "");
  const y = String(b || "");
  return x <= y ? [x, y] : [y, x];
}

export const MergeBlock =
  mongoose.models.MergeBlock || mongoose.model("MergeBlock", mergeBlockSchema);
