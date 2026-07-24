import mongoose from "mongoose";

const salaryDataSchema = new mongoose.Schema({
  role: { type: String, required: true },
  location: { type: String, required: true },
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
}, { timestamps: true });

salaryDataSchema.index({ role: 1, location: 1 });
salaryDataSchema.index({ role: "text", company: "text" });

export const SalaryData = mongoose.model("SalaryData", salaryDataSchema);
