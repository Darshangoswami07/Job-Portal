import mongoose from "mongoose";

const salaryDataSchema = new mongoose.Schema({
  role: { type: String, required: true, index: true },
  location: { type: String, required: true, index: true },
  minSalary: { type: Number, required: true },
  maxSalary: { type: Number, required: true },
  medianSalary: { type: Number, required: true },
  averageSalary: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  experienceLevel: { type: String, enum: ["entry", "mid", "senior", "lead"], default: "mid" },
  company: { type: String, default: "" },
  skills: [{ type: String }],
  source: { type: String, default: "aggregated" },
  reportedAt: { type: Date, default: Date.now },
  bonus: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  totalCompensation: { type: Number, default: 0 },
  annualGrowth: { type: Number, default: 0 },
  demandScore: { type: Number, default: 50 },
  department: { type: String, default: "Engineering" },
  industry: { type: String, default: "Technology" },
  employmentType: { type: String, enum: ["full-time", "contract", "part-time", "internship"], default: "full-time" },
  workMode: { type: String, enum: ["on-site", "remote", "hybrid"], default: "on-site" },
  education: { type: String, enum: ["high-school", "bachelors", "masters", "phd"], default: "bachelors" },
  seniorityScore: { type: Number, default: 50 },
  dataQualityScore: { type: Number, default: 80 },
}, { timestamps: true });

salaryDataSchema.index({ role: 1, location: 1 });
salaryDataSchema.index({ role: "text", company: "text" });

export const SalaryData = mongoose.model("SalaryData", salaryDataSchema);
