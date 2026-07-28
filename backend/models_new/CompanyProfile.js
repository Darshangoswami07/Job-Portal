import mongoose from "mongoose";

const companyProfileSchema = new mongoose.Schema({
  normalizedName: { type: String, required: true, unique: true, lowercase: true, trim: true },
  aliases: [{ type: String, trim: true }],
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  website: { type: String, default: "" },
  domain: { type: String, default: "" },
  logo: { type: String, default: "" },

  industry: { type: String, default: "Technology" },
  companySize: { type: String, default: "Unknown" },
  headquarters: { type: String, default: "" },
  foundedYear: { type: Number },

  mission: { type: String, default: "" },
  vision: { type: String, default: "" },
  culture: { type: String, default: "" },
  benefits: [{ type: String }],

  techStack: [{ type: String, trim: true }],
  locations: [{ type: String, trim: true }],

  socialLinks: {
    linkedin: { type: String },
    twitter: { type: String },
    glassdoor: { type: String },
    crunchbase: { type: String },
  },

  ratings: {
    overall: { type: Number, default: 0, min: 0, max: 5 },
    culture: { type: Number, default: 0, min: 0, max: 5 },
    workLifeBalance: { type: Number, default: 0, min: 0, max: 5 },
    compensation: { type: Number, default: 0, min: 0, max: 5 },
    careerGrowth: { type: Number, default: 0, min: 0, max: 5 },
    management: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },

  salaries: {
    minSalary: { type: Number, default: 0 },
    maxSalary: { type: Number, default: 0 },
    avgSalary: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    salaryPeriod: { type: String, default: "yearly" },
  },

  followerCount: { type: Number, default: 0 },
  openJobCount: { type: Number, default: 0 },
  totalJobCount: { type: Number, default: 0 },
  hiringStatus: {
    type: String,
    enum: ["actively_hiring", "selectively_hiring", "not_hiring", "unknown"],
    default: "unknown",
  },
  lastActive: { type: Date },
  lastSyncedAt: { type: Date },

  source: { type: String, default: "local" },
  sourceCompanyId: { type: String },
  linkedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],

  aiInsights: {
    hiringTrend: { type: String },
    growthScore: { type: Number, default: 0, min: 0, max: 100 },
    salaryPrediction: { type: String },
    stabilityScore: { type: Number, default: 0, min: 0, max: 100 },
    competitionLevel: { type: String },
    hiringVelocity: { type: String },
    techStackAnalysis: { type: String },
    interviewDifficulty: { type: String },
    lastAnalyzedAt: { type: Date },
  },
}, { timestamps: true });

companyProfileSchema.index({ name: "text", description: "text", industry: "text" });
companyProfileSchema.index({ industry: 1 });
companyProfileSchema.index({ hiringStatus: 1 });
companyProfileSchema.index({ "salaries.avgSalary": 1 });
companyProfileSchema.index({ openJobCount: -1 });
companyProfileSchema.index({ "ratings.overall": -1 });
companyProfileSchema.index({ lastActive: -1 });

export const CompanyProfile = mongoose.model("CompanyProfile", companyProfileSchema);
