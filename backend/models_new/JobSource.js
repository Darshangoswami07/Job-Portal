import mongoose from "mongoose";

/**
 * Configuration for one authorized job source (see PLAN.md §10.3 / §11).
 *
 * SECURITY: credentials are NEVER stored here. `credentialRef` holds only the
 * NAME of the environment variable / platform secret to read at runtime.
 */
const jobSourceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true }, // e.g. "greenhouse:acme"
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["internal", "ats", "aggregator", "feed", "partner"],
    },
    adapter: { type: String, default: "" }, // module name under services/sources/
    enabled: { type: Boolean, default: false },

    // Non-secret configuration (board token, feed URL, country, query terms, …).
    config: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },

    // Name of the env var holding this source's credential — not the value.
    credentialRef: { type: String, default: "" },

    // Explicit cron overrides the per-adapter default cadence (see
    // services/sources/sourceSchedules.js). Empty = use the adapter/type default.
    schedule: { type: String, default: "" },
    rateLimitPerMin: { type: Number, default: 60 },
    staleAfterDays: { type: Number, default: 45 },

    lastSyncAt: { type: Date },
    lastSyncStatus: {
      type: String,
      enum: ["ok", "partial", "error", "never"],
      default: "never",
    },
    // Phase 6: last scheduled apply-link verification pass for this source.
    lastVerifyLinksAt: { type: Date },

    // Advisory lock — prevents two syncs of this source running at once.
    // `expiresAt` bounds a crashed holder so the lock self-heals.
    lock: {
      active: { type: Boolean, default: false },
      holder: { type: String, default: "" },
      acquiredAt: { type: Date },
      expiresAt: { type: Date },
    },
    health: {
      consecutiveFailures: { type: Number, default: 0 },
      lastError: { type: String, default: "" },
      lastErrorAt: { type: Date },
      // Alert de-duplication state (Phase 6). One authoritative place — no
      // separate alert model. `state` transitions gate notifications so admins
      // are not spammed every worker tick.
      alert: {
        state: {
          type: String,
          enum: ["ok", "failing", "jobDrop"],
          default: "ok",
        },
        lastNotifiedAt: { type: Date },
        // baseline active-job count from the last healthy sync, for drop detection
        baselineActiveCount: { type: Number, default: 0 },
        lastActiveCount: { type: Number, default: 0 },
      },
    },
    stats: {
      imported: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      deactivated: { type: Number, default: 0 },
      lastRunMs: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

jobSourceSchema.index({ enabled: 1, type: 1 });

/**
 * Resolve the runtime credential for this source from the environment.
 * Returns "" when no credentialRef is configured or the env var is unset.
 */
jobSourceSchema.methods.resolveCredential = function resolveCredential(env = process.env) {
  if (!this.credentialRef) return "";
  return env[this.credentialRef] || "";
};

jobSourceSchema.methods.hasCredential = function hasCredential(env = process.env) {
  return Boolean(this.resolveCredential(env));
};

export const JobSource =
  mongoose.models.JobSource || mongoose.model("JobSource", jobSourceSchema);
