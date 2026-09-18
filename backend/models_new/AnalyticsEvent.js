import mongoose from "mongoose";

/**
 * Small, bounded, privacy-conscious product event (PLAN.md Phase 10 §10.2–10.3).
 *
 * NEVER stores password / JWT / cookie / API key / provider secret / resume text
 * / full application text / recruiter notes / phone / full profile snapshot.
 * `meta` is a tiny sanitized object (see services/analytics/events.js).
 * Auto-expires after 90 days — analytics is aggregate, not an archive.
 *
 * A single schema (not one per event type) keeps the surface minimal.
 */
const ANALYTICS_EVENT_TYPES = [
  "job_view",
  "job_apply_click",
  "job_saved",
  "job_unsaved",
  "job_dismissed",
  "recommendation_impression",
  "recommendation_clicked",
  "recommendation_saved",
  "recommendation_applied",
  "recommendation_refreshed",
  "search_performed",
  "search_zero_result",
  "source_filtered",
];

const schema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ANALYTICS_EVENT_TYPES, index: true },
    // hashed/opaque user id when known — never PII. May be absent (anonymous).
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    groupKey: { type: String, default: "" }, // a JobGroup dedupeHash, never a raw Job id
    schemaVersion: { type: Number, default: 1 },
    meta: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

schema.index({ type: 1, at: -1 });
schema.index({ userRef: 1, type: 1, at: -1 });
schema.index({ at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const ANALYTICS_EVENTS = ANALYTICS_EVENT_TYPES;
export const AnalyticsEvent =
  mongoose.models.AnalyticsEvent || mongoose.model("AnalyticsEvent", schema);
