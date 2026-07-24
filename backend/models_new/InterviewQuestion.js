import mongoose from "mongoose";

const interviewQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: "" },
  explanation: { type: String, default: "" },
  category: { type: String, required: true, index: true },
  subcategory: { type: String, default: "" },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium", index: true },
  company: { type: String, default: "General" },
  companies: [{ type: String }],
  tags: [{ type: String }],
  technology: { type: String, default: "" },
  role: { type: String, default: "" },
  experienceLevel: { type: String, enum: ["entry", "junior", "mid", "senior", "lead"], default: "mid" },
  codeSnippet: { type: String, default: "" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  votes: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },
  timeEstimate: { type: Number, default: 5 },
  commonMistakes: { type: String, default: "" },
  bestPractices: { type: String, default: "" },
  followUpQuestions: [{ type: String }],
  relatedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "InterviewQuestion" }],
  companyFrequency: { type: Map, of: Number, default: {} },
  isPremium: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true, index: true },
  source: { type: String, default: "curated" },
  viewedCount: { type: Number, default: 0 },
  solvedCount: { type: Number, default: 0 },
}, { timestamps: true });

interviewQuestionSchema.index({ category: 1, difficulty: 1, isPublished: 1 });
interviewQuestionSchema.index({ question: "text", answer: "text", explanation: "text" });
interviewQuestionSchema.index({ company: 1 });
interviewQuestionSchema.index({ technology: 1 });
interviewQuestionSchema.index({ tags: 1 });
interviewQuestionSchema.index({ isPublished: 1, popularity: -1 });

export const InterviewQuestion = mongoose.model("InterviewQuestion", interviewQuestionSchema);
