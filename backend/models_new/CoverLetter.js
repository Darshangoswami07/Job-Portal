import mongoose from "mongoose";

const coverLetterSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Untitled Cover Letter" },
  content: { type: String, default: "" },
  recipientName: { type: String, default: "" },
  recipientTitle: { type: String, default: "" },
  companyName: { type: String, default: "" },
  companyAddress: { type: String, default: "" },
  jobTitle: { type: String, default: "" },
  yourName: { type: String, default: "" },
  yourEmail: { type: String, default: "" },
  yourPhone: { type: String, default: "" },
  yourAddress: { type: String, default: "" },
  skills: { type: [String], default: [] },
  experienceLevel: { type: String, default: "mid" },
  tone: { type: String, default: "formal" },
  body: { type: String, default: "" },
  closing: { type: String, default: "Sincerely" },
  isGenerated: { type: Boolean, default: false },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
}, { timestamps: true });

coverLetterSchema.index({ user: 1, createdAt: -1 });

export const CoverLetter = mongoose.model("CoverLetter", coverLetterSchema);
