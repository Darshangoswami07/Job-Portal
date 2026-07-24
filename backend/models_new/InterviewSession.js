import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: "" },
  audioUrl: { type: String, default: "" },
  score: { type: Number, default: 0 },
  feedback: { type: String, default: "" },
  duration: { type: Number, default: 0 },
  aiEvaluation: {
    clarity: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    suggestion: { type: String, default: "" },
  },
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  questions: [answerSchema],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
  timePerQuestion: { type: Number, default: 120 },
  completedAt: { type: Date },
}, { timestamps: true });

interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index({ category: 1 });

export const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);
