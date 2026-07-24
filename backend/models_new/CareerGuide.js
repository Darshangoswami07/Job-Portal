import mongoose from "mongoose";

const guideSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: "" },
  order: { type: Number, default: 0 },
});

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: Number },
  explanation: { type: String, default: "" },
});

const careerGuideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  category: { type: String, required: true },
  subcategory: { type: String, default: "" },
  tags: [{ type: String }],
  level: { type: String, enum: ["beginner", "intermediate", "advanced", "all"], default: "all" },
  difficulty: { type: Number, min: 1, max: 10, default: 5 },
  readTime: { type: Number, default: 5 },
  completionTime: { type: Number, default: 0 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  beginnerFriendly: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  sections: [guideSectionSchema],
  quiz: [quizQuestionSchema],
  resources: [{ type: String }],
  references: [{ type: String }],
  downloads: [{ type: String }],
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  publishedAt: { type: Date },
  updatedAt: { type: Date },
}, { timestamps: true });

careerGuideSchema.index({ category: 1, status: 1 });
careerGuideSchema.index({ title: "text", content: "text", excerpt: "text", tags: "text" });
careerGuideSchema.index({ status: 1, featured: 1, trending: 1, createdAt: -1 });
careerGuideSchema.index({ level: 1, status: 1 });
careerGuideSchema.index({ author: 1, status: 1 });

export const CareerGuide = mongoose.model("CareerGuide", careerGuideSchema);