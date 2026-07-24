import mongoose from "mongoose";

const roadmapStepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  resources: [{ type: String }],
  skills: [{ type: String }],
  duration: { type: String, default: "" },
  completed: { type: Boolean, default: false },
}, { _id: false });

const careerRoadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, default: "" },
  steps: [roadmapStepSchema],
  progress: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: false },
  estimatedDuration: { type: String, default: "" },
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  prerequisites: [{ type: String }],
  outcomes: [{ type: String }],
}, { timestamps: true });

careerRoadmapSchema.index({ user: 1 });
careerRoadmapSchema.index({ category: 1 });

export const CareerRoadmap = mongoose.model("CareerRoadmap", careerRoadmapSchema);
