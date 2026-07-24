import mongoose from "mongoose";

const resumeTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  category: { type: String, required: true },
  previewImage: { type: String, default: "" },
  thumbnail: { type: String, default: "" },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  colors: {
    primary: { type: String, default: "#0A66C2" },
    secondary: { type: String, default: "#1F2937" },
    accent: { type: String, default: "#E5E7EB" },
  },
  font: { type: String, default: "Inter" },
  layout: { type: String, default: "modern" },
  structure: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

resumeTemplateSchema.index({ category: 1, isActive: 1 });
resumeTemplateSchema.index({ downloads: -1 });

export const ResumeTemplate = mongoose.model("ResumeTemplate", resumeTemplateSchema);
