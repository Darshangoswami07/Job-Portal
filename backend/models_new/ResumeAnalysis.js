import mongoose from "mongoose";

const resumeAnalysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalFilename: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  fileType: { type: String, enum: ["pdf", "docx"], default: "pdf" },
  fileSize: { type: Number, default: 0 },
  atsScore: { type: Number, default: 0 },
  formattingScore: { type: Number, default: 0 },
  keywordScore: { type: Number, default: 0 },
  overallScore: { type: Number, default: 0 },
  missingKeywords: [{ type: String }],
  suggestions: [{ type: String }],
  grammarIssues: [{
    issue: { type: String },
    suggestion: { type: String },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  reportPdfUrl: { type: String, default: "" },
}, { timestamps: true });

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });

export const ResumeAnalysis = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
