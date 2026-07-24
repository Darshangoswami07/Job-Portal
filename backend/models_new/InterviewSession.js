import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema({
  technicalCorrectness: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  completeness: { type: Number, default: 0 },
  relevance: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  clarity: { type: Number, default: 0 },
  grammar: { type: Number, default: 0 },
  problemSolving: { type: Number, default: 0 },
}, { _id: false });

const answerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  tags: [{ type: String }],
  answer: { type: String, default: "" },
  audioUrl: { type: String, default: "" },
  score: { type: Number, default: 0 },
  feedback: { type: String, default: "" },
  duration: { type: Number, default: 0 },
  status: { type: String, enum: ["unanswered", "correct", "partial", "incorrect"], default: "unanswered" },
  idealAnswer: { type: String, default: "" },
  professionalAnswer: { type: String, default: "" },
  shortAnswer: { type: String, default: "" },
  detailedAnswer: { type: String, default: "" },
  exampleCode: { type: String, default: "" },
  suggestions: [{ type: String }],
  strengths: [{ type: String }],
  evaluation: { type: evaluationSchema, default: () => ({}) },
});

const interviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  questions: [answerSchema],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
  timePerQuestion: { type: Number, default: 120 },
  currentQuestionIndex: { type: Number, default: 0 },
  completedAt: { type: Date },
  averageResponseTime: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  partialCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  unansweredCount: { type: Number, default: 0 },
  weakTopics: [{ type: String }],
  strongTopics: [{ type: String }],
}, { timestamps: true });

interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index({ category: 1 });

export const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);
