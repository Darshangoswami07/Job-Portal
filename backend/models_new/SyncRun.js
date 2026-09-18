import mongoose from "mongoose";

/**
 * Audit record for one synchronization run of a JobSource
 * (see PLAN.md §10.4 / §22). Records are retained for 90 days via a TTL index.
 *
 * Phase 1 only defines the model + lightweight start/finish helpers in
 * services/sources/base.js. The actual sync pipeline is a later phase.
 */
const syncRunSchema = new mongoose.Schema(
  {
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "JobSource", required: true },
    sourceKey: { type: String, default: "" },

    startedAt: { type: Date, required: true },
    finishedAt: { type: Date },
    durationMs: { type: Number },

    status: {
      type: String,
      enum: ["running", "ok", "partial", "error"],
      default: "running",
    },

    fetched: { type: Number, default: 0 },
    inserted: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    unchanged: { type: Number, default: 0 },
    deactivated: { type: Number, default: 0 },
    reactivated: { type: Number, default: 0 },

    // Phase 27: run mode + provider-side ingestion diagnostics. Optional; helps
    // explain *why* a provider contributes a given volume (quota vs coverage
    // vs dedupe vs rejection). No secrets — counts only.
    mode: { type: String, enum: ["incremental", "backfill"], default: "incremental" },
    metrics: {
      type: new mongoose.Schema(
        {
          queriesRequested: { type: Number, default: 0 },
          pagesRequested: { type: Number, default: 0 },
          providerResults: { type: Number, default: 0 },
          rejected: { type: Number, default: 0 },
          deduped: { type: Number, default: 0 },
          rateLimited: { type: Number, default: 0 },
          countries: { type: [String], default: [] },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // Named `errorLog` (not `errors`) — `errors` is a reserved Mongoose path.
    errorLog: {
      type: [
        new mongoose.Schema(
          { stage: { type: String, default: "" }, message: { type: String, default: "" } },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

syncRunSchema.index({ sourceId: 1, startedAt: -1 });
// Retain audit history for 90 days.
syncRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const SyncRun =
  mongoose.models.SyncRun || mongoose.model("SyncRun", syncRunSchema);
