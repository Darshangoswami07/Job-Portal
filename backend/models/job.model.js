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
  salary: { type: Number, required: true },
  salaryCurrency: { type: String, default: "INR" },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  experienceLevel: { type: Number, required: true },
  experienceMin: { type: Number },
  experienceMax: { type: Number },
  location: { type: String, required: true },
  city: { type: String },
  country: { type: String, default: "India" },
  jobType: { type: String, required: true, enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"] },
  workType: { type: String, enum: ["Remote", "Hybrid", "On-site"], default: "On-site" },
  position: { type: Number, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
  source: { type: String, default: "JobHub" },
  sourceUrl: { type: String, default: "" },
  externalId: { type: String, default: "" },
  hash: { type: String, default: "" },
  tags: [{ type: String }],
  deadline: { type: Date },
  publishedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
}, { timestamps: true });

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

export const Job = mongoose.model("Job", jobSchema);