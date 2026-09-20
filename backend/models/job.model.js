import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, default: "" },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  responsibilities: [{ type: String }],
  niceToHave: [{ type: String }],
  skills: [{ type: String }],
  benefits: [{ type: String }],
  // salary is intentionally NOT required and has no default: external feeds
  // frequently omit it and we must not fabricate `0`.
  salary: { type: Number },
  salaryCurrency: { type: String, default: "INR" },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  // experienceLevel / position / jobType are enforced for internal recruiter
  // jobs at the controller level (postJob); relaxed here for external sources.
  experienceLevel: { type: Number },
  experienceMin: { type: Number },
  experienceMax: { type: Number },
  location: { type: String, required: true },
  city: { type: String },
  // country has no default: do not force "India" onto externally sourced jobs.
  country: { type: String },
  jobType: { type: String, enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"] },
  workType: { type: String, enum: ["Remote", "Hybrid", "On-site"], default: "On-site" },
  position: { type: Number },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],
  views: { type: Number, default: 0 },
  applicantsCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  urgent: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  easyApply: { type: Boolean, default: false },
  sponsored: { type: Boolean, default: false },
  remoteFriendly: { type: Boolean, default: false },
  visaSponsorship: { type: Boolean, default: false },
  workAuthorization: { type: String, default: "Any" },
  industry: { type: String, default: "" },
  department: { type: String, default: "" },
  aiMatch: { type: Number, default: 0 },
  atsScore: { type: Number, default: 0 },
  skillMatch: { type: Number, default: 0 },
  resumeMatch: { type: Number, default: 0 },
  missingSkills: [{ type: String }],
  interviewDifficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  estimatedSalary: { type: String, default: "" },
  careerGrowth: { type: String, default: "" },
  promotionPotential: { type: String, default: "" },
  learningResources: [{ type: String }],

  // ── Legacy source fields (kept for backward compatibility) ────────────────
  source: { type: String, default: "JobPilot Ai" },
  sourceUrl: { type: String, default: "" },
  externalId: { type: String, default: "" },
  hash: { type: String, default: "" },

  // ── Phase 1: multi-source job identity ───────────────────────────────────
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "JobSource" },
  sourceType: {
    type: String,
    enum: ["internal", "ats", "aggregator", "feed", "partner"],
    default: "internal",
  },
  sourceName: { type: String, default: "" },

  // ── Phase 1: original / apply URL preservation ───────────────────────────
  originalUrl: { type: String, default: "" },   // canonical job posting URL at the source
  applyUrl: { type: String, default: "" },      // where "Apply" should send the user
  canonicalUrl: { type: String, default: "" },  // originalUrl with tracking params stripped
  applyType: { type: String, enum: ["internal", "external"], default: "internal" },

  // ── Phase 1: normalization + company-without-a-Company-doc ───────────────
  companyName: { type: String, default: "" },
  companyDomain: { type: String, default: "" },
  normalizedTitle: { type: String, default: "" },
  normalizedCompany: { type: String, default: "" },
  normalizedLocation: { type: String, default: "" },
  remoteType: {
    type: String,
    enum: ["remote", "hybrid", "onsite", "unknown"],
    default: "unknown",
  },

  // ── Phase 1: deduplication + cross-source grouping ───────────────────────
  dedupeHash: { type: String, default: "" },
  // Phase 7: effective grouping key. Defaults to `dedupeHash`; the Level-3
  // similarity assist may point it at another job's key so near-identical
  // cross-source vacancies share one JobGroup. An admin "split" resets it.
  groupKey: { type: String, default: "" },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "JobGroup" },

  // ── Phase 1: freshness / lifecycle ──────────────────────────────────────
  postedAt: { type: Date },
  sourceUpdatedAt: { type: Date },
  firstSeenAt: { type: Date },
  lastSeenAt: { type: Date },
  lastVerifiedAt: { type: Date },
  expiresAt: { type: Date },
  status: {
    type: String,
    enum: ["active", "expired", "filled", "removed", "error"],
    default: "active",
  },
  // last raw payload from the source, for debugging. Not returned by default.
  rawSnapshot: { type: mongoose.Schema.Types.Mixed, select: false },

  tags: [{ type: String }],
  deadline: { type: Date },
  publishedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
}, { timestamps: true });

// ── Existing indexes (unchanged) ──────────────────────────────────────────
jobSchema.index({ title: "text", description: "text", skills: "text", tags: "text" });
jobSchema.index({ location: 1, isActive: 1 });
jobSchema.index({ jobType: 1, isActive: 1 });
jobSchema.index({ workType: 1, isActive: 1 });
jobSchema.index({ salary: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ industry: 1, isActive: 1 });
jobSchema.index({ featured: -1, trending: -1, createdAt: -1 });
jobSchema.index({ company: 1 });
jobSchema.index({ hash: 1 }, { sparse: true });

// ── Phase 1 indexes (see PLAN.md §10.1) ──────────────────────────────────
// One row per source feed item. Partial (not sparse) so the millions of
// legacy rows that have neither sourceId nor a real externalId are excluded
// and cannot collide on a null/"" key.
jobSchema.index(
  { sourceId: 1, externalId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceId: { $exists: true },
      externalId: { $gt: "" },
    },
  }
);
jobSchema.index({ dedupeHash: 1 });
jobSchema.index({ groupKey: 1 });
jobSchema.index({ groupId: 1 });
jobSchema.index({ status: 1, lastSeenAt: 1 });
// Phase 6: per-source counts (admin dashboard) + stale-expiry sweep.
jobSchema.index({ sourceId: 1, status: 1 });
jobSchema.index({ status: 1, remoteType: 1, salaryMin: 1 });
jobSchema.index({ normalizedCompany: 1, status: 1 });

export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
