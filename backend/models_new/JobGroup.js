import mongoose from "mongoose";

/**
 * A single real vacancy that may be available from multiple sources
 * (see PLAN.md §10.2 / §13). One JobGroup per `dedupeHash`.
 *
 * Phase 4: JobGroup is the primary document for search. It is fully
 * denormalized from its "best" member Job so the search API returns one card
 * per vacancy without touching the Job collection (except an optional company
 * populate for the logo).
 */
const jobGroupSourceSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "JobSource" },
    sourceName: { type: String, default: "" },
    sourceType: { type: String, default: "internal" },
    applyUrl: { type: String, default: "" },
    applyType: { type: String, enum: ["internal", "external"], default: "internal" },
    status: { type: String, default: "active" },
    postedAt: { type: Date },
    lastSeenAt: { type: Date },
    lastVerifiedAt: { type: Date },
  },
  { _id: false }
);

const jobGroupSchema = new mongoose.Schema(
  {
    dedupeHash: { type: String, required: true, unique: true },

    displayTitle: { type: String, default: "" },
    normalizedTitle: { type: String, default: "" },
    companyName: { type: String, default: "" },
    normalizedCompany: { type: String, default: "" },
    companyDomain: { type: String, default: "" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }, // for logo
    location: { type: String, default: "" },
    normalizedLocation: { type: String, default: "" },
    remoteType: {
      type: String,
      enum: ["remote", "hybrid", "onsite", "unknown"],
      default: "unknown",
    },
    seniority: { type: String, default: "" },
    jobType: { type: String, default: "" },
    industry: { type: String, default: "" },
    department: { type: String, default: "" },
    experienceLevel: { type: Number },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    salaryCurrency: { type: String, default: "" },
    skills: [{ type: String }],
    descriptionPreview: { type: String, default: "" },

    sources: { type: [jobGroupSourceSchema], default: [] },
    bestJobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    activeSourceCount: { type: Number, default: 0 },
    sourceNames: [{ type: String }], // flat list for cheap facet/filter

    // Phase 7: Level-3 similarity assist provenance. `memberHashes` is the set of
    // distinct deterministic dedupe hashes folded into this group; `autoMerged`
    // is true when that set has more than one entry (i.e. the group only exists
    // because of the similarity assist) — the admin "split" action uses both.
    memberHashes: { type: [String], default: [] },
    autoMerged: { type: Boolean, default: false },

    postedAt: { type: Date },
    firstSeenAt: { type: Date },
    lastSeenAt: { type: Date },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// Search + facet indexes (PLAN.md §25 — only what the grouped query patterns use)
jobGroupSchema.index({ displayTitle: "text", companyName: "text", skills: "text" });
jobGroupSchema.index({ status: 1, postedAt: -1 });
jobGroupSchema.index({ status: 1, remoteType: 1, salaryMin: 1 });
jobGroupSchema.index({ status: 1, jobType: 1 });
jobGroupSchema.index({ normalizedCompany: 1, status: 1 });
jobGroupSchema.index({ sourceNames: 1, status: 1 });
jobGroupSchema.index({ "sources.jobId": 1 });

export const JobGroup =
  mongoose.models.JobGroup || mongoose.model("JobGroup", jobGroupSchema);
