import mongoose from "mongoose";

const careerGuideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  category: { type: String, required: true },
  level: { type: String, enum: ["beginner", "intermediate", "advanced", "all"], default: "all" },
  readTime: { type: Number, default: 5 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  tags: [{ type: String }],
  resources: [{ type: String }],
  publishedAt: { type: Date },
}, { timestamps: true });

careerGuideSchema.index({ category: 1, status: 1 });
careerGuideSchema.index({ title: "text", content: "text" });

export const CareerGuide = mongoose.model("CareerGuide", careerGuideSchema);
