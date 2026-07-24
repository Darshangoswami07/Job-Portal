import mongoose from "mongoose";

const interviewQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: "" },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  company: { type: String, default: "General" },
  tags: [{ type: String }],
  codeSnippet: { type: String, default: "" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isPremium: { type: Boolean, default: false },
  source: { type: String, default: "community" },
}, { timestamps: true });

interviewQuestionSchema.index({ category: 1, difficulty: 1 });
interviewQuestionSchema.index({ question: "text" });

export const InterviewQuestion = mongoose.model("InterviewQuestion", interviewQuestionSchema);
